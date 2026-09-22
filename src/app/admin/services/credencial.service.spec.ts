import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CredencialService } from './credencial.service';
import { environment } from '../../../environments/environment';
import { ENCUESTA_MODO_DEMO } from '../../shared/modo-demo';

describe('CredencialService', () => {
  let service: CredencialService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideServiceWorker('ngsw-worker.js', { enabled: false }), provideRouter([]),
        // Modo normal: estas pruebas miran el pedido real al backend.
        { provide: ENCUESTA_MODO_DEMO, useValue: false }],
    });
    service = TestBed.inject(CredencialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('caches getCbu(id) so a second call does not hit the backend again', () => {
    service.getCbu('7').subscribe();
    service.getCbu('7').subscribe();

    const reqs = httpMock.match(`${environment.API_URL}/credencial?id=7`);
    expect(reqs.length).toBe(1);
    reqs[0].flush({ cbu: '1234567890123456789012' });
  });

  it('does not cache a failed getCbu request', () => {
    service.getCbu('9').subscribe({ error: () => {} });
    httpMock.expectOne(`${environment.API_URL}/credencial?id=9`)
      .flush('error', { status: 500, statusText: 'Server Error' });

    service.getCbu('9').subscribe({ error: () => {} });
    httpMock.expectOne(`${environment.API_URL}/credencial?id=9`)
      .flush('error', { status: 500, statusText: 'Server Error' });
  });

  it('invalidates the cached getCbu(id) after updateCbu succeeds', () => {
    service.getCbu('7').subscribe();
    httpMock.expectOne(`${environment.API_URL}/credencial?id=7`)
      .flush({ cbu: '1111111111111111111111' });

    service.updateCbu(7, '2222222222222222222222').subscribe();
    httpMock.expectOne(`${environment.API_URL}/credencial`).flush({ ok: true });

    service.getCbu('7').subscribe();
    httpMock.expectOne(`${environment.API_URL}/credencial?id=7`)
      .flush({ cbu: '2222222222222222222222' });
  });

  it('updateEncuesta manda las dos calificaciones con el token y sin id', () => {
    localStorage.setItem('token', 'tok-123');

    service.updateEncuesta(5, 3).subscribe();

    const req = httpMock.expectOne(`${environment.API_URL}/credencial/encuesta`);
    expect(req.request.method).toBe('POST');
    // Sin id: el backend lo toma del token y rechaza campos de más con 400.
    expect(req.request.body).toEqual({ servicio: 5, atencion: 3 });
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-123');
    req.flush({ ok: true });

    localStorage.removeItem('token');
  });
});

describe('CredencialService en modo demo', () => {
  let service: CredencialService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ENCUESTA_MODO_DEMO, useValue: true }],
    });
    service = TestBed.inject(CredencialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('simula el envío de la encuesta: no llama al backend y confirma después de una espera', fakeAsync(() => {
    let respuesta: unknown;
    service.updateEncuesta(5, 5).subscribe(r => (respuesta = r));

    // Sin espera no confirma: así se llega a ver el "Enviando...".
    expect(respuesta).toBeUndefined();
    tick(700);

    expect(respuesta).toEqual({ ok: true, demo: true });
    httpMock.expectNone(`${environment.API_URL}/credencial/encuesta`);
  }));
});
