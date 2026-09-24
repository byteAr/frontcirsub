import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { RouterOutlet } from '@angular/router';

/**
 * Transición entre vistas: fundido puro, sin desplazamiento.
 *
 * Las dos vistas se solapan y la que sale va en position absolute sobre el
 * contenedor (que por eso es relative). Hacerlo así evita el salto: si se
 * hicieran una después de otra, entre medio el contenedor se queda sin
 * contenido y el alto colapsa.
 */
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter', [style({ opacity: 0 })], { optional: true }),

    group([
      query(':leave', [
        style({ position: 'absolute', top: 0, left: 0, width: '100%', opacity: 1 }),
        animate('180ms ease-out', style({ opacity: 0 })),
      ], { optional: true }),

      // Arranca apenas después, para que no se vean las dos superpuestas.
      query(':enter', [
        animate('260ms 60ms ease-out', style({ opacity: 1 })),
      ], { optional: true }),
    ]),
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
