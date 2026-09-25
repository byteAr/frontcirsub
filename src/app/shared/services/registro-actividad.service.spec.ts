import { DOCUMENT } from '@angular/common';
import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { EstadisticasService } from '../../admin/services/estadisticas.service';
import { RegistroActividadService } from './registro-actividad.service';

/**
 * Qué se cuenta y qué no. Si esto se rompe, los números del dashboard dejan
 * de significar lo que dicen.
 */
describe('RegistroActividadService', () => {
  let eventos: Subject<unknown>;
  let estadisticas: jasmine.SpyObj<EstadisticasService>;
  let documento: EventTarget & { visibilityState: string; defaultView: unknown };
  let ventana: EventTarget & { matchMedia: () => { matches: boolean }; navigator: unknown };

  function crear(opciones: { standalone?: boolean; iosStandalone?: boolean } = {}): RegistroActividadService {
    eventos = new Subject();
    estadisticas = jasmine.createSpyObj<EstadisticasService>('EstadisticasService', [
      'registrarActividad', 'latido', 'avisarSalida',
    ]);
    estadisticas.registrarActividad.and.returnValue(of(undefined));
    estadisticas.latido.and.returnValue(of(undefined));

    ventana = Object.assign(new EventTarget(), {
      matchMedia: () => ({ matches: !!opciones.standalone }),
      navigator: { standalone: opciones.iosStandalone },
    });
    documento = Object.assign(new EventTarget(), { visibilityState: 'visible', defaultView: ventana });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events: eventos.asObservable() } },
        { provide: DOCUMENT, useValue: documento },
        { provide: EstadisticasService, useValue: estadisticas },
      ],
    });
    return TestBed.inject(RegistroActividadService);
  }

  const navegar = (url: string) => eventos.next(new NavigationEnd(1, url, url));
  const ocultar = () => {
    documento.visibilityState = 'hidden';
    documento.dispatchEvent(new Event('visibilitychange'));
  };
  const mostrar = () => {
    documento.visibilityState = 'visible';
    documento.dispatchEvent(new Event('visibilitychange'));
  };

  beforeEach(() => localStorage.setItem('token', 'tok'));
  afterEach(() => localStorage.removeItem('token'));

  describe('visitas', () => {
    it('cuenta cada pantalla del dashboard', fakeAsync(() => {
      crear().iniciar();

      navegar('/dashboard/credencial');
      navegar('/dashboard/beneficios');

      expect(estadisticas.registrarActividad).toHaveBeenCalledTimes(2);
      discardPeriodicTasks();
    }));

    it('la pantalla de login no cuenta: se mide desde que el asociado entra', fakeAsync(() => {
      crear().iniciar();

      navegar('/auth/login');

      expect(estadisticas.registrarActividad).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('sin sesión no cuenta nada', fakeAsync(() => {
      localStorage.removeItem('token');
      crear().iniciar();

      navegar('/dashboard/credencial');

      expect(estadisticas.registrarActividad).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));
  });

  describe('latido', () => {
    it('con la app a la vista, avisa cada 30 segundos que sigue ahí', fakeAsync(() => {
      crear().iniciar();
      navegar('/dashboard/descuentos');

      tick(90_000);

      expect(estadisticas.latido).toHaveBeenCalledTimes(3);
      discardPeriodicTasks();
    }));

    it('con la app en segundo plano, no late', fakeAsync(() => {
      crear().iniciar();
      navegar('/dashboard/descuentos');
      ocultar();
      estadisticas.latido.calls.reset();

      tick(90_000);

      expect(estadisticas.latido).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('fuera del dashboard no late', fakeAsync(() => {
      crear().iniciar();
      navegar('/auth/login');

      tick(60_000);

      expect(estadisticas.latido).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));
  });

  describe('salida', () => {
    it('al mandar la app al fondo avisa que se fue', fakeAsync(() => {
      crear({ standalone: true }).iniciar();
      navegar('/dashboard/credencial');

      ocultar();

      expect(estadisticas.avisarSalida).toHaveBeenCalledOnceWith('pwa');
      discardPeriodicTasks();
    }));

    it('al volver a la app late enseguida, sin esperar los 30 segundos', fakeAsync(() => {
      crear().iniciar();
      navegar('/dashboard/credencial');
      ocultar();

      mostrar();

      expect(estadisticas.latido).toHaveBeenCalledTimes(1);
      discardPeriodicTasks();
    }));

    it('al cerrar la pestaña avisa que se fue', fakeAsync(() => {
      crear().iniciar();
      navegar('/dashboard/credencial');

      ventana.dispatchEvent(new Event('pagehide'));

      expect(estadisticas.avisarSalida).toHaveBeenCalledOnceWith('web');
      discardPeriodicTasks();
    }));

    it('fuera del dashboard, cerrar no manda nada', fakeAsync(() => {
      crear().iniciar();
      navegar('/auth/login');

      ocultar();

      expect(estadisticas.avisarSalida).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));
  });

  describe('plataforma', () => {
    it('distingue la app instalada del navegador', () => {
      expect(crear({ standalone: true }).plataforma()).toBe('pwa');
      expect(crear({ standalone: false }).plataforma()).toBe('web');
    });

    it('en iPhone reconoce la app instalada por navigator.standalone', () => {
      expect(crear({ standalone: false, iosStandalone: true }).plataforma()).toBe('pwa');
    });
  });
});
