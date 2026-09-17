import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { GESTION_API_BASE } from '../../shared/utils/gestion-api-key';
import { GestionListasService, ListasGestion, ListasPhp } from './gestion-listas.service';

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
];

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

    it('no rompe si el tercer elemento no viene: se agregó después', () => {
      const { ahorros } = listasDelPhp([[], []]);

      expect(ahorros).toEqual({ muestra: true, cuentas: [] });
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
