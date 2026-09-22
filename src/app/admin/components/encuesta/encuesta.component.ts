import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../../auth/services/auth.service';
import { CredencialService } from '../../services/credencial.service';

/**
 * Calificación de la credencial digital, de 1 a 5 estrellas en dos preguntas.
 * Se ofrece una sola vez: el ítem del sidebar sólo aparece mientras el perfil
 * dice que el asociado no respondió, y desaparece apenas lo hace.
 */
@Component({
  selector: 'app-encuesta',
  imports: [CommonModule],
  templateUrl: './encuesta.component.html',
  styleUrl: './encuesta.component.css'
})
export default class EncuestaComponent {

  private authService = inject(AuthService);
  private credencialService = inject(CredencialService);

  rating = 0;
  hover = 0;
  rating2 = 0;
  hover2 = 0;

  enviando = signal<boolean>(false);
  error = signal<string | null>(null);

  private enviadaAhora = signal<boolean>(false);

  /**
   * Ya respondida: recién ahora, o en otra sesión. Lo segundo pasa si alguien
   * entra directo por la URL después de haber calificado; ahí se le muestra
   * el agradecimiento en vez de dejarlo calificar de nuevo.
   */
  respondida = computed(() =>
    this.enviadaAhora() || this.authService.user()?.Persona?.[0]?.Encuesta === true
  );

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

  /**
   * El agradecimiento se muestra cuando el backend confirma, no antes: si el
   * envío fallaba, el asociado veía "¡Gracias!" y su calificación se perdía.
   */
  calificar(): void {
    if (this.enviando() || this.rating === 0 || this.rating2 === 0) return;

    this.enviando.set(true);
    this.error.set(null);

    this.credencialService.updateEncuesta(this.rating, this.rating2).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviadaAhora.set(true);
        this.authService.marcarEncuestaRespondida();
      },
      error: () => {
        this.enviando.set(false);
        this.error.set('No pudimos registrar su calificación. Intente nuevamente en unos minutos.');
      },
    });
  }
}
