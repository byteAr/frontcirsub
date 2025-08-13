import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-encuesta',
  imports: [CommonModule],
  templateUrl: './encuesta.component.html',
  styleUrl: './encuesta.component.css'
})
export default class EncuestaComponent {
  rating = 0;
  hover = 0;
  rating2 = 0;
  hover2 = 0;

  disabled=true

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
    if(this.rating === 0 || this.rating2 === 0) return

    console.log('hice ckick pa');
  }

}
