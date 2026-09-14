import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, switchMap, throwError, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';
import { buildGestionApiKey, GESTION_API_BASE } from '../../shared/utils/gestion-api-key';

const TIMEOUT_MS = 15_000;

/** Una fila del primer array, tal cual la manda api-list_tramite.php. */
export interface ValorPhp {
  tipo: 'sub' | 'val' | string;
  codigo: string;
  descr: string;
  /** Llega como texto: "104073.00". */
  valor: string;
}

/** Una fila del segundo array. Ojo con "descrp", que va sin la i. */
export interface TipoTramitePhp {
  id: string;
  clave: string;
  descrp: string;
}

/** La respuesta completa: una tupla de dos arrays, no un objeto. */
export type ListasPhp = [ValorPhp[], TipoTramitePhp[]];

export interface ValorItem {
  codigo: string;
  descripcion: string;
  importe: number;
}

/**
 * Los valores ya repartidos en las secciones de la planilla de Afiliaciones.
 * Lo que no se reconoce cae en "otros" en vez de descartarse: si gestión suma
 * un concepto nuevo, el socio igual lo ve.
 */
export interface ValoresMutual {
  /** Cuota social por tipo de socio: la clave es "1", "2" o "3". */
  cuotaPorTipo: Record<string, number | null>;
  servicios: {
    sepelio: number | null;
    farmacia: number | null;
    evacuacion: number | null;
    seguroVida: number | null;
  };
  subsidios: ValorItem[];
  reintegroSepelio: { titular: number | null; esposa: number | null };
  seguroVida: { titular: number | null; esposa: number | null };
  otros: ValorItem[];
}

export interface TipoTramite {
  /** RM, RN, TE... Es el prefijo con el que se guarda el archivo en disco. */
  clave: string;
  descripcion: string;
  /**
   * Beneficio que el socio tiene que tener contratado para que este trámite
   * le aparezca. Si no está, el trámite es para todos.
   */
  beneficio?: 'far' | 'eva' | 'sep' | 'seg';
}

export interface ListasGestion {
  valores: ValoresMutual;
  tipos: TipoTramite[];
}

/**
 * Orden de los subsidios en la planilla impresa, por código. Se respeta para
 * que la pantalla y el papel se lean igual.
 */
const ORDEN_SUBSIDIOS = ['1', '5', '4', '3', '2'];

/**
 * Nombres para mostrar de los tipos de trámite. El PHP los manda en mayúsculas
 * y con alguna abreviatura de más ("REINTEGRO DE MEDICAMTO"), que no es lo que
 * conviene ponerle adelante al socio. Si aparece una clave nueva se muestra lo
 * que haya mandado el PHP, no se esconde.
 */
const NOMBRES_TIPO_TRAMITE: Record<string, string> = {
  RM: 'Reintegro de medicamentos',
  RN: 'Reintegro por nacimiento',
  RE: 'Reintegro por escolaridad',
  RC: 'Reintegro por casamiento',
  TE: 'Trámite de evacuación',
  TP: 'Trámite de préstamo',
};

/**
 * Qué beneficio exige cada trámite. Esto el PHP no lo manda, así que vive acá.
 * Es sólo para no ofrecerle al socio algo que no puede pedir: la validación de
 * verdad la hace el backend al recibir los documentos.
 */
const BENEFICIO_POR_TRAMITE: Record<string, TipoTramite['beneficio']> = {
  RM: 'far',
  TE: 'eva',
};

@Injectable({ providedIn: 'root' })
export class GestionListasService {

  private http = inject(HttpClient);

  /**
   * El listado es el mismo para todos los socios —es una tabla de referencia,
   * no depende de quién pregunte— así que se pide una sola vez por sesión.
   */
  private cache?: Observable<ListasGestion>;

