import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, HostListener , OnInit, inject} from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import domtoimage from 'dom-to-image';
import QRCode from 'qrcode';
import { HeaderCardComponent } from "../../components/header-card/header-card.component";
import { CardFrontComponent } from "../../components/card-front/card-front.component";
import { AuthService } from '../../../auth/services/auth.service';
import { User, UserData } from '../../../auth/interfaces/user.interface';

@Component({
  selector: 'app-credencial',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink,  CardFrontComponent],
  templateUrl: './credencial.component.html',
  styleUrl: './credencial.component.css'
})
export default class CredencialComponen implements OnInit {

  autService = inject(AuthService);

  user?: UserData | null;

  isFlipped: boolean = false;

  currentRotation: number = 0;
  private touchStartX: number = 0;
  private touchEndX: number = 0;
  private swipeThreshold: number = 50;

  toggleFlip(): void {
    this.isFlipped = !this.isFlipped;
  }

  get cardRotationStyle(): { transform: string } {
    return { transform: `rotateY(${this.currentRotation}deg)` };
  }

   flipCard(direction: 'left' | 'right'): void {
    if (direction === 'left') {
      // Si swipe a la izquierda, giramos 180 grados en sentido horario
      this.currentRotation += 180;
    } else { // direction === 'right'
      // Si swipe a la derecha, giramos 180 grados en sentido antihorario
      this.currentRotation -= 180;
    }
    // Opcional: Para mantener los grados dentro de 0-360 si lo necesitas,
    // aunque CSS maneja rotaciones mayores a 360 sin problema.
    // this.currentRotation = this.currentRotation % 360;
  }

   private handleSwipe(): void {
    const deltaX = this.touchEndX - this.touchStartX;

    if (Math.abs(deltaX) > this.swipeThreshold) {
      if (deltaX > 0) {
        // Deslizamiento hacia la derecha
        this.flipCard('right');
      } else {
        // Deslizamiento hacia la izquierda
        this.flipCard('left');
      }
    }
  }

  ngOnInit(): void {
    this.generateQrCode();
    this.user = this.autService.user();
    console.log(this.user);
  }

  @ViewChild('credencialCard', { static: false }) credencialCard!: ElementRef;
  userId: number = 123;  // Definimos el ID del usuario
  qrUrl: string = 'http://iugna.edu.ar'; // URL del QR generada


  downloadImage() {
    if (!this.credencialCard) {
      console.error("No se encontró la credencial.");
      return;
    }

    const card = this.credencialCard.nativeElement;
    // Generar la imagen
    this.generateImage(card);
  }

  private generateImage(card: HTMLElement) {
    setTimeout(() => {
      domtoimage.toPng(card, {
        quality: 1, // Máxima calidad
        bgcolor: 'white', // Fondo blanco
      })
      .then((dataUrl) => {
        // Crear un enlace para la descarga
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'credencial.png'; // Nombre del archivo descargado
        link.click(); // Simula el clic para descargar la imagen
      })
      .catch((error) => {
        console.error('Error al generar la imagen:', error);
      });
    }, 500); // Esperar 500ms antes de capturar la imagen
  }

  generateQrCode() {
    const userUrl = `https://iugna.edu.ar`; // URL dinámica con el ID del usuario
    QRCode.toDataURL(userUrl, { errorCorrectionLevel: 'H' }, (err, url) => {
      if (err) {
        console.error('Error al generar el QR:', err);
        return;
      }
      this.qrUrl = url; // Asignamos la URL del QR generada
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
  onTouchMove(event: TouchEvent): void {
    // event.preventDefault(); // Descomentar si quieres evitar el scroll al deslizar sobre la credencial
  }



}
