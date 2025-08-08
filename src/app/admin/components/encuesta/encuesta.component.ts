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

  setRating(value: number): void {
    this.rating = value;
  }

  setHover(value: number): void {
    this.hover = value;
  }

  clearHover(): void {
    this.hover = 0;
  }

}
