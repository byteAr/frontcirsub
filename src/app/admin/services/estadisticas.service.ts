import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, of, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';

export type Plataforma = 'pwa' | 'web';

export interface Metricas {
  /** Asociados distintos: el que entra tres veces cuenta una. */
  personas: number;
  /** Ratos de uso, que se cortan a los 30 minutos sin actividad. */
  sesiones: number;
  /** Pantallas abiertas. */
  visitas: number;
}

export interface ResumenDia {
  fecha: string;
  plataforma: Plataforma | 'todas';
  totales: Metricas;
  porPlataforma: Record<Plataforma, Metricas>;
  porHora: (Metricas & { hora: number })[];
  horaPico: number | null;
}

export interface PuntoTendencia extends Metricas {
  fecha: string;
}

export interface PersonaConAcceso {
  dni: string;
  nombre: string;
  apellido: string;
}

export interface Permiso {
  puedeVer: boolean;
  esDueno: boolean;
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.API_URL}/estadisticas`;

  private permiso$?: Observable<Permiso>;

  private headers() {
    return { Authorization: `Bearer ${localStorage.getItem('token')}` };
  }

  registrarActividad(plataforma: Plataforma): Observable<void> {
    return this.http.post<void>(`${this.url}/actividad`, { plataforma }, { headers: this.headers() });
  }

  /**
   * Se pregunta una vez por sesión de la app: lo usan el sidebar y la ruta,
   * y no cambia mientras el asociado está adentro. Si falla, sin acceso.
   */
  permiso(): Observable<Permiso> {
    this.permiso$ ??= this.http
      .get<Permiso>(`${this.url}/permiso`, { headers: this.headers() })
      .pipe(
        catchError(() => of({ puedeVer: false, esDueno: false })),
        shareReplay(1),
      );
    return this.permiso$;
  }

  /** Al cerrar sesión: el próximo que entre puede tener otro permiso. */
  olvidarPermiso(): void {
    this.permiso$ = undefined;
  }

  dia(fecha: string, plataforma?: Plataforma): Observable<ResumenDia> {
    const params: Record<string, string> = { fecha };
    if (plataforma) params['plataforma'] = plataforma;
    return this.http.get<ResumenDia>(`${this.url}/dia`, { headers: this.headers(), params });
  }

  tendencia(hasta: string, dias = 30, plataforma?: Plataforma): Observable<PuntoTendencia[]> {
    const params: Record<string, string> = { hasta, dias: String(dias) };
    if (plataforma) params['plataforma'] = plataforma;
    return this.http.get<PuntoTendencia[]>(`${this.url}/tendencia`, { headers: this.headers(), params });
  }

  listarAccesos(): Observable<PersonaConAcceso[]> {
    return this.http.get<PersonaConAcceso[]>(`${this.url}/accesos`, { headers: this.headers() });
  }

  buscarAsociado(dni: string): Observable<PersonaConAcceso> {
    return this.http.get<PersonaConAcceso>(`${this.url}/accesos/buscar`, {
      headers: this.headers(),
      params: { dni },
    });
  }

  darAcceso(dni: string): Observable<PersonaConAcceso> {
    return this.http.post<PersonaConAcceso>(`${this.url}/accesos`, { dni }, { headers: this.headers() });
  }

  quitarAcceso(dni: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.url}/accesos/${dni}`, { headers: this.headers() });
  }
}
