import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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

  // Variables para controlar el modal
  isModalOpen: boolean = false;
  selectedMessage: Message | null = null; // Para almacenar el mensaje completo

  // Datos de ejemplo (cambié el nombre a 'messages' para que coincida con la interfaz)
  mensajes: Message[] = [ // Mantenemos 'mensajes' como nombre de la propiedad para que coincida con tu HTML
    {
      de: 'Marcos Lopez',
      asunto: 'Mensaje privado sobre ...',
      mensaje: 'Se le comunica a todos los socios que a partir del día de la fecha el beneficio de farmacia pasará a ser de $8300 en virtud de la inflación creciente que experimentamos todos los días.',
      fecha: '15/12/25'
    },
    {
      de: 'Marcelo Arangue',
      asunto: 'Prueba de asunto',
      fecha: '15/12/25',
      mensaje: 'Se le comunica a la totalidad de los socios que en vísperas de una nueva elección en la mutual, se encuentra a disposición de todos el padrón electoral 2025'
    },
    {
      de: 'Victor Hugo Rial',
      asunto: 'Prueba de asunto',
      fecha: '15/12/25',
      mensaje: 'Se le comunica que deberá presentar para obtener el beneficio de farmacia deberá presentar el comprobante de pago de los medicamentos bla bla bla '
    },
    {
      de: 'Marcos',
      asunto: 'Prueba de asunto',
      fecha: '15/12/25',
      mensaje: 'Se le comunica a la totalidad de los socios que el día 23/08/2025 se encontrará cerrada la mutual a razón de conmemorarse otro día más del nacimiento de Marcelo Arangue'
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
