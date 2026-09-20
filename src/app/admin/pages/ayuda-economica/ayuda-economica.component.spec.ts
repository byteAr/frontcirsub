import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AyudaEconomica, GestionListasService } from '../../services/gestion-listas.service';
import AyudaEconomicaComponent from './ayuda-economica.component';

// En la app lo registra app.config.ts, que los tests no cargan.
registerLocaleData(localeEsAr);

function ayuda(campos: Partial<AyudaEconomica>): AyudaEconomica {
  return {
    numeroSolicitud: '1',
    fecha: '01/01/2026',
    fechaIso: '2026-01-01',
    capital: 100_000,
    plazos: 2,
    valorCuota: 60_000,
    totalAReintegrar: 120_000,
    cuotas: [],
    cuotasPagadas: 0,
    cuotasPendientes: 0,
    enCurso: false,
    saldo: 0,
    proximaCuota: null,
    ...campos,
  };
}

const EN_CURSO = ayuda({
  numeroSolicitud: '131937',
  fecha: '14/05/2026',
  capital: 100_000,
  plazos: 3,
  valorCuota: 30_474.04,
  totalAReintegrar: 91_422.12,
  cuotasPagadas: 1,
  cuotasPendientes: 2,
  enCurso: true,
  saldo: 60_948.08,
  proximaCuota: { numero: 2, mesHaberes: 'jul 2026', mesCobro: 'ago 2026', importe: 30_474.04, saldo: 60_948.08, saldoFinal: 30_474.04, pagada: false, estado: 'Pendiente' },
  cuotas: [
    { numero: 1, mesHaberes: 'jun 2026', mesCobro: 'jul 2026', importe: 30_474.04, saldo: 91_422.12, saldoFinal: 60_948.08, pagada: true, estado: 'Pagado' },
    { numero: 2, mesHaberes: 'jul 2026', mesCobro: 'ago 2026', importe: 30_474.04, saldo: 60_948.08, saldoFinal: 30_474.04, pagada: false, estado: 'Pendiente' },
    { numero: 3, mesHaberes: 'ago 2026', mesCobro: 'sep 2026', importe: 30_474.04, saldo: 30_474.04, saldoFinal: 0, pagada: false, estado: 'Pendiente' },
  ],
});

const SALDADA = ayuda({
  numeroSolicitud: '105564',
  fecha: '05/09/2025',
  plazos: 4,
  cuotasPagadas: 4,
  cuotasPendientes: 0,
  enCurso: false,
  // El PHP mandó 3 filas de 4 plazos: la vista lo aclara.
  cuotas: [
    { numero: 2, mesHaberes: 'nov 2025', mesCobro: 'dic 2025', importe: 60_948.07, saldo: 182_844.21, saldoFinal: 121_896.14, pagada: true, estado: 'Pagado' },
    { numero: 3, mesHaberes: 'dic 2025', mesCobro: 'ene 2026', importe: 60_948.07, saldo: 121_896.14, saldoFinal: 60_948.07, pagada: true, estado: 'Pagado' },
    { numero: 4, mesHaberes: 'ene 2026', mesCobro: 'feb 2026', importe: 60_948.07, saldo: 60_948.07, saldoFinal: 0, pagada: true, estado: 'Pagado' },
  ],
});

