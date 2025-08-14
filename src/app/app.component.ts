import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';

import {
  trigger, transition, style, query, group, animate,
} from '@angular/animations';

const routeAnimations = trigger('routeAnimations', [
  // Aplica a cualquier cambio de ruta
  transition('* <=> *', [
    // Prepara enter/leave para evitar salto de layout
    query(':enter, :leave', [
      style({
        position: 'fixed',
        width: '100%',
        // ayuda a performance
        willChange: 'transform, opacity'
      }),
    ], { optional: true }),

    group([
      // Vista que entra
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('240ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ], { optional: true }),

      // Vista que sale
      query(':leave', [
        style({ opacity: 1, transform: 'translateY(0)' }),
        animate('180ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' })),
      ], { optional: true }),
    ]),
  ]),
]);

@Component({
  selector: 'app-root',
  imports: [ButtonModule, InputOtpModule, RouterModule, RouterOutlet ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'cirsubfrontend';
  value=0;
  prepareRoute(outlet: RouterOutlet) {
    // Usa la clave de animación de la ruta, o vacío para el comodín
    return outlet?.activatedRouteData?.['animation'] || '';
  }
}
