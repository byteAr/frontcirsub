import { cuotaFrancesa, simular, tasaEfectivaAnual, tasaMensual } from './prestamo';

describe('cálculo de préstamos (sistema francés)', () => {

  it('pasa la TNA a tasa mensual', () => {
    expect(tasaMensual(0.48)).toBeCloseTo(0.04, 10);
  });

  it('la TEA capitaliza la mensual: 48% nominal es ~60,1% efectivo', () => {
    expect(tasaEfectivaAnual(0.48)).toBeCloseTo(0.601032, 5);
  });

  it('calcula la cuota fija', () => {
    // 100.000 a 12 meses al 4% mensual: valor de tabla, 10.655,22.
    expect(cuotaFrancesa(100_000, 0.48, 12)).toBeCloseTo(10_655.22, 2);
  });

  it('a más plazo, cuota más baja pero más intereses', () => {
    const a3 = simular(1_000_000, 0.48, 3);
    const a12 = simular(1_000_000, 0.48, 12);

    expect(a12.cuota).toBeLessThan(a3.cuota);
    expect(a12.intereses).toBeGreaterThan(a3.intereses);
  });

  it('el total a devolver es cuota por plazo, y los intereses lo que sobra del capital', () => {
    const s = simular(500_000, 0.48, 6);

    expect(s.totalADevolver).toBeCloseTo(s.cuota * 6, 6);
    expect(s.intereses).toBeCloseTo(s.totalADevolver - 500_000, 6);
  });

  it('con tasa cero reparte el capital en partes iguales, sin dividir por cero', () => {
    expect(cuotaFrancesa(120_000, 0, 12)).toBe(10_000);
  });

  it('sin capital o sin plazo la cuota es cero', () => {
    expect(cuotaFrancesa(0, 0.48, 12)).toBe(0);
    expect(cuotaFrancesa(100_000, 0.48, 0)).toBe(0);
  });
});
