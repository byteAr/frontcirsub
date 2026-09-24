import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';

import { ActualizacionAppService } from './actualizacion-app.service';

/**
 * Lo que importa acá: que una versión nueva llegue al asociado sin que él
 * tenga que hacer nada, y que la recarga no lo agarre a mitad de un
 * formulario.
 */
describe('ActualizacionAppService', () => {
  let versionUpdates: Subject<{ type: string }>;
  let eventosDeRuta: Subject<unknown>;
  let swUpdate: { isEnabled: boolean; versionUpdates: Subject<{ type: string }>; activateUpdate: jasmine.Spy; checkForUpdate: jasmine.Spy };
  let recargar: jasmine.Spy;

  function crear(habilitado = true): ActualizacionAppService {
    versionUpdates = new Subject();
    eventosDeRuta = new Subject();
    recargar = jasmine.createSpy('reload');
    swUpdate = {
      isEnabled: habilitado,
      versionUpdates,
      activateUpdate: jasmine.createSpy('activateUpdate').and.returnValue(Promise.resolve(true)),
      checkForUpdate: jasmine.createSpy('checkForUpdate').and.returnValue(Promise.resolve(true)),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: swUpdate },
        { provide: Router, useValue: { events: eventosDeRuta.asObservable() } },
        { provide: DOCUMENT, useValue: { defaultView: { location: { reload: recargar } } } },
      ],
    });
    return TestBed.inject(ActualizacionAppService);
  }

  /** Simula que el service worker terminó de bajar la versión nueva. */
  async function llegaVersionNueva(): Promise<void> {
    versionUpdates.next({ type: 'VERSION_READY' });
    await Promise.resolve();
  }

  it('no hace nada si el service worker está apagado', () => {
    crear(false).iniciar();

    expect(swUpdate.checkForUpdate).not.toHaveBeenCalled();
  });

  it('busca una versión nueva apenas arranca', () => {
    crear().iniciar();

    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('no recarga en el momento: el asociado puede estar completando algo', async () => {
    crear().iniciar();

    await llegaVersionNueva();

    expect(swUpdate.activateUpdate).toHaveBeenCalledTimes(1);
    expect(recargar).not.toHaveBeenCalled();
  });

  it('recarga en el próximo cambio de pantalla, que es un momento seguro', async () => {
    crear().iniciar();

    await llegaVersionNueva();
    eventosDeRuta.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it('recarga una sola vez y no en cada navegación posterior', async () => {
    crear().iniciar();

    await llegaVersionNueva();
    eventosDeRuta.next(new NavigationEnd(1, '/a', '/a'));
    eventosDeRuta.next(new NavigationEnd(2, '/b', '/b'));

    expect(recargar).toHaveBeenCalledTimes(1);
  });

  it('sin versión nueva, navegar no recarga nada', () => {
    crear().iniciar();

    eventosDeRuta.next(new NavigationEnd(1, '/a', '/a'));

    expect(recargar).not.toHaveBeenCalled();
  });
});
