import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-card-back',
  imports: [RouterOutlet],
  templateUrl: './card-back.component.html',
  styleUrl: './card-back.component.css'
})
export class CardBackComponent {

  isFlipped: boolean = false;

  currentRotation: number = 0;
  private touchStartX: number = 0;
  private touchEndX: number = 0;
  private swipeThreshold: number = 50;

  toggleFlip(): void {
    this.isFlipped = !this.isFlipped;
  }

  flipCard(direction: 'left' | 'right'): void {
    if (direction === 'left') {
      // Si swipe a la izquierda, giramos 180 grados en sentido horario
      this.currentRotation += 180;
    } else { // direction === 'right'
      // Si swipe a la derecha, giramos 180 grados en sentido antihorario
      this.currentRotation -= 180;
    }
    // Opcional: Para mantener los grados dentro de 0-360 si lo necesitas,
    // aunque CSS maneja rotaciones mayores a 360 sin problema.
    // this.currentRotation = this.currentRotation % 360;
  }

   private handleSwipe(): void {
    const deltaX = this.touchEndX - this.touchStartX;

    if (Math.abs(deltaX) > this.swipeThreshold) {
      if (deltaX > 0) {
        // Deslizamiento hacia la derecha
        this.flipCard('right');
      } else {
        // Deslizamiento hacia la izquierda
        this.flipCard('left');
      }
    }
  }

}
