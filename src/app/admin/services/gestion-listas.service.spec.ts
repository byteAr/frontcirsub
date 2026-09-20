import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { GESTION_API_BASE } from '../../shared/utils/gestion-api-key';
import { CuotaAyudaPhp, GestionListasService, ListasGestion, ListasPhp } from './gestion-listas.service';

const URL_PHP = `${GESTION_API_BASE}/api-list_tramite.php`;
const URL_BACKEND = `${environment.API_URL}/reintegros/listas-gestion`;

/** Una respuesta como la que manda hoy api-list_tramite.php. */
const RESPUESTA: ListasPhp = [
  [
    { tipo: 'sub', codigo: '1', descr: 'Nacimiento', valor: '104073.00', FechaUpd: 'ago 26' },
    { tipo: 'sub', codigo: '2', descr: 'Pañales', valor: '36000.00', FechaUpd: 'ene 26' },
    { tipo: 'sub', codigo: '3', descr: 'Casamiento', valor: '138764.00', FechaUpd: 'may 26' },
    { tipo: 'sub', codigo: '4', descr: 'Reconocimiento', valor: '104073.00', FechaUpd: 'ago 26' },
    { tipo: 'sub', codigo: '5', descr: 'Adopcion', valor: '104073.00', FechaUpd: 'ago 26' },
    { tipo: 'sub', codigo: '6', descr: 'Fallecimiento Tit.', valor: '1080000.00', FechaUpd: 'may 26' },
    { tipo: 'sub', codigo: '7', descr: 'Fallecimiento Esposa', valor: '396000.00', FechaUpd: 'may 26' },
    { tipo: 'sub', codigo: '12', descr: 'Seg. Vida Sol Naciente Tit.', valor: '1800000.00', FechaUpd: 'may 26' },
    { tipo: 'sub', codigo: '14', descr: 'Seg Vida - Sol Naciente Esposa', valor: '270000.00', FechaUpd: 'may 26' },
    { tipo: 'val', codigo: '1', descr: 'Cuota Social Tipo1', valor: '25321.00', FechaUpd: 'sep 26' },
    { tipo: 'val', codigo: '2', descr: 'Cuota Social Tipo2', valor: '29989.00', FechaUpd: 'sep 26' },
    { tipo: 'val', codigo: '3', descr: 'Cuota Social Tipo3', valor: '36262.00', FechaUpd: 'sep 26' },
    { tipo: 'val', codigo: '4', descr: 'Farmacia', valor: '40011.54', FechaUpd: 'ago 26' },
    { tipo: 'val', codigo: '5', descr: 'Evacuacion', valor: '27860.56', FechaUpd: 'ago 26' },
    { tipo: 'val', codigo: '6', descr: 'Servicio de Sepelio', valor: '8000.00', FechaUpd: 'ene 26' },
    { tipo: 'val', codigo: '7', descr: 'Seguro de Vida', valor: '8000.00', FechaUpd: 'ene 26' },
  ],
  [
    { id: '1', clave: 'RM', descrp: 'REINTEGRO DE FARMACIA' },
    { id: '2', clave: 'RN', descrp: 'SUBSIDIO POR NACIMIENTO' },
    { id: '3', clave: 'RE', descrp: 'REINTEGRO DE ESCOLARIDAD' },
    { id: '4', clave: 'TE', descrp: 'TRAMITE DE EVACUACION' },
    { id: '5', clave: 'TP', descrp: 'TRAMITE DE PRESTAMO' },
    { id: '6', clave: 'RC', descrp: 'SUBSIDIO POR CASAMIENTO' },
  ],
  {
    Muestra: true,
    Ahorros: [
      { Tipo: 'Ahorro Común', Am_saldo: '112825.19', Am_fechamov: '2026-09-17' },
      { Tipo: 'Ahorro Estimulo', Am_saldo: '2573.23', Am_fechamov: '2026-09-17' },
    ],
  },
  {
    Muestra: true,
    AyudasEc: [
      // Saldada de un solo pago.
      cuota({ NSolicitud: '95864', FSolicitud: '2025-01-29', Capital: '100000.00', Plazos: '1', reintegro: '112183.33', ValorCuota: '112183.33', Cuota: '1', MesDto: 'feb 2025', saldo: '112183.33', cobro: '112183.33', saldoFinal: '0.00', Estado: 'Pagado' }),
      // Saldada, pero el PHP no manda la cuota 1: son 4 plazos y vienen 3 filas.
      cuota({ NSolicitud: '105564', FSolicitud: '2025-09-05', Capital: '200000.00', Plazos: '4', reintegro: '243792.28', ValorCuota: '60948.07', Cuota: '2', MesDto: 'nov 2025', saldo: '182844.21', cobro: '60948.07', saldoFinal: '121896.14', Estado: 'Pagado' }),
      cuota({ NSolicitud: '105564', FSolicitud: '2025-09-05', Capital: '200000.00', Plazos: '4', reintegro: '243792.28', ValorCuota: '60948.07', Cuota: '3', MesDto: 'dic 2025', saldo: '121896.14', cobro: '60948.07', saldoFinal: '60948.07', Estado: 'Pagado' }),
      cuota({ NSolicitud: '105564', FSolicitud: '2025-09-05', Capital: '200000.00', Plazos: '4', reintegro: '243792.28', ValorCuota: '60948.07', Cuota: '4', MesDto: 'ene 2026', saldo: '60948.07', cobro: '60948.07', saldoFinal: '0.00', Estado: 'Pagado' }),
      // En curso: una pagada y dos por pagar. Llegan desordenadas a propósito.
      cuota({ NSolicitud: '131937', FSolicitud: '2026-05-14', Capital: '100000.00', Plazos: '3', reintegro: '91422.12', ValorCuota: '30474.04', Cuota: '3', MesDto: 'ago 2026', saldo: '30474.04', cobro: '30474.04', saldoFinal: '0.00', Estado: 'Pendiente' }),
      cuota({ NSolicitud: '131937', FSolicitud: '2026-05-14', Capital: '100000.00', Plazos: '3', reintegro: '91422.12', ValorCuota: '30474.04', Cuota: '1', MesDto: 'jun 2026', saldo: '91422.12', cobro: '30474.04', saldoFinal: '60948.08', Estado: 'Pagado' }),
      cuota({ NSolicitud: '131937', FSolicitud: '2026-05-14', Capital: '100000.00', Plazos: '3', reintegro: '91422.12', ValorCuota: '30474.04', Cuota: '2', MesDto: 'jul 2026', saldo: '60948.08', cobro: '30474.04', saldoFinal: '30474.04', Estado: 'Pendiente' }),
    ],
  },
];

