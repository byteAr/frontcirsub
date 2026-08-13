import { RouterOutlet } from '@angular/router';

import { estadoDeRuta } from './route-animations';

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
