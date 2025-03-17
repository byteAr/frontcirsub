import { Component } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Notificacion {
  id: number;
  detalle: string;
  remitente: string
}

@Component({
  selector: 'app-notificaciones',
  imports: [TableModule, ToggleSwitchModule, FormsModule, CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css'
})
export default class NotificacionesComponent {

  selectedProduct!: Notificacion;
  metaKey: boolean = true;
  notificaciones: Notificacion[] = [
    {
      id: 1,
      detalle: "Prueba",
      remitente: "Marcos Lopez"
    },
    {
      id: 2,
      detalle: "Prueba 2",
      remitente: "Alberto Gutierrez"
    },
    {
      id:3,
      detalle: "Prueba 3",
      remitente: "Gustavo Rodriguez"
    }
  ]

}
