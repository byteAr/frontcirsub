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

@Injectable({
  providedIn: 'root'
})
export class ReintegrosService {

  http = inject(HttpClient);

  url = environment.API_URL;

  getTiposDocumento(): Observable<TipoDocumentoReintegro[]> {
    return this.http.get<TipoDocumentoReintegro[]>(`${this.url}/reintegros/tipos-documento`)
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
