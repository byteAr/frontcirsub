import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EstadisticasService, ResumenDia } from '../../services/estadisticas.service';
import EstadisticasComponent from './estadisticas.component';

const vacio = { personas: 0, sesiones: 0, visitas: 0 };

function resumen(parcial: Partial<ResumenDia> = {}): ResumenDia {
  return {
    fecha: '2026-09-25',
    plataforma: 'todas',
    totales: { personas: 850, sesiones: 993, visitas: 4101 },
    porPlataforma: { pwa: { personas: 612, sesiones: 731, visitas: 3180 }, web: { personas: 238, sesiones: 262, visitas: 921 } },
    porHora: Array.from({ length: 24 }, (_, hora) => ({ hora, ...vacio, personas: hora === 11 ? 141 : 0 })),
    horaPico: 11,
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

  beforeEach(async () => {
    servicio = jasmine.createSpyObj<EstadisticasService>('EstadisticasService', [
      'permiso', 'dia', 'tendencia', 'listarAccesos', 'buscarAsociado', 'darAcceso', 'quitarAcceso',
    ]);
    servicio.dia.and.returnValue(of(resumen()));
    servicio.tendencia.and.returnValue(of([]));
    servicio.listarAccesos.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [EstadisticasComponent],
      providers: [{ provide: EstadisticasService, useValue: servicio }],
    }).compileComponents();
  });

  it('muestra los totales y la hora pico del día', fakeAsync(() => {
    crear();
    tick();
    fixture.detectChanges();

    expect(texto()).toContain('850');
    expect(texto()).toContain('11 a 12 h');
    expect(texto()).toContain('141 personas en esa hora');
  }));

  it('calcula qué parte entró por la app', () => {
    crear();

    expect(componente.porcentajeApp()).toBe(72);
  });

  it('un día sin actividad lo dice, en lugar de inventar una hora pico', fakeAsync(() => {
    servicio.dia.and.returnValue(of(resumen({ horaPico: null, totales: vacio })));
    crear();
    tick();
    fixture.detectChanges();

    expect(texto()).toContain('Sin actividad');
  }));

  it('el filtro de plataforma vuelve a pedir los datos sólo de esa plataforma', () => {
    crear();

    componente.cambiarFiltro('pwa');

    expect(servicio.dia).toHaveBeenCalledWith(componente.fecha(), 'pwa');
  });

  it('no deja elegir un día futuro', () => {
    crear();
    const antes = componente.fecha();

    componente.cambiarFecha('2999-01-01');

    expect(componente.fecha()).toBe(antes);
  });

  it('la administración de accesos sólo aparece para el dueño', fakeAsync(() => {
    crear(false);
    tick();
    fixture.detectChanges();
    expect(texto()).not.toContain('Quién puede ver las estadísticas');
    expect(servicio.listarAccesos).not.toHaveBeenCalled();
  }));

  it('al dueño le muestra quién tiene acceso', fakeAsync(() => {
    servicio.listarAccesos.and.returnValue(of([{ dni: '21677083', nombre: 'Marcelo', apellido: 'ARANGUE' }]));
    crear(true);
    tick();
    fixture.detectChanges();

    expect(texto()).toContain('Quién puede ver las estadísticas');
    expect(texto()).toContain('ARANGUE, Marcelo');
  }));

  it('antes de dar acceso muestra a quién, y recién ahí lo da', fakeAsync(() => {
    servicio.buscarAsociado.and.returnValue(of({ dni: '11111111', nombre: 'María', apellido: 'González' }));
    servicio.darAcceso.and.returnValue(of({ dni: '11111111', nombre: 'María', apellido: 'González' }));
    crear(true);

    componente.dniBuscado.set('11111111');
    componente.buscarAsociado();
    fixture.detectChanges();

    expect(servicio.darAcceso).not.toHaveBeenCalled();
    expect(texto()).toContain('González, María');

    componente.confirmarAcceso();
    expect(servicio.darAcceso).toHaveBeenCalledOnceWith('11111111');
  }));

  it('si falla la carga, avisa y deja reintentar', fakeAsync(() => {
    servicio.dia.and.returnValue(throwError(() => new Error('caído')));
    crear();
    tick();
    fixture.detectChanges();

    expect(texto()).toContain('No se pudieron cargar las estadísticas');
  }));
});
