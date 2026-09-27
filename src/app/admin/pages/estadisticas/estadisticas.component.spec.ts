import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EstadisticasService, ResumenPeriodo } from '../../services/estadisticas.service';
import EstadisticasComponent, { lunesDe } from './estadisticas.component';

function resumen(parcial: Partial<ResumenPeriodo> = {}): ResumenPeriodo {
  return {
    desde: '2026-09-25',
    hasta: '2026-09-25',
    plataforma: 'todas',
    personas: 850,
    porPlataforma: { pwa: 612, web: 238 },
    porHora: Array.from({ length: 24 }, (_, hora) => ({ hora, personas: hora === 11 ? 141 : 0 })),
    horaPico: 11,
    vistas: [
      { vista: 'credencial', personas: 850, porcentaje: 100 },
      { vista: 'reintegros', personas: 349, porcentaje: 41 },
    ],
    ...parcial,
  };
}

describe('EstadisticasComponent', () => {
  let fixture: ComponentFixture<EstadisticasComponent>;
  let componente: EstadisticasComponent;
  let servicio: jasmine.SpyObj<EstadisticasService>;

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  function crear(esDueno = false): void {
    servicio.permiso.and.returnValue(of({ puedeVer: true, esDueno }));
    fixture = TestBed.createComponent(EstadisticasComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  /** Crea el componente, deja que cargue y pinta. */
  function listo(esDueno = false): void {
    crear(esDueno);
    tick();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    servicio = jasmine.createSpyObj<EstadisticasService>('EstadisticasService', [
      'permiso', 'periodo', 'tendencia', 'ahora', 'listarAccesos', 'buscarAsociado', 'darAcceso', 'quitarAcceso',
    ]);
    servicio.periodo.and.returnValue(of(resumen()));
    servicio.tendencia.and.returnValue(of([]));
    servicio.ahora.and.returnValue(of({ total: 24, pwa: 17, web: 7 }));
    servicio.listarAccesos.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [EstadisticasComponent],
      providers: [{ provide: EstadisticasService, useValue: servicio }],
    }).compileComponents();
  });

  describe('tarjetas', () => {
    it('dice cuántos asociados iniciaron sesión hoy', fakeAsync(() => {
      listo();

      expect(texto()).toContain('Hoy');
      expect(texto()).toContain('850');
      expect(texto()).toContain('asociados iniciaron sesión');
      discardPeriodicTasks();
    }));

    it('en singular cuando entró uno solo', fakeAsync(() => {
      servicio.periodo.and.returnValue(of(resumen({ personas: 1 })));
      listo();

      expect(texto()).toContain('asociado inició sesión');
      discardPeriodicTasks();
    }));

    it('muestra el porcentaje de asociados en cada vista, con el nombre del menú', fakeAsync(() => {
      listo();

      expect(texto()).toContain('Credencial Virtual');
      expect(texto()).toContain('100%');
      expect(texto()).toContain('Mis trámites');
      expect(texto()).toContain('41%');
      discardPeriodicTasks();
    }));

    it('no muestra sesiones ni pantallas por sesión: confundían', fakeAsync(() => {
      listo();

      expect(texto()).not.toContain('Sesiones');
      expect(texto()).not.toContain('pantallas por sesión');
      discardPeriodicTasks();
    }));

    it('muestra la hora pico', fakeAsync(() => {
      listo();

      expect(texto()).toContain('11 a 12 h');
      expect(texto()).toContain('141 personas en esa hora');
      discardPeriodicTasks();
    }));

    it('un día sin actividad lo dice, en lugar de inventar una hora pico', fakeAsync(() => {
      servicio.periodo.and.returnValue(of(resumen({ horaPico: null, personas: 0, vistas: [] })));
      listo();

      expect(texto()).toContain('Sin actividad');
      expect(texto()).toContain('Todavía no se abrió ninguna vista');
      discardPeriodicTasks();
    }));
  });

  describe('esta semana', () => {
    it('pide de lunes a hoy y lo dice en la tarjeta', fakeAsync(() => {
      listo();
      servicio.periodo.calls.reset();

      componente.cambiarModo('semana');
      tick();
      fixture.detectChanges();

      const [desde, hasta] = servicio.periodo.calls.mostRecent().args;
      expect(desde).toBe(lunesDe(componente.hoy));
      expect(hasta).toBe(componente.hoy);
      expect(texto()).toContain('Esta semana');
      discardPeriodicTasks();
    }));

    it('la semana incluye hoy, así que sigue en vivo', fakeAsync(() => {
      listo();

      componente.cambiarModo('semana');

      expect(componente.enVivo()).toBeTrue();
      discardPeriodicTasks();
    }));

    it('al volver a "Día" pide un solo día', fakeAsync(() => {
      listo();
      componente.cambiarModo('semana');
      tick();

      componente.cambiarModo('dia');
      tick();

      const [desde, hasta] = servicio.periodo.calls.mostRecent().args;
      expect(desde).toBe(hasta);
      discardPeriodicTasks();
    }));
  });

  describe('lunesDe', () => {
    it('va al lunes de esa semana', () => {
      expect(lunesDe('2026-09-23')).toBe('2026-09-21'); // miércoles
      expect(lunesDe('2026-09-25')).toBe('2026-09-21'); // viernes
    });

    it('un lunes es su propio lunes', () => {
      expect(lunesDe('2026-09-21')).toBe('2026-09-21');
    });

    it('el domingo cierra la semana: su lunes es el de seis días antes', () => {
      expect(lunesDe('2026-09-27')).toBe('2026-09-21');
    });

    it('cruza de mes', () => {
      expect(lunesDe('2026-10-01')).toBe('2026-09-28');
    });
  });

  describe('filtros', () => {
    it('el filtro de plataforma vuelve a pedir los datos sólo de esa plataforma', fakeAsync(() => {
      listo();

      componente.cambiarFiltro('pwa');

      expect(servicio.periodo).toHaveBeenCalledWith(componente.fecha(), componente.fecha(), 'pwa');
      discardPeriodicTasks();
    }));

    it('no deja elegir un día futuro', fakeAsync(() => {
      listo();
      const antes = componente.fecha();

      componente.cambiarFecha('2999-01-01');

      expect(componente.fecha()).toBe(antes);
      discardPeriodicTasks();
    }));
  });

  describe('en vivo', () => {
    it('hoy muestra cuánta gente está usando la app en este momento', fakeAsync(() => {
      listo();

      expect(texto()).toContain('personas usando la app ahora');
      expect(texto()).toContain('24');
      discardPeriodicTasks();
    }));

    it('se refresca solo cada 10 segundos, sin volver a mostrar la carga', fakeAsync(() => {
      listo();
      servicio.periodo.calls.reset();
      servicio.ahora.and.returnValue(of({ total: 31, pwa: 20, web: 11 }));

      tick(10_000);

      expect(servicio.periodo).toHaveBeenCalledTimes(1);
      expect(componente.cargando()).toBeFalse();
      expect(componente.activos()).toEqual({ total: 31, pwa: 20, web: 11 });
      discardPeriodicTasks();
    }));

    it('un día que ya pasó no se refresca: está cerrado', fakeAsync(() => {
      listo();
      componente.moverDia(-1);
      tick();
      servicio.periodo.calls.reset();

      tick(30_000);

      expect(componente.enVivo()).toBeFalse();
      expect(servicio.periodo).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('si una vuelta falla, se queda con los últimos datos', fakeAsync(() => {
      listo();
      servicio.ahora.and.returnValue(throwError(() => new Error('sin red')));

      tick(10_000);

      expect(componente.activos()).toEqual({ total: 24, pwa: 17, web: 7 });
      expect(componente.error()).toBe('');
      discardPeriodicTasks();
    }));
  });

  describe('accesos', () => {
    it('sólo aparecen para el dueño', fakeAsync(() => {
      listo(false);

      expect(texto()).not.toContain('Quién puede ver las estadísticas');
      expect(servicio.listarAccesos).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('antes de dar acceso muestra a quién, y recién ahí lo da', fakeAsync(() => {
      servicio.buscarAsociado.and.returnValue(of({ dni: '11111111', nombre: 'María', apellido: 'González' }));
      servicio.darAcceso.and.returnValue(of({ dni: '11111111', nombre: 'María', apellido: 'González' }));
      listo(true);

      componente.dniBuscado.set('11111111');
      componente.buscarAsociado();
      fixture.detectChanges();

      expect(servicio.darAcceso).not.toHaveBeenCalled();
      expect(texto()).toContain('González, María');

      componente.confirmarAcceso();
      expect(servicio.darAcceso).toHaveBeenCalledOnceWith('11111111');
      discardPeriodicTasks();
    }));
  });

  it('si falla la carga, avisa y deja reintentar', fakeAsync(() => {
    servicio.periodo.and.returnValue(throwError(() => new Error('caído')));
    listo();

    expect(texto()).toContain('No se pudieron cargar las estadísticas');
    discardPeriodicTasks();
  }));
});
