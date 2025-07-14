import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface farmacia {
  fechaReceta: string;
  fechaFactura: string;
  importeReintegro: string;
  fechaCarga: string;
  fechaReintegro: string
}

@Component({
  selector: 'app-farmacia',
  imports: [CommonModule],
  templateUrl: './farmacia.component.html',
  styleUrl: './farmacia.component.css'
})
export default class FarmaciaComponent {

  reintegroFarmacia: farmacia[] = [
    {
      fechaReceta: '12/06/25',
      fechaFactura: '15/06/25',
      importeReintegro: '2369',
      fechaCarga: '15/06/25',
      fechaReintegro: '20/06/25'
    },
    {
      fechaReceta: '12/06/25',
      fechaFactura: '15/06/25',
      importeReintegro: '2369',
      fechaCarga: '15/06/25',
      fechaReintegro: '20/06/25'
    },
    {
      fechaReceta: '12/06/25',
      fechaFactura: '15/06/25',
      importeReintegro: '2369',
      fechaCarga: '15/06/25',
      fechaReintegro: '20/06/25'
    },
  ]

}
