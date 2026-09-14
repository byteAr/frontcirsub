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
    { tipo: 'sub', codigo: '1', descr: 'Nacimiento', valor: '104073.00' },
    { tipo: 'sub', codigo: '2', descr: 'Pañales', valor: '36000.00' },
    { tipo: 'sub', codigo: '3', descr: 'Casamiento', valor: '138764.00' },
    { tipo: 'sub', codigo: '4', descr: 'Reconocimiento', valor: '138764.00' },
    { tipo: 'sub', codigo: '5', descr: 'Adopcion', valor: '138764.00' },
    { tipo: 'sub', codigo: '6', descr: 'Fallecimiento Tit.', valor: '1080000.00' },
    { tipo: 'sub', codigo: '7', descr: 'Fallecimiento Esposa', valor: '396000.00' },
    { tipo: 'sub', codigo: '12', descr: 'Seg. Vida Sol Naciente', valor: '1800000.00' },
    { tipo: 'sub', codigo: '14', descr: 'Reintegro - Sol Naciente Esposa', valor: '270000.00' },
    { tipo: 'val', codigo: '1', descr: 'Cuota Social Tipo1', valor: '24252.00' },
    { tipo: 'val', codigo: '2', descr: 'Cuota Social Tipo2', valor: '28706.00' },
    { tipo: 'val', codigo: '3', descr: 'Cuota Social Tipo3', valor: '34691.00' },
    { tipo: 'val', codigo: '4', descr: 'Farmacia', valor: '40011.54' },
    { tipo: 'val', codigo: '5', descr: 'Evacuacion', valor: '27860.56' },
    { tipo: 'val', codigo: '6', descr: 'Servicio de Sepelio', valor: '8000.00' },
    { tipo: 'val', codigo: '7', descr: 'Seguro de Vida', valor: '8000.00' },
  ],
  [
    { id: '1', clave: 'RM', descrp: 'REINTEGRO DE MEDICAMTO' },
    { id: '2', clave: 'RN', descrp: 'REINTEGRO DE NACIMIENTO' },
    { id: '4', clave: 'TE', descrp: 'TRAMITE DE EVACUACION' },
    { id: '5', clave: 'TP', descrp: 'TRAMITE DE PRESTAMO' },
    { id: '6', clave: 'RC', descrp: 'REINTEGRO POR CASAMIENTO' },
  ],
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
  function listasDelPhp(): ListasGestion {
    let listas!: ListasGestion;
    service.getListas().subscribe(resultado => (listas = resultado));
    httpMock.expectOne(URL_PHP).flush(RESPUESTA);
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

  it('reparte los valores en las secciones de la planilla', () => {
    const { valores } = listasDelPhp();

    expect(valores.cuotaPorTipo).toEqual({ '1': 24252, '2': 28706, '3': 34691 });
    expect(valores.servicios).toEqual({
      sepelio: 8000,
      farmacia: 40011.54,
      evacuacion: 27860.56,
      seguroVida: 8000,
    });
    expect(valores.reintegroSepelio).toEqual({ titular: 1080000, esposa: 396000 });
    expect(valores.seguroVida).toEqual({ titular: 1800000, esposa: 270000 });
    expect(valores.otros).toEqual([]);
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

    // Ambos llegan con código "1" y no tienen nada que ver entre sí.
    expect(valores.cuotaPorTipo['1']).toBe(24252);
    expect(valores.subsidios[0].importe).toBe(104073);
  });

  it('muestra los conceptos que no entran en ninguna sección en vez de perderlos', () => {
    let listas!: ListasGestion;
    service.getListas().subscribe(resultado => (listas = resultado));

    httpMock.expectOne(URL_PHP).flush([
      [{ tipo: 'sub', codigo: '99', descr: 'Concepto nuevo', valor: '1500.00' }],
      [],
    ]);

    expect(listas.valores.otros).toEqual([
      { codigo: '99', descripcion: 'Concepto nuevo', importe: 1500 },
    ]);
  });

  it('traduce los nombres del PHP y marca qué beneficio exige cada trámite', () => {
    const { tipos } = listasDelPhp();

    expect(tipos).toEqual([
      { clave: 'RM', descripcion: 'Reintegro de medicamentos', beneficio: 'far' },
      { clave: 'RN', descripcion: 'Reintegro por nacimiento' },
      { clave: 'TE', descripcion: 'Trámite de evacuación', beneficio: 'eva' },
      { clave: 'TP', descripcion: 'Trámite de préstamo' },
      { clave: 'RC', descripcion: 'Reintegro por casamiento' },
    ]);
  });

  it('muestra una clave nueva con el texto del PHP en vez de esconderla', () => {
    let listas!: ListasGestion;
    service.getListas().subscribe(resultado => (listas = resultado));

    httpMock.expectOne(URL_PHP).flush([[], [{ id: '9', clave: 'XX', descrp: 'TRAMITE NUEVO' }]]);

    // Sin acento: es el texto del PHP tal cual, sólo se le baja la mayúscula.
    expect(listas.tipos).toEqual([{ clave: 'XX', descripcion: 'Tramite nuevo' }]);
  });

  it('cae al backend cuando el navegador bloquea la llamada directa por CORS', () => {
    let listas!: ListasGestion;
    service.getListas().subscribe(resultado => (listas = resultado));

    // Un preflight bloqueado llega como error de red, sin status.
    httpMock.expectOne(URL_PHP).error(new ProgressEvent('error'));
    httpMock.expectOne(URL_BACKEND).flush(RESPUESTA);

    expect(listas.tipos.length).toBe(5);
  });

  it('cae al backend si el PHP contesta 200 con algo que no es la tupla', () => {
    let listas!: ListasGestion;
    service.getListas().subscribe(resultado => (listas = resultado));

    // El PHP devuelve 200 con {ok:0} cuando algo falla de su lado.
    httpMock.expectOne(URL_PHP).flush({ ok: 0, message: 'Faltan parámetros' });
    httpMock.expectOne(URL_BACKEND).flush(RESPUESTA);

    expect(listas.valores.cuotaPorTipo['2']).toBe(28706);
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
    expect(listas.tipos.length).toBe(5);
  });
});
