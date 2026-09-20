import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, switchMap, throwError, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';
import { buildGestionApiKey, GESTION_API_BASE } from '../../shared/utils/gestion-api-key';
import { ClaveBeneficio } from '../constants/beneficios';

const TIMEOUT_MS = 15_000;

/** Una fila del primer array, tal cual la manda api-list_tramite.php. */
export interface ValorPhp {
  tipo: 'sub' | 'val' | string;
  codigo: string;
  descr: string;
  /** Llega como texto: "104073.00". */
  valor: string;
  /** Mes desde el que rige el importe: "sep 26". Se agregó después. */
  FechaUpd?: string;
}

/** Una fila del segundo array. Ojo con "descrp", que va sin la i. */
export interface TipoTramitePhp {
  id: string;
  clave: string;
  descrp: string;
}

/** Una cuenta de ahorro del tercer elemento. */
export interface AhorroPhp {
  Tipo: string;
  /** Llega como texto: "112825.19". */
  Am_saldo: string;
  /** AAAA-MM-DD. */
  Am_fechamov: string;
}

/**
 * El tercer elemento, que a diferencia de los otros dos es un objeto y no un
 * array. `Muestra` dice si al socio hay que ofrecerle la sección.
 */
export interface AhorrosPhp {
  /**
   * Puede llegar como booleano, como 0/1 o como "0"/"1": depende de si el PHP
   * lo escribe a mano o lo saca de MySQL.
   */
  Muestra?: boolean | number | string;
  Ahorros?: AhorroPhp[];
}

/**
 * Una cuota de una ayuda económica, tal cual la manda el PHP: hay una fila
 * por cuota, no por solicitud, y los datos de la solicitud se repiten en
 * todas sus filas.
 */
export interface CuotaAyudaPhp {
  NSolicitud: string;
  /** AAAA-MM-DD. */
  FSolicitud: string;
  Capital: string;
  Plazos: string;
  /** Total a reintegrar, capital más intereses. */
  reintegro: string;
  ValorCuota: string;
  /** Número de cuota dentro de la solicitud. */
  Cuota: string;
  /** Mes en que se descuenta: "sep 2026". */
  MesDto: string;
  saldo: string;
  cobro: string;
  saldoFinal: string;
  Estado: string;
}

export interface AyudasEcPhp {
  Muestra?: boolean | number | string;
  AyudasEc?: CuotaAyudaPhp[];
}

/**
 * La respuesta completa. Es una tupla, no un objeto, y le fueron agregando
 * elementos con el tiempo: del tercero en adelante pueden no venir.
 */
export type ListasPhp = [ValorPhp[], TipoTramitePhp[], AhorrosPhp?, AyudasEcPhp?];

export interface ValorItem {
  codigo: string;
  descripcion: string;
  importe: number;
  /** Mes de actualización tal cual lo manda el PHP: "sep 26", o "-". */
  actualizado: string;
  /** "2026-09", sólo para ordenar y para sacar el período. */
  actualizadoIso: string | null;
}

/**
 * Los valores ya repartidos en las secciones de la planilla de Afiliaciones.
 * Lo que no se reconoce cae en "otros" en vez de descartarse: si gestión suma
 * un concepto nuevo, el socio igual lo ve.
 */
export interface ValoresMutual {
  /** Cuota social por tipo de socio: la clave es "1", "2" o "3". */
  cuotaPorTipo: Record<string, ValorItem | null>;
  servicios: {
    sepelio: ValorItem | null;
    farmacia: ValorItem | null;
    evacuacion: ValorItem | null;
    seguroVida: ValorItem | null;
  };
  subsidios: ValorItem[];
  reintegroSepelio: { titular: ValorItem | null; esposa: ValorItem | null };
  seguroVida: { titular: ValorItem | null; esposa: ValorItem | null };
  otros: ValorItem[];
  /**
   * Período de la planilla: el mes más reciente de todo lo que vino
   * ("Septiembre 2026"). Sale de los datos, no de una constante.
   */
  periodo: string;
}

export interface TipoTramite {
  /** RM, RN, TE... Es el prefijo con el que se guarda el archivo en disco. */
  clave: string;
  descripcion: string;
  /**
   * Beneficio al que el socio tiene que estar adherido para iniciar este
   * trámite. Si no está, el trámite es para todos.
   */
  beneficio?: ClaveBeneficio;
}

export interface Ahorro {
  tipo: string;
  saldo: number;
  /** dd/mm/aaaa, listo para mostrar. */
  fecha: string;
  /** AAAA-MM-DD, sólo para ordenar. */
  fechaIso: string | null;
}

export interface AhorrosSocio {
  /** Si viene en false, la sección no se le ofrece al socio. */
  muestra: boolean;
  cuentas: Ahorro[];
}

