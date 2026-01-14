import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { Persona } from '../../../auth/interfaces/user.interface';

interface Message { // Cambiado 'message' a 'Message' por convención de TypeScript
  de: string;
  asunto: string;
  mensaje: string;
  fecha: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true, // Asegúrate de que tu componente sea standalone
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export default class NotificationsComponent {

  constructor(){
    effect(() => {
    const u = this.user();
    if (u) {
      this.familia = u.Persona;
    }
  });
   this.authService.checkStatus().subscribe();
  }

  authService=inject(AuthService)

  user = this.authService.user;

  familia:Persona[]=[];

  // Variables para controlar el modal
  isModalOpen: boolean = false;
  selectedMessage: Message | null = null; // Para almacenar el mensaje completo

  // Datos de ejemplo (cambié el nombre a 'messages' para que coincida con la interfaz)
  mensajes: Message[] = [ // Mantenemos 'mensajes' como nombre de la propiedad para que coincida con tu HTML
    {
      de: 'Departamento Afiliaciones',
      asunto: 'Bienvenida',
      mensaje: `Estimado/a Socio/a  ${this.user()?.Persona[0].Apellido}, tenemos el gusto de registrarlo en la credencial digital, herramienta por medio de la cual  les haremos llegar  la información actualizada de nuestra MUTUAL y de esta forma lograr una comunicación permanente con usted, que es lo mas importante para la mutual.`,
      fecha: '15/01/26'
    }

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
