import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, Observable, shareReplay, tap, throwError } from 'rxjs';

interface Cbu {
  cbu: string
}

@Injectable({
  providedIn: 'root'
})
export class CredencialService {

  http = inject(HttpClient);

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

  updateEncuesta(id: number, servicio: number, atencion: number): Observable<any> {
    return this.http.post(`${this.url}/credencial/encuesta`, { id, servicio, atencion })
  }
}
