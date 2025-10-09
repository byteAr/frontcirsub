import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { AdherirseComponent } from "../adherirse/adherirse.component";

interface reintegro {
  Id: number;
  Personas_id: number;
  FechaCargaReceta: string;
  DescripcionReintegro: string;
  Fechapago: string;
  Op_estado:string;
  Op_importe:number;
  OrdenPago:number;
}

@Component({
  selector: 'app-farmacia',
  imports: [CommonModule, AdherirseComponent],
  templateUrl: './farmacia.component.html',
  styleUrl: './farmacia.component.css'
})
export default class FarmaciaComponent {

  authService=inject(AuthService)

  user = this.authService.user;

  reintegro: any

  constructor() {

    effect(() => {
    const u = this.user();
    if (u) {
      this.reintegro = u.Reintegros;
    }
  });
   this.authService.checkStatus().subscribe();
  }

  tieneBeneficio4 = computed(() =>
    (this.user()?.Beneficios ?? []).some(
      (b) => b.far === true
    )
  );




}
