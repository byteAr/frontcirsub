/**
 * Cálculo de préstamos por sistema francés: la cuota es la misma todos los
 * meses y dentro de ella va bajando el interés y subiendo el capital.
 *
 * Todas las tasas van como fracción: 0.48 es 48%.
 */

/** Tasa efectiva mensual a partir de la nominal anual. */
export function tasaMensual(tna: number): number {
  return tna / 12;
}

/** Tasa efectiva anual: lo que rinde la mensual capitalizada doce veces. */
export function tasaEfectivaAnual(tna: number): number {
  return Math.pow(1 + tasaMensual(tna), 12) - 1;
}

/**
 * Cuota fija de un préstamo de `capital` a `meses` con la `tna` dada.
 *
 *   cuota = capital · i / (1 − (1 + i)^−n)
 *
 * Con tasa cero la fórmula divide por cero: ahí la cuota es el capital
 * repartido en partes iguales.
 */
export function cuotaFrancesa(capital: number, tna: number, meses: number): number {
  if (capital <= 0 || meses <= 0) return 0;

  const i = tasaMensual(tna);
  if (i === 0) return capital / meses;

  return (capital * i) / (1 - Math.pow(1 + i, -meses));
}

export interface Simulacion {
  meses: number;
  tna: number;
  cuota: number;
  totalADevolver: number;
  intereses: number;
}

export function simular(capital: number, tna: number, meses: number): Simulacion {
  const cuota = cuotaFrancesa(capital, tna, meses);
  const totalADevolver = cuota * meses;

  return {
    meses,
    tna,
    cuota,
    totalADevolver,
    intereses: totalADevolver - capital,
  };
}
