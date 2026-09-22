import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, delay, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { ENCUESTA_MODO_DEMO } from '../../shared/modo-demo';

interface Cbu {
  cbu: string
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

  getCbu(id: string): Observable<Cbu> {
    const cached = this.cbuCache.get(id);
    if (cached) return cached;

    const request$ = this.http.get<Cbu>(`${this.url}/credencial?id=${id}`).pipe(
      catchError(error => {
        this.cbuCache.delete(id);
        return throwError(() => error);
      }),
      shareReplay(1)
    );

    this.cbuCache.set(id, request$);
    return request$;
  }

  updateCbu(id: number, cbu: string) {
    return this.http.patch(`${this.url}/credencial`, { id, cbu }).pipe(
      tap(() => this.cbuCache.delete(id.toString()))
    );
  }

  updateCbuPhp(id: number, cbu: string) {
    return this.http.post(`https://gestion.cirsubgn.org.ar/Cirsub/CirsubApp/Transf/receptorcbu.php`, { id, cbu }).pipe(
      tap(() => this.cbuCache.delete(id.toString()))
    );
  }

  /**
   * Sin id: el backend lo toma del token, así nadie califica a nombre de
   * otro. Mandarlo además da 400, porque el backend rechaza campos de más.
   */
  updateEncuesta(servicio: number, atencion: number): Observable<any> {
    // Modo demo: se simula el envío, con una espera corta para que se vea el
    // "Enviando...". No se guarda nada: ver shared/modo-demo.ts.
    if (this.encuestaModoDemo) return of({ ok: true, demo: true }).pipe(delay(700));

    const token = localStorage.getItem('token');

    return this.http.post(`${this.url}/credencial/encuesta`, { servicio, atencion }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