export interface CuotaAyuda {
  numero: number;
  /** Mes de los haberes sobre los que se descuenta, tal cual lo manda el PHP. */
  mesHaberes: string;
  /**
   * Mes en que el socio lo ve descontado, que es el siguiente al de haberes:
   * el sueldo de septiembre se cobra en octubre. Es el que se muestra.
   */
  mesCobro: string;
  importe: number;
  /** Lo que se debía antes de pagar esta cuota. */
  saldo: number;
  /** Lo que queda después de pagarla. */
  saldoFinal: number;
  pagada: boolean;
  /** El literal del PHP, para mostrarlo si aparece uno que no conocemos. */
  estado: string;
}

export interface AyudaEconomica {
  numeroSolicitud: string;
  /** dd/mm/aaaa, listo para mostrar. */
  fecha: string;
  /** AAAA-MM-DD, sólo para ordenar. */
  fechaIso: string | null;
  capital: number;
  plazos: number;
  valorCuota: number;
  /** Capital más intereses. */
  totalAReintegrar: number;
  cuotas: CuotaAyuda[];
  cuotasPagadas: number;
  cuotasPendientes: number;
  enCurso: boolean;
  /** Lo que falta pagar. Cero si está saldada. */
  saldo: number;
  /** La primera cuota que todavía no se pagó. */
  proximaCuota: CuotaAyuda | null;
}

export interface AyudasEconomicasSocio {
  muestra: boolean;
  solicitudes: AyudaEconomica[];
}

export interface ListasGestion {
  valores: ValoresMutual;
  tipos: TipoTramite[];
  ahorros: AhorrosSocio;
  ayudasEconomicas: AyudasEconomicasSocio;
}

/**
 * Orden de los subsidios en la planilla impresa, por código. Se respeta para
 * que la pantalla y el papel se lean igual.
 */
const ORDEN_SUBSIDIOS = ['1', '5', '4', '3', '2'];

/**
 * Qué beneficio exige cada trámite. Esto el PHP no lo manda, así que vive acá.
 * Sirve para avisarle al socio antes de que cargue documentos que se van a
 * rechazar: la validación de verdad la hace el backend al recibirlos.
 */
const BENEFICIO_POR_TRAMITE: Record<string, ClaveBeneficio | undefined> = {
  RM: 'far',
  TE: 'eva',
};

/** Abreviaturas de los meses, en orden, para escribirlos. */
const MESES_ABREVIADOS_EN_ORDEN = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** Abreviaturas con las que el PHP manda el mes en FechaUpd. */
const MESES_ABREVIADOS: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12,
};

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Lo que se muestra cuando un dato no vino. */
const SIN_DATO = '-';

@Injectable({ providedIn: 'root' })
export class GestionListasService {

  private http = inject(HttpClient);

  /**
   * Los valores y los tipos de trámite son iguales para todos los socios, así
   * que se piden una sola vez por sesión.
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
   * nada con ellos: devuelve lo mismo para cualquier valor. Por eso se mandan
   * en cero y no hace falta el token.
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
   *
   * Sólo se exigen las dos primeras ramas: el tercer elemento se agregó
   * después y no queremos romper si en algún momento no viene.
   */
  private validar(respuesta: unknown): Observable<ListasPhp> {
    if (!Array.isArray(respuesta) || !Array.isArray(respuesta[0]) || !Array.isArray(respuesta[1])) {
      return throwError(() => new Error('Respuesta inesperada de api-list_tramite.php'));
    }

    return of(respuesta as ListasPhp);
  }

