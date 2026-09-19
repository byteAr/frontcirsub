import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { cuotaFrancesa } from '../../utils/prestamo';
import SimuladorPrestamoComponent from './simulador-prestamo.component';

// En la app lo registra app.config.ts, que los tests no cargan.
registerLocaleData(localeEsAr);

describe('SimuladorPrestamoComponent', () => {
  let fixture: ComponentFixture<SimuladorPrestamoComponent>;
  let component: SimuladorPrestamoComponent;

  const raiz = () => fixture.nativeElement as HTMLElement;
  const campo = () => raiz().querySelector('#monto') as HTMLInputElement;
  const deslizador = () => raiz().querySelector('input[type="range"]') as HTMLInputElement;
  const plazos = () => Array.from(raiz().querySelectorAll('[role="radio"]')) as HTMLButtonElement[];

  function escribir(texto: string): void {
    campo().value = texto;
    campo().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function deslizarA(valor: number): void {
    deslizador().value = String(valor);
    deslizador().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SimuladorPrestamoComponent] }).compileComponents();
    fixture = TestBed.createComponent(SimuladorPrestamoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('arranca en $ 500.000 y en el plazo más largo', () => {
    expect(campo().value).toBe('500.000');
    expect(component.mesesElegidos()).toBe(12);
  });

  it('ofrece los cuatro plazos con su cuota', () => {
    expect(plazos().map(b => b.textContent?.replace(/\s+/g, ' ').trim().split(' cuotas')[0]))
      .toEqual(['3', '6', '9', '12']);

    const a6 = component.simulaciones().find(s => s.meses === 6)!;
    expect(a6.cuota).toBeCloseTo(cuotaFrancesa(500_000, 0.48, 6), 6);
  });

  it('al deslizar cambia el monto y se recalculan todas las cuotas', () => {
    const antes = component.simulaciones().map(s => s.cuota);

    deslizarA(1_000_000);

    expect(campo().value).toBe('1.000.000');
    const despues = component.simulaciones().map(s => s.cuota);
    despues.forEach((cuota, i) => expect(cuota).toBeCloseTo(antes[i] * 2, 6));
  });

  it('el campo y el deslizador son la misma cifra', () => {
    escribir('750000');

    expect(campo().value).toBe('750.000');
    expect(deslizador().value).toBe('750000');
  });

  it('pasado el máximo se planta en el máximo y avisa', () => {
    escribir('3500000');

    expect(component.monto()).toBe(2_000_000);
    expect(campo().value).toBe('2.000.000');
    expect(raiz().textContent).toContain('El máximo es $ 2.000.000.');
  });

  it('por debajo del mínimo avisa, esconde las cuotas y corrige al salir del campo', () => {
    escribir('5');

    expect(raiz().textContent).toContain('El mínimo es $ 50.000.');
    expect(plazos().length).toBe(0);

    campo().dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(campo().value).toBe('50.000');
    expect(plazos().length).toBe(4);
  });

  it('ignora lo que no sean números', () => {
    escribir('$ 12a3.0b00');

    expect(component.monto()).toBe(123_000);
    expect(campo().value).toBe('123.000');
  });

  it('elegir un plazo cambia el resumen', () => {
    plazos().find(b => b.textContent?.includes('3 cuotas'))!.click();
    fixture.detectChanges();

    expect(component.elegida()?.meses).toBe(3);
    expect(raiz().textContent).toContain('Pagaría 3 cuotas fijas de');
  });

  it('muestra las tasas en texto', () => {
    const texto = raiz().textContent ?? '';

    expect(texto).toContain('TNA 48%');
    expect(texto).toContain('TEM 4%');
    expect(texto).toContain('TEA 60,1%');
  });
});
