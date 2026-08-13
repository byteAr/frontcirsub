import { RouterOutlet } from '@angular/router';

import { estadoDeRuta, routeAnimations } from './route-animations';

/** Junta todos los objetos de estilo que aparecen dentro de la animación. */
function estilosDe(nodo: any, acumulado: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (!nodo || typeof nodo !== 'object') return acumulado;

  if (nodo.styles) {
    const estilos = Array.isArray(nodo.styles) ? nodo.styles : [nodo.styles];
    for (const e of estilos) {
      if (e && typeof e === 'object') acumulado.push(e);
    }
  }

  for (const clave of ['definitions', 'steps', 'animation']) {
    const hijo = nodo[clave];
    if (Array.isArray(hijo)) hijo.forEach(h => estilosDe(h, acumulado));
    else if (hijo) estilosDe(hijo, acumulado);
  }

  return acumulado;
}

describe('routeAnimations', () => {

  it('es un fundido puro: no mueve la vista de lugar', () => {
    const conMovimiento = estilosDe(routeAnimations)
      .filter(e => 'transform' in e || 'top' in e && e['top'] !== 0 || 'translate' in e);

    // top: 0 del :leave posicionado no cuenta como movimiento, pero cualquier
    // transform sí: es justamente lo que se pidió sacar.
    const conTransform = estilosDe(routeAnimations).filter(e => 'transform' in e);

    expect(conTransform).toEqual([]);
    expect(conMovimiento).toEqual([]);
  });

  it('anima la opacidad, que es lo único que debe cambiar', () => {
    const opacidades = estilosDe(routeAnimations).filter(e => 'opacity' in e);

    expect(opacidades.length).toBeGreaterThan(0);
  });
});

/**
 * La animación de ruta usa transition('* <=> *'), que sólo corre cuando el
 * estado cambia. Antes prepareRoute leía data.animation, que ninguna ruta
 * definía, así que devolvía siempre '' y la animación no se ejecutaba nunca.
 * Estos casos cubren justamente eso.
 */
describe('estadoDeRuta', () => {

  const outletFalso = (config: {
    isActivated: boolean;
    data?: Record<string, unknown>;
    path?: string;
  }) => ({
    isActivated: config.isActivated,
    activatedRouteData: config.data ?? {},
    activatedRoute: { snapshot: { routeConfig: { path: config.path } } },
  }) as unknown as RouterOutlet;

  it('devuelve vacío si el outlet todavía no tiene ruta activa', () => {
    expect(estadoDeRuta(outletFalso({ isActivated: false }))).toBe('');
    expect(estadoDeRuta(null)).toBe('');
    expect(estadoDeRuta(undefined)).toBe('');
  });

  it('usa data.animation cuando la ruta lo define', () => {
    const estado = estadoDeRuta(outletFalso({
      isActivated: true,
      data: { animation: 'credencial' },
      path: 'otra-cosa',
    }));

    expect(estado).toBe('credencial');
  });

  it('cae al path de la ruta cuando no hay data.animation', () => {
    const estado = estadoDeRuta(outletFalso({ isActivated: true, path: 'reintegros' }));

    expect(estado).toBe('reintegros');
  });

  it('devuelve estados distintos para rutas distintas, que es lo que dispara la animación', () => {
    const credencial = estadoDeRuta(outletFalso({ isActivated: true, path: 'credencial' }));
    const reintegros = estadoDeRuta(outletFalso({ isActivated: true, path: 'reintegros' }));

    expect(credencial).not.toEqual(reintegros);
  });

  it('no rompe si la ruta no tiene path', () => {
    expect(estadoDeRuta(outletFalso({ isActivated: true }))).toBe('');
  });
});