  private normalizar([valores, tipos, ahorros, ayudas]: ListasPhp): ListasGestion {
    return {
      valores: this.normalizarValores(valores ?? []),
      tipos: this.normalizarTipos(tipos ?? []),
      ahorros: this.normalizarAhorros(ahorros),
      ayudasEconomicas: this.normalizarAyudas(ayudas),
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
      periodo: '',
    };

    const subsidios = new Map<string, ValorItem>();

    for (const fila of filas) {
      const item = this.aItem(fila);
      // El código no alcanza por sí solo para identificar un concepto: hay un
      // val/1 y un sub/1 que no tienen nada que ver entre sí.
      const clave = `${(fila.tipo ?? '').trim()}/${item.codigo}`;

      switch (clave) {
        case 'val/1': case 'val/2': case 'val/3':
          valores.cuotaPorTipo[item.codigo] = item;
          break;
        case 'val/4': valores.servicios.farmacia = item; break;
        case 'val/5': valores.servicios.evacuacion = item; break;
        case 'val/6': valores.servicios.sepelio = item; break;
        case 'val/7': valores.servicios.seguroVida = item; break;

        case 'sub/1': case 'sub/2': case 'sub/3': case 'sub/4': case 'sub/5':
          subsidios.set(item.codigo, item);
          break;
        case 'sub/6': valores.reintegroSepelio.titular = item; break;
        case 'sub/7': valores.reintegroSepelio.esposa = item; break;
        case 'sub/12': valores.seguroVida.titular = item; break;
        case 'sub/14': valores.seguroVida.esposa = item; break;

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
    valores.periodo = this.periodoDe(filas);

    return valores;
  }

  /**
   * Período de la planilla: el mes más reciente de todos los conceptos. Es lo
   * que antes era una constante con "Agosto 2026" escrito a mano.
   */
  private periodoDe(filas: ValorPhp[]): string {
    const isos = filas
      .map(fila => this.mesAIso(fila.FechaUpd))
      .filter((iso): iso is string => !!iso);

    if (!isos.length) return '';

    const ultimo = isos.sort().at(-1)!;
    const [anio, mes] = ultimo.split('-');

    return `${MESES[Number(mes) - 1]} ${anio}`;
  }

  private aItem(fila: ValorPhp): ValorItem {
    const actualizado = (fila.FechaUpd ?? '').trim();

    return {
      codigo: (fila.codigo ?? '').toString().trim(),
      descripcion: (fila.descr ?? '').trim() || SIN_DATO,
      // Los importes llegan como texto: "1080000.00".
      importe: Number(fila.valor) || 0,
      actualizado: actualizado || SIN_DATO,
      actualizadoIso: this.mesAIso(actualizado),
    };
  }

  /** "sep 26" -> "2026-09". Null si no matchea, para no inventar fechas. */
  private mesAIso(crudo: string | null | undefined): string | null {
    const match = /^([a-zá-ú]{3})\.?\s*(\d{2}|\d{4})$/i.exec((crudo ?? '').trim());
    if (!match) return null;

    const mes = MESES_ABREVIADOS[match[1].toLowerCase()];
    if (!mes) return null;

    const anio = match[2].length === 2 ? `20${match[2]}` : match[2];

    return `${anio}-${String(mes).padStart(2, '0')}`;
  }

  /**
   * Los nombres salen del PHP tal cual, que es quien maneja la lista. Sólo se
   * les baja la mayúscula sostenida: el PHP los manda gritados
   * ("REINTEGRO DE FARMACIA") y así no se leen en un selector.
   */
  private normalizarTipos(filas: TipoTramitePhp[]): TipoTramite[] {
    return filas
      .filter(fila => (fila?.clave ?? '').trim())
      .map(fila => {
        const clave = fila.clave.trim().toUpperCase();

        return {
          clave,
          descripcion: this.aTextoLegible(fila.descrp),
          ...(BENEFICIO_POR_TRAMITE[clave] && { beneficio: BENEFICIO_POR_TRAMITE[clave] }),
        };
      });
  }

  /** "REINTEGRO DE FARMACIA" -> "Reintegro de farmacia". */
  private aTextoLegible(crudo: string | undefined): string {
    const texto = (crudo ?? '').trim().toLowerCase();
    if (!texto) return 'Trámite';

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  private normalizarAhorros(crudo: AhorrosPhp | undefined): AhorrosSocio {
    const cuentas = (crudo?.Ahorros ?? [])
      .map(cuenta => this.aAhorro(cuenta))
      .sort((a, b) => a.tipo.localeCompare(b.tipo));

    return {
      muestra: this.muestraLaSeccion(crudo?.Muestra),
      cuentas,
    };
  }

  /**
   * Si el flag no vino, se asume que sí se muestra: lo que decide de verdad es
   * si hay cuentas.
   *
   * No alcanza con comparar contra `false`. El PHP manda hoy un booleano, pero
   * cuando el dato sale de MySQL suele llegar como 0 o "0", y ahí un
   * `!== false` daría verdadero y le mostraríamos los saldos a quien no
   * corresponde. Se toma como apagado cualquier cosa que signifique cero.
   */
  private muestraLaSeccion(valor: boolean | number | string | undefined): boolean {
    if (valor === undefined || valor === null) return true;

    if (typeof valor === 'string') {
      const texto = valor.trim().toLowerCase();
      return texto !== '' && texto !== '0' && texto !== 'false';
    }

    return Boolean(valor);
  }

  private aAhorro(cuenta: AhorroPhp): Ahorro {
    const fechaIso = this.fechaAIso(cuenta.Am_fechamov);

    return {
      tipo: (cuenta.Tipo ?? '').trim() || SIN_DATO,
      saldo: Number(cuenta.Am_saldo) || 0,
      fecha: fechaIso ? fechaIso.split('-').reverse().join('/') : SIN_DATO,
      fechaIso,
    };
  }

  /**
   * El PHP manda una fila por cuota, con los datos de la solicitud repetidos
   * en cada una. Se agrupan por número de solicitud y se arma cada ayuda con
   * su plan de pagos.
   */
  private normalizarAyudas(crudo: AyudasEcPhp | undefined): AyudasEconomicasSocio {
    const porSolicitud = new Map<string, CuotaAyudaPhp[]>();

    for (const fila of crudo?.AyudasEc ?? []) {
      const numero = (fila?.NSolicitud ?? "").toString().trim();
      if (!numero) continue;

      porSolicitud.set(numero, [...(porSolicitud.get(numero) ?? []), fila]);
    }

    const solicitudes = [...porSolicitud.entries()]
      .map(([numero, filas]) => this.aAyuda(numero, filas))
      // Primero lo que el socio está pagando, que es lo que viene a mirar;
      // después el historial, de lo más nuevo a lo más viejo.
      .sort((a, b) => {
        if (a.enCurso !== b.enCurso) return a.enCurso ? -1 : 1;
        return (b.fechaIso ?? "").localeCompare(a.fechaIso ?? "");
      });

    return {
      muestra: this.muestraLaSeccion(crudo?.Muestra),
      solicitudes,
    };
  }

  private aAyuda(numeroSolicitud: string, filas: CuotaAyudaPhp[]): AyudaEconomica {
    const primera = filas[0];
    const cuotas = filas.map(fila => this.aCuota(fila)).sort((a, b) => a.numero - b.numero);
    const pendientes = cuotas.filter(cuota => !cuota.pagada);
    const plazos = Number(primera.Plazos) || cuotas.length;
    const proximaCuota = pendientes[0] ?? null;
    const fechaIso = this.fechaAIso(primera.FSolicitud);

    return {
      numeroSolicitud,
      fecha: fechaIso ? fechaIso.split("-").reverse().join("/") : SIN_DATO,
      fechaIso,
      capital: Number(primera.Capital) || 0,
      plazos,
      valorCuota: Number(primera.ValorCuota) || 0,
      totalAReintegrar: Number(primera.reintegro) || 0,
      cuotas,
      cuotasPendientes: pendientes.length,
      // Se restan las pendientes en vez de contar las pagadas: el PHP no
      // siempre manda todas las filas —hay solicitudes saldadas a las que les
      // falta la primera cuota— y contarlas diría "3 de 4" en algo ya pago.
      cuotasPagadas: Math.max(0, plazos - pendientes.length),
      enCurso: pendientes.length > 0,
      // Lo que falta pagar es el saldo anterior a la primera cuota impaga.
      saldo: proximaCuota?.saldo ?? 0,
      proximaCuota,
    };
  }

  private aCuota(fila: CuotaAyudaPhp): CuotaAyuda {
    const estado = (fila.Estado ?? "").trim();
    const mesHaberes = (fila.MesDto ?? "").trim() || SIN_DATO;

    return {
      numero: Number(fila.Cuota) || 0,
      mesHaberes,
      mesCobro: this.mesSiguiente(mesHaberes),
      importe: Number(fila.cobro) || 0,
      saldo: Number(fila.saldo) || 0,
      saldoFinal: Number(fila.saldoFinal) || 0,
      // "Pagado", "Pagada", "PAGO": alcanza con que empiece por "pag".
      pagada: /^pag/i.test(estado),
      estado: estado || SIN_DATO,
    };
  }

  /**
   * "sep 2026" -> "oct 2026".
   *
   * El PHP manda el mes de los haberes sobre los que se descuenta la cuota, y
   * los sueldos se cobran al mes siguiente del trabajado: lo que sale del
   * recibo de septiembre, el socio lo ve en octubre. Si el texto no se puede
   * interpretar se devuelve igual, sin inventar un mes.
   */
  private mesSiguiente(crudo: string): string {
    const match = /^([a-zá-ú]{3})\.?\s*(\d{4})$/i.exec(crudo.trim());
    if (!match) return crudo;

    const mes = MESES_ABREVIADOS[match[1].toLowerCase()];
    if (!mes) return crudo;

    const anio = mes === 12 ? Number(match[2]) + 1 : Number(match[2]);
    const siguiente = mes === 12 ? 1 : mes + 1;

    return `${MESES_ABREVIADOS_EN_ORDEN[siguiente - 1]} ${anio}`;
  }

  /** "2026-09-17" -> el mismo texto si es válido, null si no. */
  private fechaAIso(crudo: string | null | undefined): string | null {
    const texto = (crudo ?? '').trim();

    return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : null;
  }
}
