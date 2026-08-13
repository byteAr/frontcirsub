import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Tope de espera de la subida. Sin esto, una conexión que se corta a mitad
 * de camino deja el observable colgado y el socio encerrado en el modal.
 */
const TIMEOUT_SUBIDA_MS = 120_000;

export interface TipoDocumentoReintegro {
  codigo: string;
  descripcion: string;
}

export interface ArchivoReintegroGuardado {
  nombreOriginal: string;
  nombreArchivo: string;
  tamanio: number;
}

export interface RespuestaReintegro {
  ok: boolean;
  archivos: ArchivoReintegroGuardado[];
}

export type EstadoOrdenPago = 'pendiente' | 'aprobado' | 'otro';

/**
 * Espejo de OrdenPago del backend. Los campos de texto nunca vienen vacíos:
 * si falta el dato llega "-", así la tabla los pinta sin condicionales.
 */
export interface OrdenPago {
  comprobante: string;
  fecha: string;
  /** Sólo para ordenar, no se muestra. */
  fechaIso: string | null;
  estado: EstadoOrdenPago;
  estadoDescripcion: string;
  importe: number;
  fechaPago: string;
  detalle: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReintegrosService {

  http = inject(HttpClient);

  url = environment.API_URL;

  getTiposDocumento(): Observable<TipoDocumentoReintegro[]> {
    return this.http.get<TipoDocumentoReintegro[]>(`${this.url}/reintegros/tipos-documento`)
  }

  /**
   * Órdenes de pago del socio. No lleva parámetros: el backend saca el id y
   * el DNI del token.
   */
  getOrdenesPago(): Observable<OrdenPago[]> {
    const token = localStorage.getItem('token');

    return this.http.get<OrdenPago[]>(`${this.url}/reintegros/ordenes-pago`, {
      headers: {
        Authorization: `Bearer ${ token }`
      }
    })
  }

  subirDocumentos(tipoDocumento: string, archivos: File[]): Observable<RespuestaReintegro> {
    const formData = new FormData();
    formData.append('tipoDocumento', tipoDocumento);
    archivos.forEach(archivo => formData.append('documentos', archivo, archivo.name));

    const token = localStorage.getItem('token');

    return this.http.post<RespuestaReintegro>(`${this.url}/reintegros/documentos`, formData, {
      headers: {
        Authorization: `Bearer ${ token }`
      }
    }).pipe(
      timeout(TIMEOUT_SUBIDA_MS)
    )
  }
}
