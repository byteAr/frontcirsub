import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { AdminNotifService } from '../../../shared/services/admin-notif.service';

interface Message {
  de: string;
  asunto: string;
  mensaje: string;
  fecha: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export default class NotificationsComponent implements OnInit {
  authService = inject(AuthService);
  adminNotifService = inject(AdminNotifService);

  user = this.authService.user;

  isModalOpen: boolean = false;
  selectedMessage: Message | null = null;
  mensajes: Message[] = [];

  ngOnInit(): void {
    const userId = this.user()?.Persona?.[0]?.Id;
    const apellido = this.user()?.Persona?.[0]?.Apellido ?? '';

    // Mensaje de bienvenida estático (siempre presente)
    const bienvenida: Message = {
      de: 'Departamento Afiliaciones',
      asunto: 'Bienvenida',
      mensaje: `Estimado/a Socio/a ${apellido}, tenemos el gusto de registrarlo en la credencial digital, herramienta por medio de la cual les haremos llegar la información actualizada de nuestra MUTUAL y de esta forma lograr una comunicación permanente con usted, que es lo más importante para la mutual.`,
      fecha: '06/03/26',
    };

    if (!userId) {
      this.mensajes = [bienvenida];
      return;
    }

    this.adminNotifService.getMessages(userId).subscribe({
      next: ({ messages }) => {
        // Mensajes del admin primero (más recientes), bienvenida al final
        const adminMensajes: Message[] = messages.map((m) => ({
          de: 'Departamento Afiliaciones',
          asunto: m.titulo,
          mensaje: m.cuerpo,
          fecha: new Date(m.fecha).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          }),
        }));
        this.mensajes = [...adminMensajes, bienvenida];

        // Marcar como leídos y limpiar badge
        this.adminNotifService.markRead(userId).subscribe({
          next: () => this.adminNotifService.unreadCount.set(0),
          error: () => {},
        });
      },
      error: () => {
        this.mensajes = [bienvenida];
      },
    });
  }

  openModal(message: Message): void {
    this.selectedMessage = message;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedMessage = null;
  }
}
