import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CredencialService } from './credencial.service';
import { environment } from '../../../environments/environment';

describe('CredencialService', () => {
  let service: CredencialService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideServiceWorker('ngsw-worker.js', { enabled: false }), provideRouter([])],
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
});