  getListas(): Observable<ListasGestion> {
    if (!this.cache) {
      this.cache = this.pedirAlPhp().pipe(
        catchError(() => this.pedirAlBackend()),
        map(crudo => this.normalizar(crudo)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.cache;
  }

  /** Vuelve a pedir los datos, descartando lo cacheado. */
  recargar(): Observable<ListasGestion> {
    this.cache = undefined;
    return this.getListas();
  }

  /**
   * Llamada directa al PHP desde el navegador.
   *
   * userId y dni van porque el PHP los exige para contestar, pero no filtra
   * nada con ellos: devuelve la misma tabla para cualquier valor. Por eso se
   * mandan en cero y no hace falta el token.
   */
  private pedirAlPhp(): Observable<ListasPhp> {
    return this.http.post<ListasPhp>(
      `${GESTION_API_BASE}/api-list_tramite.php`,
      { userId: 0, dni: '0' },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': buildGestionApiKey(),
        },
      },
    ).pipe(
      timeout(TIMEOUT_MS),
      switchMap(respuesta => this.validar(respuesta)),
    );
  }

  /**
   * Salida de emergencia: el mismo dato pedido a través del backend.
   *
   * Hoy es el camino que funciona siempre. El PHP no manda cabeceras CORS y
   * contesta 405 al preflight, así que el navegador bloquea la llamada directa
   * antes de que salga. Cuando gestión agregue los headers, el pedido de
   * arriba va a andar solo y esto queda como red de contención.
   */
  private pedirAlBackend(): Observable<ListasPhp> {
    const token = localStorage.getItem('token');

    return this.http.get<ListasPhp>(`${environment.API_URL}/reintegros/listas-gestion`, {
      headers: { Authorization: `Bearer ${token}` },
    }).pipe(
      timeout(TIMEOUT_MS),
      switchMap(respuesta => this.validar(respuesta)),
    );
  }

  /**
   * El PHP contesta 200 con {ok:0} o con el texto crudo de un error de MySQL
   * cuando algo falla, así que no alcanza con que el request no tire error.
   */
  private validar(respuesta: unknown): Observable<ListasPhp> {
    if (!Array.isArray(respuesta) || !Array.isArray(respuesta[0]) || !Array.isArray(respuesta[1])) {
      return throwError(() => new Error('Respuesta inesperada de api-list_tramite.php'));
    }

    return of(respuesta as ListasPhp);
  }

  private normalizar([valores, tipos]: ListasPhp): ListasGestion {
    return {
      valores: this.normalizarValores(valores ?? []),
      tipos: this.normalizarTipos(tipos ?? []),
    };
  }

  private normalizarValores(filas: ValorPhp[]): ValoresMutual {
    const valores: ValoresMutual = {
      cuotaPorTipo: { '1': null, '2': null, '3': null },
      servicios: { sepelio: null, farmacia: null, evacuacion: null, seguroVida: null },
      subsidios: [],
      reintegroSepelio: { titular: null, esposa: null },
      seguroVida: { titular: null, esposa: null },
      otros: [],
    };

    const subsidios = new Map<string, ValorItem>();

    for (const fila of filas) {
      const item = this.aItem(fila);
      // El código no alcanza por sí solo para identificar un concepto: hay un
      // val/1 y un sub/1 que no tienen nada que ver entre sí.
      const clave = `${(fila.tipo ?? '').trim()}/${item.codigo}`;

      switch (clave) {
        case 'val/1': case 'val/2': case 'val/3':
          valores.cuotaPorTipo[item.codigo] = item.importe;
          break;
        case 'val/4': valores.servicios.farmacia = item.importe; break;
        case 'val/5': valores.servicios.evacuacion = item.importe; break;
        case 'val/6': valores.servicios.sepelio = item.importe; break;
        case 'val/7': valores.servicios.seguroVida = item.importe; break;

        case 'sub/1': case 'sub/2': case 'sub/3': case 'sub/4': case 'sub/5':
          subsidios.set(item.codigo, item);
          break;
        case 'sub/6': valores.reintegroSepelio.titular = item.importe; break;
        case 'sub/7': valores.reintegroSepelio.esposa = item.importe; break;
        case 'sub/12': valores.seguroVida.titular = item.importe; break;
        case 'sub/14': valores.seguroVida.esposa = item.importe; break;

        default:
          valores.otros.push(item);
      }
    }

    // Primero los del orden de la planilla; si aparece un subsidio nuevo, va
    // detrás en vez de perderse.
    const conocidos = ORDEN_SUBSIDIOS
      .map(codigo => subsidios.get(codigo))
      .filter((item): item is ValorItem => !!item);

    const nuevos = [...subsidios.entries()]
      .filter(([codigo]) => !ORDEN_SUBSIDIOS.includes(codigo))
      .map(([, item]) => item);

    valores.subsidios = [...conocidos, ...nuevos];

    return valores;
  }

  private aItem(fila: ValorPhp): ValorItem {
    return {
      codigo: (fila.codigo ?? '').toString().trim(),
      descripcion: (fila.descr ?? '').trim() || '-',
      // Los importes llegan como texto: "1080000.00".
      importe: Number(fila.valor) || 0,
    };
  }

  private normalizarTipos(filas: TipoTramitePhp[]): TipoTramite[] {
    return filas
      .filter(fila => (fila?.clave ?? '').trim())
      .map(fila => {
        const clave = fila.clave.trim().toUpperCase();

        return {
          clave,
          descripcion: NOMBRES_TIPO_TRAMITE[clave] ?? this.aTextoLegible(fila.descrp),
          ...(BENEFICIO_POR_TRAMITE[clave] && { beneficio: BENEFICIO_POR_TRAMITE[clave] }),
        };
      });
  }

  /** "REINTEGRO DE MEDICAMTO" -> "Reintegro de medicamto". */
  private aTextoLegible(crudo: string | undefined): string {
    const texto = (crudo ?? '').trim().toLowerCase();
    if (!texto) return 'Trámite';

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