/** Una fila de cuota como las que manda el PHP. */
function cuota(campos: CuotaAyudaPhp): CuotaAyudaPhp {
  return campos;
}

describe('GestionListasService', () => {
  let service: GestionListasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GestionListasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Resuelve el pedido directo al PHP y devuelve ya normalizado. */
  function listasDelPhp(payload: unknown = RESPUESTA): ListasGestion {
    let listas!: ListasGestion;
    service.getListas().subscribe(resultado => (listas = resultado));
    httpMock.expectOne(URL_PHP).flush(payload as Object);
    return listas;
  }

  /**
   * Igual que listasDelPhp pero descartando la caché, para poder pedir varias
   * veces dentro del mismo test.
   */
  function listasRecargadas(payload: unknown): ListasGestion {
    let listas!: ListasGestion;
    service.recargar().subscribe(resultado => (listas = resultado));
    httpMock.expectOne(URL_PHP).flush(payload as Object);
    return listas;
  }

  it('manda userId y dni en cero: el PHP los exige pero no filtra con ellos', () => {
    service.getListas().subscribe();

    const req = httpMock.expectOne(URL_PHP);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId: 0, dni: '0' });
    expect(req.request.headers.get('X-API-KEY')).toMatch(/^api-key-tk-\d{6}$/);
    req.flush(RESPUESTA);
  });

  describe('valores', () => {

    it('reparte los importes en las secciones de la planilla', () => {
      const { valores } = listasDelPhp();

      expect(valores.cuotaPorTipo['1']?.importe).toBe(25321);
      expect(valores.cuotaPorTipo['2']?.importe).toBe(29989);
      expect(valores.cuotaPorTipo['3']?.importe).toBe(36262);

      expect(valores.servicios.farmacia?.importe).toBe(40011.54);
      expect(valores.servicios.evacuacion?.importe).toBe(27860.56);
      expect(valores.servicios.sepelio?.importe).toBe(8000);
      expect(valores.servicios.seguroVida?.importe).toBe(8000);

      expect(valores.reintegroSepelio.titular?.importe).toBe(1080000);
      expect(valores.reintegroSepelio.esposa?.importe).toBe(396000);
      expect(valores.seguroVida.titular?.importe).toBe(1800000);
      expect(valores.seguroVida.esposa?.importe).toBe(270000);

      expect(valores.otros).toEqual([]);
    });

    it('guarda el mes de actualización de cada concepto', () => {
      const { valores } = listasDelPhp();

      expect(valores.cuotaPorTipo['1']?.actualizado).toBe('sep 26');
      expect(valores.servicios.sepelio?.actualizado).toBe('ene 26');
      expect(valores.servicios.farmacia?.actualizado).toBe('ago 26');
    });

    it('saca el período del mes más reciente, sin constantes escritas a mano', () => {
      const { valores } = listasDelPhp();

      expect(valores.periodo).toBe('Septiembre 2026');
    });

    it('deja el período vacío si ningún concepto trae FechaUpd', () => {
      const { valores } = listasDelPhp([
        [{ tipo: 'val', codigo: '1', descr: 'Cuota Social Tipo1', valor: '25321.00' }],
        [],
      ]);

      expect(valores.periodo).toBe('');
      expect(valores.cuotaPorTipo['1']?.actualizado).toBe('-');
    });

    it('ordena los subsidios como la planilla impresa, no como los manda el PHP', () => {
      const { valores } = listasDelPhp();

      expect(valores.subsidios.map(s => s.descripcion)).toEqual([
        'Nacimiento',
        'Adopcion',
        'Reconocimiento',
        'Casamiento',
        'Pañales',
      ]);
    });

    it('no confunde val/1 con sub/1: el código solo no identifica un concepto', () => {
      const { valores } = listasDelPhp();

      expect(valores.cuotaPorTipo['1']?.importe).toBe(25321);
      expect(valores.subsidios[0].importe).toBe(104073);
    });

    it('muestra los conceptos que no entran en ninguna sección en vez de perderlos', () => {
      const { valores } = listasDelPhp([
        [{ tipo: 'sub', codigo: '99', descr: 'Concepto nuevo', valor: '1500.00', FechaUpd: 'sep 26' }],
        [],
      ]);

      expect(valores.otros).toEqual([{
        codigo: '99',
        descripcion: 'Concepto nuevo',
        importe: 1500,
        actualizado: 'sep 26',
        actualizadoIso: '2026-09',
      }]);
    });
  });

  describe('tipos de trámite', () => {

    it('usa los nombres del PHP y sólo les baja la mayúscula sostenida', () => {
      const { tipos } = listasDelPhp();

      expect(tipos).toEqual([
        { clave: 'RM', descripcion: 'Reintegro de farmacia', beneficio: 'far' },
        { clave: 'RN', descripcion: 'Subsidio por nacimiento' },
        { clave: 'RE', descripcion: 'Reintegro de escolaridad' },
        { clave: 'TE', descripcion: 'Tramite de evacuacion', beneficio: 'eva' },
        { clave: 'TP', descripcion: 'Tramite de prestamo' },
        { clave: 'RC', descripcion: 'Subsidio por casamiento' },
      ]);
    });

    it('acepta una clave nueva sin tocar el código', () => {
      const { tipos } = listasDelPhp([[], [{ id: '9', clave: 'XX', descrp: 'TRAMITE NUEVO' }]]);

      expect(tipos).toEqual([{ clave: 'XX', descripcion: 'Tramite nuevo' }]);
    });
  });

  describe('ahorros', () => {

    it('convierte el saldo a número y la fecha a dd/mm/aaaa', () => {
      const { ahorros } = listasDelPhp();

      expect(ahorros.muestra).toBe(true);
      expect(ahorros.cuentas).toEqual([
        { tipo: 'Ahorro Común', saldo: 112825.19, fecha: '17/09/2026', fechaIso: '2026-09-17' },
        { tipo: 'Ahorro Estimulo', saldo: 2573.23, fecha: '17/09/2026', fechaIso: '2026-09-17' },
      ]);
    });

    it('respeta el flag Muestra del sistema de gestión', () => {
      const { ahorros } = listasDelPhp([
        [], [],
        { Muestra: false, Ahorros: [{ Tipo: 'Ahorro Común', Am_saldo: '1.00', Am_fechamov: '2026-09-17' }] },
      ]);

      expect(ahorros.muestra).toBe(false);
    });

    /**
     * El PHP manda hoy un booleano, pero el mismo dato salido de MySQL llega
     * como 0 o "0". Si eso se colara como "sí mostrar", le estaríamos
     * mostrando saldos a quien el sistema de gestión dijo que no.
     */
    it('también apaga la sección con los ceros que manda MySQL', () => {
      for (const apagado of [0, '0', 'false', '']) {
        const { ahorros } = listasRecargadas([[], [], { Muestra: apagado }]);
        expect(ahorros.muestra)
          .withContext(`Muestra: ${JSON.stringify(apagado)}`)
          .toBe(false);
      }
    });

    it('muestra la sección con los valores que significan sí', () => {
      for (const encendido of [true, 1, '1']) {
        const { ahorros } = listasRecargadas([[], [], { Muestra: encendido }]);
        expect(ahorros.muestra)
          .withContext(`Muestra: ${JSON.stringify(encendido)}`)
          .toBe(true);
      }
    });

    it('no rompe si el tercer elemento no viene: se agregó después', () => {
      const { ahorros } = listasDelPhp([[], []]);

      expect(ahorros).toEqual({ muestra: true, cuentas: [] });
    });
  });

  describe('ayudas económicas', () => {

    it('arma una solicitud por número, aunque el PHP mande una fila por cuota', () => {
      const { ayudasEconomicas } = listasDelPhp();

      expect(ayudasEconomicas.muestra).toBeTrue();
      expect(ayudasEconomicas.solicitudes.map(s => s.numeroSolicitud))
        .toEqual(['131937', '105564', '95864']);
    });

    it('pone primero la que está pagando y después el historial, de lo más nuevo a lo más viejo', () => {
      const { solicitudes } = listasDelPhp().ayudasEconomicas;

      expect(solicitudes.map(s => s.enCurso)).toEqual([true, false, false]);
      expect(solicitudes.map(s => s.fecha)).toEqual(['14/05/2026', '05/09/2025', '29/01/2025']);
    });

    it('ordena las cuotas aunque lleguen desordenadas', () => {
      const enCurso = listasDelPhp().ayudasEconomicas.solicitudes[0];

      expect(enCurso.cuotas.map(c => c.numero)).toEqual([1, 2, 3]);
      expect(enCurso.cuotas.map(c => c.pagada)).toEqual([true, false, false]);
    });

    it('el saldo y la próxima cuota salen de la primera cuota impaga', () => {
      const enCurso = listasDelPhp().ayudasEconomicas.solicitudes[0];

      expect(enCurso.saldo).toBe(60948.08);
      expect(enCurso.proximaCuota?.numero).toBe(2);
      expect(enCurso.proximaCuota?.importe).toBe(30474.04);
      // El PHP manda el mes de los haberes; el socio lo ve descontado al mes
      // siguiente, que es el que se muestra.
      expect(enCurso.proximaCuota?.mesHaberes).toBe('jul 2026');
      expect(enCurso.proximaCuota?.mesCobro).toBe('ago 2026');
    });

    it('cuenta las cuotas pagadas restando las pendientes, no contando filas', () => {
      const { solicitudes } = listasDelPhp().ayudasEconomicas;
      const porNumero = Object.fromEntries(solicitudes.map(s => [s.numeroSolicitud, s]));

      // Esta viene con 3 filas de 4 plazos: contando filas diría "3 de 4"
      // cuando en realidad está saldada.
      expect(porNumero['105564'].cuotas.length).toBe(3);
      expect(porNumero['105564'].cuotasPagadas).toBe(4);
      expect(porNumero['105564'].cuotasPendientes).toBe(0);
      expect(porNumero['105564'].enCurso).toBeFalse();
      expect(porNumero['105564'].saldo).toBe(0);

      expect(porNumero['131937'].cuotasPagadas).toBe(1);
      expect(porNumero['131937'].cuotasPendientes).toBe(2);
    });

    it('guarda los datos del préstamo y los pasa a número', () => {
      const { solicitudes } = listasDelPhp().ayudasEconomicas;
      const saldada = solicitudes.find(s => s.numeroSolicitud === '95864')!;

      expect(saldada.capital).toBe(100_000);
      expect(saldada.plazos).toBe(1);
      expect(saldada.valorCuota).toBe(112_183.33);
      expect(saldada.totalAReintegrar).toBe(112_183.33);
    });

    it('respeta el flag Muestra', () => {
      const { ayudasEconomicas } = listasRecargadas([[], [], {}, { Muestra: 0, AyudasEc: [] }]);

      expect(ayudasEconomicas.muestra).toBeFalse();
    });

    it('no rompe si el cuarto elemento no viene: se agregó después', () => {
      const { ayudasEconomicas } = listasDelPhp([[], []]);

      expect(ayudasEconomicas).toEqual({ muestra: true, solicitudes: [] });
    });

    it('pasa diciembre a enero del año siguiente', () => {
      const { ayudasEconomicas } = listasDelPhp([[], [], {}, { AyudasEc: [
        cuota({ NSolicitud: '1', FSolicitud: '2026-11-01', Capital: '1000', Plazos: '1', reintegro: '1000', ValorCuota: '1000', Cuota: '1', MesDto: 'dic 2026', saldo: '1000', cobro: '1000', saldoFinal: '0', Estado: 'Pendiente' }),
      ] }]);

      expect(ayudasEconomicas.solicitudes[0].cuotas[0].mesCobro).toBe('ene 2027');
    });

    it('deja el mes como vino si no se puede interpretar, sin inventar uno', () => {
      const { ayudasEconomicas } = listasDelPhp([[], [], {}, { AyudasEc: [
        cuota({ NSolicitud: '1', FSolicitud: '2026-11-01', Capital: '1000', Plazos: '1', reintegro: '1000', ValorCuota: '1000', Cuota: '1', MesDto: 'a confirmar', saldo: '1000', cobro: '1000', saldoFinal: '0', Estado: 'Pendiente' }),
      ] }]);

      expect(ayudasEconomicas.solicitudes[0].cuotas[0].mesCobro).toBe('a confirmar');
    });

    it('toma como pagada cualquier variante de "pagado" y conserva el literal desconocido', () => {
      const { ayudasEconomicas } = listasDelPhp([[], [], {}, { AyudasEc: [
        cuota({ NSolicitud: '1', FSolicitud: '2026-01-01', Capital: '1000', Plazos: '2', reintegro: '1000', ValorCuota: '500', Cuota: '1', MesDto: 'feb 2026', saldo: '1000', cobro: '500', saldoFinal: '500', Estado: 'PAGA' }),
        cuota({ NSolicitud: '1', FSolicitud: '2026-01-01', Capital: '1000', Plazos: '2', reintegro: '1000', ValorCuota: '500', Cuota: '2', MesDto: 'mar 2026', saldo: '500', cobro: '500', saldoFinal: '0', Estado: 'En revisión' }),
      ] }]);

      const cuotas = ayudasEconomicas.solicitudes[0].cuotas;
      expect(cuotas[0].pagada).toBeTrue();
      expect(cuotas[1].pagada).toBeFalse();
      expect(cuotas[1].estado).toBe('En revisión');
    });
  });

  describe('de dónde salen los datos', () => {

    it('cae al backend cuando el navegador bloquea la llamada directa por CORS', () => {
      let listas!: ListasGestion;
      service.getListas().subscribe(resultado => (listas = resultado));

      // Un preflight bloqueado llega como error de red, sin status.
      httpMock.expectOne(URL_PHP).error(new ProgressEvent('error'));
      httpMock.expectOne(URL_BACKEND).flush(RESPUESTA);

      expect(listas.tipos.length).toBe(6);
    });

    it('cae al backend si el PHP contesta 200 con algo que no es la tupla', () => {
      let listas!: ListasGestion;
      service.getListas().subscribe(resultado => (listas = resultado));

      // El PHP devuelve 200 con {ok:0} cuando algo falla de su lado.
      httpMock.expectOne(URL_PHP).flush({ ok: 0, message: 'Faltan parámetros' });
      httpMock.expectOne(URL_BACKEND).flush(RESPUESTA);

      expect(listas.valores.cuotaPorTipo['2']?.importe).toBe(29989);
    });

    it('pide los datos una sola vez: son iguales para todos los socios', () => {
      service.getListas().subscribe();
      httpMock.expectOne(URL_PHP).flush(RESPUESTA);

      service.getListas().subscribe();

      httpMock.expectNone(URL_PHP);
    });

    it('recargar() descarta lo cacheado y vuelve a pedir', () => {
      service.getListas().subscribe();
      httpMock.expectOne(URL_PHP).flush(RESPUESTA);

      let listas!: ListasGestion;
      service.recargar().subscribe(resultado => (listas = resultado));

      httpMock.expectOne(URL_PHP).flush(RESPUESTA);
      expect(listas.tipos.length).toBe(6);
    });
  });
});