describe('AyudaEconomicaComponent', () => {
  let fixture: ComponentFixture<AyudaEconomicaComponent>;
  let component: AyudaEconomicaComponent;

  const raiz = () => fixture.nativeElement as HTMLElement;
  const texto = () => raiz().textContent?.replace(/\s+/g, ' ') ?? '';
  const tarjetas = () => Array.from(raiz().querySelectorAll('article'));

  function crear(ayudasEconomicas: unknown, falla = false): void {
    // Se resetea acá y no sólo en afterEach: hay tests que crean el
    // componente dos veces para comparar dos escenarios.
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      imports: [AyudaEconomicaComponent],
      providers: [{
        provide: GestionListasService,
        useValue: {
          getListas: () => falla ? throwError(() => new Error('sin conexión')) : of({ ayudasEconomicas }),
          recargar: () => falla ? throwError(() => new Error('sin conexión')) : of({ ayudasEconomicas }),
        },
      }],
    });

    fixture = TestBed.createComponent(AyudaEconomicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('muestra una tarjeta por solicitud', () => {
    crear({ muestra: true, solicitudes: [EN_CURSO, SALDADA] });

    expect(tarjetas().length).toBe(2);
    expect(texto()).toContain('Solicitud N° 131937');
    expect(texto()).toContain('Solicitada el 14/05/2026');
  });

  it('marca el estado de cada una', () => {
    crear({ muestra: true, solicitudes: [EN_CURSO, SALDADA] });

    expect(tarjetas()[0].textContent).toContain('En curso');
    expect(tarjetas()[1].textContent).toContain('Pagada');
  });

  it('a la que está en curso le muestra el saldo y la próxima cuota', () => {
    crear({ muestra: true, solicitudes: [EN_CURSO] });

    expect(texto()).toContain('Saldo pendiente');
    expect(texto()).toContain('$ 60.948,08');
    expect(texto()).toContain('Próxima cuota 2');
    // Los haberes son de julio, pero se cobran en agosto: se muestra el cobro.
    expect(texto()).toContain('Próxima cuota 2$ 30.474,04 en ago 2026');
  });

  it('muestra el avance de cuotas', () => {
    crear({ muestra: true, solicitudes: [EN_CURSO] });

    expect(texto()).toContain('1 de 3 cuotas pagadas');
    expect(texto()).toContain('faltan 2');
    expect(component.progreso(EN_CURSO)).toBeCloseTo(33.33, 1);
  });

  it('arranca cerrada: en el encabezado sólo va lo mínimo para identificarla', () => {
    crear({ muestra: true, solicitudes: [EN_CURSO] });

    expect(component.estaDesplegada(EN_CURSO)).toBeFalse();

    const encabezado = tarjetas()[0].querySelector('button')!;
    expect(encabezado.getAttribute('aria-expanded')).toBe('false');
    expect(encabezado.textContent).toContain('Solicitud N° 131937');
    expect(encabezado.textContent).toContain('En curso');
    // El detalle no forma parte del encabezado: se revela al desplegar.
    expect(encabezado.textContent).not.toContain('Saldo pendiente');
    expect(encabezado.textContent).not.toContain('Cuota 1');

    // El contenedor del detalle está colapsado hasta que se toca.
    const detalle = tarjetas()[0].querySelector('button + div')!;
    expect(detalle.className).toContain('grid-rows-[0fr]');
  });

  it('al tocar el encabezado se despliega el detalle con el plan de pagos', () => {
    crear({ muestra: true, solicitudes: [EN_CURSO] });

    tarjetas()[0].querySelector('button')!.click();
    fixture.detectChanges();

    expect(component.estaDesplegada(EN_CURSO)).toBeTrue();
    expect(tarjetas()[0].querySelector('button + div')!.className).toContain('grid-rows-[1fr]');
    expect(texto()).toContain('Plan de pagos');
    expect(texto()).toContain('Cuota 1');
    expect(texto()).toContain('Cuota 3');
    expect(texto()).toContain('se cobra en jul 2026');
  });

  it('avisa cuando el sistema de gestión no mandó todas las cuotas', () => {
    crear({ muestra: true, solicitudes: [SALDADA] });

    expect(texto()).toContain('informa 3 de las 4 cuotas');
  });

  it('suma el saldo de las que están en curso sólo si hay más de una', () => {
    crear({ muestra: true, solicitudes: [EN_CURSO] });
    expect(texto()).not.toContain('Saldo pendiente total');

    const otra = ayuda({ numeroSolicitud: '142128', enCurso: true, saldo: 385_986.42, plazos: 6, cuotasPendientes: 6 });
    crear({ muestra: true, solicitudes: [EN_CURSO, otra] });

    expect(component.saldoTotal()).toBe(446_934.5);
    expect(texto()).toContain('Saldo pendiente total');
  });

  it('sin solicitudes lo dice, sin tarjetas vacías', () => {
    crear({ muestra: true, solicitudes: [] });

    expect(texto()).toContain('No registra solicitudes de ayuda económica.');
    expect(tarjetas().length).toBe(0);
  });

  it('con Muestra en false no muestra nada aunque lleguen solicitudes', () => {
    crear({ muestra: false, solicitudes: [EN_CURSO] });

    expect(tarjetas().length).toBe(0);
    expect(texto()).toContain('No registra solicitudes de ayuda económica.');
  });

  it('si falla la consulta ofrece reintentar', () => {
    crear({ muestra: true, solicitudes: [] }, true);

    expect(texto()).toContain('No pudimos obtener sus ayudas económicas.');
    expect(Array.from(raiz().querySelectorAll('button')).some(b => b.textContent?.includes('Reintentar'))).toBeTrue();
  });
});
