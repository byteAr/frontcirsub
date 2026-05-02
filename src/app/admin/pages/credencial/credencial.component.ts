import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import domtoimage from 'dom-to-image';
import QRCode from 'qrcode';
import { AuthService } from '../../../auth/services/auth.service';
import { InstallButtonComponent } from '../../components/install-button/install-button.component';
import { AdminNotifService } from '../../../shared/services/admin-notif.service';
import { NotifViewModalComponent } from '../../../shared/components/notif-view-modal/notif-view-modal.component';
import { AdminNotifModalComponent } from '../../components/admin-notif-modal/admin-notif-modal.component';

@Component({
  selector: 'app-credencial',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    InstallButtonComponent,
    NotifViewModalComponent,
    AdminNotifModalComponent,
  ],
  templateUrl: './credencial.component.html',
  styleUrl: './credencial.component.css',
})
export default class CredencialComponen implements OnInit {
  autService = inject(AuthService);
  adminNotifService = inject(AdminNotifService);

  user = this.autService.user;
  encuesta = this.autService._encuesta;

  isFlipped: boolean = false;
  currentRotation: number = 0;
  private touchStartX: number = 0;
  private touchEndX: number = 0;
  private swipeThreshold: number = 50;

  // Admin notifications
  userRole = signal<'superadmin' | 'sender' | null>(null);
  showAdminModal = signal(false);
  showNotifModal = signal(false);
  notifModalTitulo = signal('');
  notifModalCuerpo = signal('');

  toggleFlip(): void {
    this.isFlipped = !this.isFlipped;
  }

  get cardRotationStyle(): { transform: string } {
    return { transform: `rotateY(${this.currentRotation}deg)` };
  }

  flipCard(direction: 'left' | 'right'): void {
    if (direction === 'left') {
      this.currentRotation += 180;
    } else {
      this.currentRotation -= 180;
    }
  }

  private handleSwipe(): void {
    const deltaX = this.touchEndX - this.touchStartX;
    if (Math.abs(deltaX) > this.swipeThreshold) {
      this.flipCard(deltaX > 0 ? 'right' : 'left');
    }
  }

  ngOnInit(): void {
    this.generateQrCode();
    this.autService.checkStatus().subscribe();

    const dni = this.user()?.Persona?.[0]?.Documento;
    const userId = this.user()?.Persona?.[0]?.Id;

    if (dni) {
      this.adminNotifService.getRole(dni).subscribe({
        next: ({ role }) => this.userRole.set(role),
        error: () => this.userRole.set(null),
      });
    }

    if (userId) {
      this.adminNotifService.getMessages(userId).subscribe({
        next: ({ messages, unread }) => {
          this.adminNotifService.unreadCount.set(unread);
          if (unread > 0 && messages.length > 0) {
            this.notifModalTitulo.set(messages[0].titulo);
            this.notifModalCuerpo.set(messages[0].cuerpo);
            this.showNotifModal.set(true);
          }
        },
        error: () => {},
      });
    }
  }

  onCloseNotifModal(): void {
    this.showNotifModal.set(false);
    const userId = this.user()?.Persona?.[0]?.Id;
    if (userId) {
      this.adminNotifService.markRead(userId).subscribe({
        next: () => this.adminNotifService.unreadCount.set(0),
        error: () => {},
      });
    }
  }

  @ViewChild('credencialCard', { static: false }) credencialCard!: ElementRef;
  qrUrl: string = 'http://iugna.edu.ar';

  downloadImage() {
    if (!this.credencialCard) return;
    this.generateImage(this.credencialCard.nativeElement);
  }

  private generateImage(card: HTMLElement) {
    setTimeout(() => {
      domtoimage
        .toPng(card, { quality: 1, bgcolor: 'white' })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = 'credencial.png';
          link.click();
        })
        .catch((error) => console.error('Error al generar la imagen:', error));
    }, 500);
  }

  generateQrCode() {
    QRCode.toDataURL('https://iugna.edu.ar', { errorCorrectionLevel: 'H' }, (err, url) => {
      if (err) { console.error('Error al generar el QR:', err); return; }
      this.qrUrl = url;
    });
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].clientX;
    this.handleSwipe();
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {}

  colors = {
    selected: '#0891B2',
    active: '#00C853',
    inactive: '#BAC1CB',
  };

  benefits = {
    farmacia: this.user()?.Beneficios?.[0]?.far ?? false,
    evacuacion: this.user()?.Beneficios?.[0]?.eva ?? false,
    seg: this.user()?.Beneficios?.[0]?.seg ?? false,
    sep: this.user()?.Beneficios?.[0]?.sep ?? false,
    seguro:
      (this.user()?.Beneficios?.[0]?.seg ?? false) ||
      (this.user()?.Beneficios?.[0]?.sep ?? false),
  };

  familia = (this.user()?.GpoFamiliar?.length ?? 0) > 0;
}
