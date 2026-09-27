import { DOCUMENT } from '@angular/common';
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

/** Qué parte de los asociados del período pasó por una vista. */
export interface UsoDeVista {
  /** La ruta dentro de /dashboard: "beneficios", "reintegros"… */
  vista: string;
  personas: number;
  /** De 0 a 100, sobre el total de personas del período. */
  porcentaje: number;
}

/** Un día, o de lunes a hoy, contado en personas. */
export interface ResumenPeriodo {
  desde: string;
  hasta: string;
  plataforma: Plataforma | 'todas';
  personas: number;
  porPlataforma: Record<Plataforma, number>;
  porHora: { hora: number; personas: number }[];
  horaPico: number | null;
  vistas: UsoDeVista[];
}

/** Quién tiene la app abierta ahora: la sostiene un latido cada 30 s y sale al cerrarla. */
export interface ActivosAhora {
  total: number;
  pwa: number;
  web: number;
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
  private readonly document = inject(DOCUMENT);
  private readonly url = `${environment.API_URL}/estadisticas`;

  private permiso$?: Observable<Permiso>;

  private headers() {
    return { Authorization: `Bearer ${localStorage.getItem('token')}` };
  }

  registrarActividad(plataforma: Plataforma, vista?: string): Observable<void> {
    const cuerpo = vista ? { plataforma, vista } : { plataforma };
    return this.http.post<void>(`${this.url}/actividad`, cuerpo, { headers: this.headers() });
  }

  latido(plataforma: Plataforma): Observable<void> {
    return this.http.post<void>(`${this.url}/latido`, { plataforma }, { headers: this.headers() });
  }

  /**
   * La salida se manda con sendBeacon: es lo único que el navegador garantiza
   * que sale mientras la página se está cerrando. No deja poner cabeceras, así
   * que el token va en el cuerpo, como formulario, que además no dispara la
   * consulta previa de CORS. Si no está disponible, fetch con keepalive.
   */
  avisarSalida(plataforma: Plataforma): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = `${this.url}/salida`;
    const cuerpo = new URLSearchParams({ token, plataforma });

    const enviado = this.document.defaultView?.navigator?.sendBeacon?.(url, cuerpo);
    if (!enviado) {
      fetch(url, { method: 'POST', body: cuerpo, keepalive: true }).catch(() => undefined);
    }
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

  ahora(): Observable<ActivosAhora> {
    return this.http.get<ActivosAhora>(`${this.url}/ahora`, { headers: this.headers() });
  }

  periodo(desde: string, hasta: string, plataforma?: Plataforma): Observable<ResumenPeriodo> {
    const params: Record<string, string> = { desde, hasta };
    if (plataforma) params['plataforma'] = plataforma;
    return this.http.get<ResumenPeriodo>(`${this.url}/periodo`, { headers: this.headers(), params });
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
