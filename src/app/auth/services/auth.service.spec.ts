import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SwPush } from '@angular/service-worker';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService caching', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser = {
    ok: true,
    token: 'abc123',
    userData: {
      Persona: [{
        Id: 1,
        Documento: '111',
        Apellido: 'Perez',
        Nombre: 'Ana',
        Fecha_Nacimiento: '1990-01-01',
        Sexo: 'F',
        Validado: true,
        Socios_Personas_Id_Titular: 1,
        Discapacitado: false,
        Encuesta: true,
        Usuario_Registrado: true,
        Usuario_Bloqueado: false,
      }],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SwPush, useValue: { isEnabled: false } },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('token', 'sometoken');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('shares a single HTTP call across multiple checkStatus() subscribers', () => {
    service.checkStatus().subscribe();
    service.checkStatus().subscribe();

    const reqs = httpMock.match(`${environment.API_URL}/auth/check-status`);
    expect(reqs.length).toBe(1);
    reqs[0].flush(mockUser);
  });

  it('issues a fresh HTTP call after logout() resets the cache', () => {
    service.checkStatus().subscribe();
    httpMock.expectOne(`${environment.API_URL}/auth/check-status`).flush(mockUser);

    service.logout();
    localStorage.setItem('token', 'sometoken');

    service.checkStatus().subscribe();
    httpMock.expectOne(`${environment.API_URL}/auth/check-status`).flush(mockUser);
  });

  it('does not replace the user signal reference when auth data is unchanged', () => {
    service.login('111', 'pass').subscribe();
    httpMock.expectOne(`${environment.API_URL}/auth/login`).flush(mockUser);
    const firstRef = service.user();

    service.login('111', 'pass').subscribe();
    httpMock.expectOne(`${environment.API_URL}/auth/login`).flush(mockUser);
    const secondRef = service.user();

    expect(secondRef).toBe(firstRef);
  });
});
