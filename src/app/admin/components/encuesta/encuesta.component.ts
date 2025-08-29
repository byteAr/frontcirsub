import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import { CredencialService } from '../../services/credencial.service';

@Component({
  selector: 'app-encuesta',
  imports: [CommonModule],
  templateUrl: './encuesta.component.html',
  styleUrl: './encuesta.component.css'
})
export default class EncuestaComponent implements OnInit {


  user= inject(AuthService);
  credencialService = inject(CredencialService)

  rating = 0;
  hover = 0;
  rating2 = 0;
  hover2 = 0;

  disabled=true

  calificado=true;

  ngOnInit(): void {

  }

  setRating(value: number): void {
    this.rating = value;
  }

  setHover(value: number): void {
    this.hover = value;
  }

  clearHover(): void {
    this.hover = 0;
  }
  setRating2(value: number): void {
    this.rating2 = value;
  }

  setHover2(value: number): void {
    this.hover2 = value;
  }

  clearHover2(): void {
    this.hover2 = 0;
  }

  calificar(){
    if(this.rating === 0 || this.rating2 === 0) return;
    const id= this.user.user()?.Persona[0].Id;
    if(!id) return;
    this.credencialService.updateEncuesta(id, this.rating, this.rating2)
      .subscribe({
        next: resp => console.log(resp)


      })

    this.calificado = false
  }

}
