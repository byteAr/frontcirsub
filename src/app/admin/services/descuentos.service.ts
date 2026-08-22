import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConceptoDescuento {
  /** Ordena las filas dentro del mes; no se muestra. */
  codigo: string;
  /** Columna CONCEPTO. */
  concepto: string;
  /** Columna DETALLE: el texto descriptivo, ya sin la cuota. */
  detalle: string;
  importe: number;
  cuota?: number;
  totalCuotas?: number;
  /** "Cuota 1 de 6". Sólo viene en conceptos que se pagan en cuotas. */
  etiquetaCuota?: string;
}

/** Espejo de PeriodoDescuentos del backend: un mes con sus conceptos. */
export interface PeriodoDescuentos {
  periodo: string;
  /** Sólo para ordenar, no se muestra. */
  periodoIso: string | null;
  /** "SEPTIEMBRE 2026", listo para el encabezado de la fila. */
  etiqueta: string;
  total: number;
  conceptos: ConceptoDescuento[];
}

@Injectable({
  providedIn: 'root'
})
export class DescuentosService {

  http = inject(HttpClient);

  url = environment.API_URL;

  /**
   * Descuentos del socio agrupados por mes. No lleva parámetros: el backend
   * saca el id y el DNI del token.
   */
  getDescuentos(): Observable<PeriodoDescuentos[]> {
    const token = localStorage.getItem('token');

    return this.http.get<PeriodoDescuentos[]>(`${this.url}/descuentos`, {
      headers: {
        Authorization: `Bearer ${ token }`
      }
    })
  }
}
