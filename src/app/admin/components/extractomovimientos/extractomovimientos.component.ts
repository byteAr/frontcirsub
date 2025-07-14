import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface movimiento {
  concepto: number;
  detalle: string;
  monto: number
}

@Component({
  selector: 'app-extractomovimientos',
  imports: [CommonModule],
  templateUrl: './extractomovimientos.component.html',
  styleUrl: './extractomovimientos.component.css'
})
export default class ExtractomovimientosComponent {

  movimientos: movimiento[] = [
    {
      concepto: 59,
      detalle: 'Ahorro con estimulo',
      monto: 100000.00
    },
    {
      concepto: 218,
      detalle: 'Cuota social',
      monto: 23878.00
    },
    {
      concepto: 249,
      detalle: 'Farmacia cuota',
      monto: 27000
    },
    {
      concepto: 259,
      detalle: 'Servicio sepelio cuota',
      monto: 4000
    },
  ]

}
