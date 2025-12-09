import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';

interface Message { // Cambiado 'message' a 'Message' por convención de TypeScript
  de: string;
  asunto: string;
  mensaje: string;
  fecha: string;
}

@Component({
  selector: 'app-notifications-oficiales',
  imports: [CommonModule],
  templateUrl: './notifications-oficiales.component.html',
  styleUrl: './notifications-oficiales.component.css'
})
export default class NotificationsOficialesComponent {

  authService=inject(AuthService);


  // Variables para controlar el modal
  isModalOpen: boolean = false;
  selectedMessage: Message | null = null; // Para almacenar el mensaje completo

  // Datos de ejemplo (cambié el nombre a 'messages' para que coincida con la interfaz)
  mensajes: Message[] = [ // Mantenemos 'mensajes' como nombre de la propiedad para que coincida con tu HTML
    {
      de: 'Comisión Directiva',
      asunto: 'Bienvenida',
      mensaje: `Estimado socio, es un honor contar con su pertenencia a nuestra institución. A partir de hoy, ponemos a su disposición una nueva herramienta: la credencial digital.Con ella podremos mantener una comunicación permanente con usted y avanzar hacia una administración más transparente, ágil y cercana.¡Gracias por acompañarnos en este nuevo paso!`,
      fecha: '10/12/25'
    },

  ];

  // Función para abrir el modal con el mensaje seleccionado
  openModal(message: Message): void {
    this.selectedMessage = message;
    this.isModalOpen = true;
  }

  // Función para cerrar el modal
  closeModal(): void {
    this.isModalOpen = false;
    this.selectedMessage = null; // Limpiar el mensaje seleccionado al cerrar
  }

}
