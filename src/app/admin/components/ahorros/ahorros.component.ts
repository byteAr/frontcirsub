import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface ahorros {
  detalle:string;
  importe: number
}

@Component({
  selector: 'app-ahorros',
  imports: [CommonModule],
  templateUrl: './ahorros.component.html',
  styleUrl: './ahorros.component.css'
})
export default class AhorrosComponent {

  ahorros: ahorros[] = [
    {
      detalle: 'Ahorro estimulo',
      importe: 8000
    },
    {
      detalle: 'Ahorro Común',
      importe: 21000
    },
  ]



}
