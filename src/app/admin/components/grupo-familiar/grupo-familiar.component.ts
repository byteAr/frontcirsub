import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface familia {
  parentesco: string;
  nombreApellido: string;
  dni: number;
  edad: number;
  incapacidad: boolean
}

@Component({
  selector: 'app-grupo-familiar',
  imports: [CommonModule],
  templateUrl: './grupo-familiar.component.html',
  styleUrl: './grupo-familiar.component.css'
})
export default class GrupoFamiliarComponent {

  grupofamiliar: familia[] = [
    {
      parentesco: 'Conyugue',
      nombreApellido: 'Amalia Rodriguez',
      dni: 35698545,
      edad: 38,
      incapacidad: false
    },
    {
      parentesco: 'Hija',
      nombreApellido: 'Amalia Gonzalez',
      dni: 35698545,
      edad: 12,
      incapacidad: true
    },
    {
      parentesco: 'Hijo',
      nombreApellido: 'Lucio Gonzalez',
      dni: 35698545,
      edad: 9,
      incapacidad: false
    },
  ]


}
