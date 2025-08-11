import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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


  // Variables para controlar el modal
  isModalOpen: boolean = false;
  selectedMessage: Message | null = null; // Para almacenar el mensaje completo

  // Datos de ejemplo (cambié el nombre a 'messages' para que coincida con la interfaz)
  mensajes: Message[] = [ // Mantenemos 'mensajes' como nombre de la propiedad para que coincida con tu HTML
    {
      de: 'Comisión Directiva',
      asunto: 'Bienvenido/a',
      mensaje: 'La Comisión Directiva del circulo de suboficiales de Gendarmeria Nacional le da la bienvenida al sistema de acreditación digital.',
      fecha: '15/12/25'
    },
    {
      de: 'Comisión Directiva',
      asunto: 'Bienvenido/a',
      mensaje: 'La Comisión Directiva del circulo de suboficiales de Gendarmeria Nacional le da la bienvenida al sistema de acreditación digital.',
      fecha: '15/12/25'
    },
    {
      de: 'Comisión Directiva',
      asunto: 'Bienvenido/a',
      mensaje: 'La Comisión Directiva del circulo de suboficiales de Gendarmeria Nacional le da la bienvenida al sistema de acreditación digital.',
      fecha: '15/12/25'
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
