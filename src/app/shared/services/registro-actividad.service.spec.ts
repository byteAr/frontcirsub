import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
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

  function crear(opciones: { standalone?: boolean; iosStandalone?: boolean } = {}): RegistroActividadService {
    eventos = new Subject();
    estadisticas = jasmine.createSpyObj<EstadisticasService>('EstadisticasService', ['registrarActividad']);
    estadisticas.registrarActividad.and.returnValue(of(undefined));

    const ventana = {
      matchMedia: () => ({ matches: !!opciones.standalone }),
      navigator: { standalone: opciones.iosStandalone },
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events: eventos.asObservable() } },
        { provide: DOCUMENT, useValue: { defaultView: ventana } },
        { provide: EstadisticasService, useValue: estadisticas },
      ],
    });
    return TestBed.inject(RegistroActividadService);
  }

  const navegar = (url: string) => eventos.next(new NavigationEnd(1, url, url));

  beforeEach(() => localStorage.setItem('token', 'tok'));
  afterEach(() => localStorage.removeItem('token'));

  it('cuenta cada pantalla del dashboard', () => {
    crear().iniciar();

    navegar('/dashboard/credencial');
    navegar('/dashboard/beneficios');

    expect(estadisticas.registrarActividad).toHaveBeenCalledTimes(2);
  });

  it('la pantalla de login no cuenta: se mide desde que el asociado entra', () => {
    crear().iniciar();

    navegar('/auth/login');

    expect(estadisticas.registrarActividad).not.toHaveBeenCalled();
  });

  it('sin sesión no cuenta nada', () => {
    localStorage.removeItem('token');
    crear().iniciar();

    navegar('/dashboard/credencial');

    expect(estadisticas.registrarActividad).not.toHaveBeenCalled();
  });

  it('distingue la app instalada del navegador', () => {
    crear({ standalone: true }).iniciar();
    navegar('/dashboard/credencial');
    expect(estadisticas.registrarActividad).toHaveBeenCalledWith('pwa');

    crear({ standalone: false }).iniciar();
    navegar('/dashboard/credencial');
    expect(estadisticas.registrarActividad).toHaveBeenCalledWith('web');
  });

  it('en iPhone reconoce la app instalada por navigator.standalone', () => {
    const servicio = crear({ standalone: false, iosStandalone: true });

    expect(servicio.plataforma()).toBe('pwa');
  });
});
