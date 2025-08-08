import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';

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


  constructor(){
    effect(() => {
    const u = this.user();
    if (u) {
      this.familia = u.GpoFamiliar;
      console.log('Familia cargada:', this.familia);
    }
  });
   this.authService.checkStatus().subscribe();
  }

  authService=inject(AuthService)

  user = this.authService.user;

  familia:any;



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
