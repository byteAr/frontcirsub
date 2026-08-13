import { animate, query, style, transition, trigger } from '@angular/animations';
import { RouterOutlet } from '@angular/router';

/**
 * Transición entre vistas: la que sale se desvanece hacia arriba y la que
 * entra aparece desde abajo.
 *
 * Va en secuencia y no en paralelo: durante el solapamiento conviven dos
 * vistas en el DOM, y superponerlas obliga a sacarlas del flujo con
 * position absolute, lo que descoloca el alto del contenedor. Primero sale
 * una, después entra la otra.
 */
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
    ], { optional: true }),

    query(':leave', [
      style({ opacity: 1 }),
      animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' })),
    ], { optional: true }),

    query(':enter', [
      animate('220ms ease-out', style({ opacity: 1, transform: 'none' })),
    ], { optional: true }),
  ]),
]);

/**
 * Estado de la animación para el outlet dado.
 *
 * Tiene que devolver un valor distinto por ruta: `transition('* <=> *')`
 * sólo corre cuando el estado cambia, y devolviendo siempre lo mismo la
 * animación nunca se ejecuta. Usa data.animation si la ruta lo define y, si
 * no, cae al path de la ruta, así funciona sin tener que anotar cada una.
 */
export function estadoDeRuta(outlet: RouterOutlet | null | undefined): string {
  if (!outlet?.isActivated) return '';

  const porDato = outlet.activatedRouteData?.['animation'];
  if (porDato) return porDato as string;

  return outlet.activatedRoute.snapshot.routeConfig?.path ?? '';
}
