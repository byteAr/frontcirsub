import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface PlazoPrestamo {
  meses: number;
  /** Tasa nominal anual como fracción: 0.48 es 48%. */
  tna: number;
}

export interface CondicionesPrestamo {
  montoMinimo: number;
  montoMaximo: number;
  /** De a cuánto se mueve el deslizador. */
  paso: number;
  /** Con qué monto arranca el simulador. */
  montoInicial: number;
  /**
   * Cada plazo lleva su propia tasa aunque hoy sean todas iguales: así suele
   * venir la data real, con tasas más altas a más meses.
   */
  plazos: PlazoPrestamo[];
}

/**
 * VALORES DE RELLENO. Todavía no hay datos reales: el máximo lo definió la
 * mutual, el resto (mínimo, paso, monto inicial y tasa) son supuestos para
 * poder armar la pantalla.
 */
const CONDICIONES_PROVISORIAS: CondicionesPrestamo = {
  montoMinimo: 50_000,
  montoMaximo: 2_000_000,
  paso: 10_000,
  montoInicial: 500_000,
  plazos: [
    { meses: 3, tna: 0.48 },
    { meses: 6, tna: 0.48 },
    { meses: 9, tna: 0.48 },
    { meses: 12, tna: 0.48 },
  ],
};

/**
 * Condiciones de la ayuda económica. Hoy devuelve valores fijos; cuando
 * gestión mande los reales, sólo cambia este método y la pantalla no se toca.
 * Ya devuelve un Observable para que ese cambio no altere a quien lo usa.
 */
@Injectable({ providedIn: 'root' })
export class AyudaEconomicaService {

  getCondiciones(): Observable<CondicionesPrestamo> {
    return of(CONDICIONES_PROVISORIAS);
  }
}
