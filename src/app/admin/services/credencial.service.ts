import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, delay, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { ENCUESTA_MODO_DEMO } from '../../shared/modo-demo';

interface Cbu {
  cbu: string
}

/** Lo que responde el backend al cambiar el CBU. Con ok en false no quedó guardado. */
export interface RespuestaCbu {
  ok: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CredencialService {

  http = inject(HttpClient);

  private encuestaModoDemo = inject(ENCUESTA_MODO_DEMO);

  url = environment.API_URL;

  // Cacheado por Persona.Id (clave única por usuario autenticado), no por
  // sesión de logout: distintas cuentas nunca comparten clave en la misma
  // pestaña, así que no hace falta limpiar esto en AuthService.logout().
  private cbuCache = new Map<string, Observable<Cbu>>();

  constructor() { }

  /**
   * CBU del asociado autenticado. El id no viaja: el backend lo toma del
   * token. Acá se usa sólo como clave de la caché, para que dos cuentas en la
   * misma pestaña no compartan el dato.
   */
  getCbu(id: string): Observable<Cbu> {
    const cached = this.cbuCache.get(id);
    if (cached) return cached;

    const request$ = this.http.get<Cbu>(`${this.url}/credencial`, { headers: this.conToken() }).pipe(
      catchError(error => {
        this.cbuCache.delete(id);
        return throwError(() => error);
      }),
      shareReplay(1)
    );

    this.cbuCache.set(id, request$);
    return request$;
  }

  /**
   * Cambia el CBU del asociado autenticado. Como en getCbu, el id sólo sirve
   * para la caché: al backend no se le manda, lo toma del token. Mandarlo da
   * 400, porque rechaza campos de más.
   *
   * El backend contesta 200 aunque no haya podido guardar: hay que mirar
   * "ok" en la respuesta.
   */
  updateCbu(id: number, cbu: string): Observable<RespuestaCbu> {
    return this.http.patch<RespuestaCbu>(`${this.url}/credencial`, { cbu }, { headers: this.conToken() }).pipe(
      tap(() => this.cbuCache.delete(id.toString()))
    );
  }

  private conToken(): Record<string, string> {
    return { Authorization: `Bearer ${localStorage.getItem('token')}` };
  }

  /**
   * Sin id: el backend lo toma del token, así nadie califica a nombre de
   * otro. Mandarlo además da 400, porque el backend rechaza campos de más.
   */
  updateEncuesta(servicio: number, atencion: number): Observable<any> {
    // Modo demo: se simula el envío, con una espera corta para que se vea el
    // "Enviando...". No se guarda nada: ver shared/modo-demo.ts.
    if (this.encuestaModoDemo) return of({ ok: true, demo: true }).pipe(delay(700));

    return this.http.post(`${this.url}/credencial/encuesta`, { servicio, atencion }, {
      headers: this.conToken(),
    });
  }
}
