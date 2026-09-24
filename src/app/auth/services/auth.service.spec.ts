import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SwPush } from '@angular/service-worker';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { ENCUESTA_MODO_DEMO } from '../../shared/modo-demo';

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

  it('marcarEncuestaRespondida() marca el perfil en el momento, sin esperar al próximo check-status', () => {
    service.login('111', 'pass').subscribe();
    const sinResponder = { ...mockUser, userData: { Persona: [{ ...mockUser.userData.Persona[0], Encuesta: false }] } };
    httpMock.expectOne(`${environment.API_URL}/auth/login`).flush(sinResponder);
    expect(service.user()?.Persona[0].Encuesta).toBeFalse();

    service.marcarEncuestaRespondida();

    expect(service.user()?.Persona[0].Encuesta).toBeTrue();
    // El resto del perfil queda igual.
    expect(service.user()?.Persona[0].Documento).toBe('111');
  });

  it('marcarEncuestaRespondida() no rompe si todavía no hay perfil', () => {
    expect(() => service.marcarEncuestaRespondida()).not.toThrow();
    expect(service.user()).toBeNull();
  });
});

describe('AuthService: cuándo se ofrece la encuesta', () => {
  const perfil = (encuesta: boolean) => ({
    ok: true,
    token: 'abc123',
    userData: { Persona: [{ Id: 1, Documento: '111', Nombre: 'Ana', Apellido: 'Perez', Encuesta: encuesta }] },
  });

  function crear(modoDemo: boolean, encuestaEnElPerfil: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SwPush, useValue: { isEnabled: false } },
        { provide: ENCUESTA_MODO_DEMO, useValue: modoDemo },
      ],
    });
    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);
    service.login('111', 'pass').subscribe();
    httpMock.expectOne(`${environment.API_URL}/auth/login`).flush(perfil(encuestaEnElPerfil));
    return service;
  }

  afterEach(() => localStorage.clear());

  describe('modo normal', () => {
    it('la ofrece si el perfil dice que no respondió', () => {
      const service = crear(false, false);
      expect(service.encuestaPendiente()).toBeTrue();
      expect(service.encuestaYaRespondida()).toBeFalse();
    });

    it('no la ofrece si ya respondió en otra sesión', () => {
      const service = crear(false, true);
      expect(service.encuestaPendiente()).toBeFalse();
      expect(service.encuestaYaRespondida()).toBeTrue();
    });

    it('deja de ofrecerla apenas califica', () => {
      const service = crear(false, false);
      service.marcarEncuestaRespondida();
      expect(service.encuestaPendiente()).toBeFalse();
    });
  });

  describe('modo demo', () => {
    it('la ofrece en cada ingreso aunque ya haya respondido antes', () => {
      const service = crear(true, true);
      expect(service.encuestaPendiente()).toBeTrue();
      expect(service.encuestaYaRespondida()).toBeFalse();
    });

    it('al calificar desaparece hasta el próximo ingreso', () => {
      const service = crear(true, true);
      service.marcarEncuestaRespondida();
      expect(service.encuestaPendiente()).toBeFalse();
      expect(service.encuestaYaRespondida()).toBeTrue();

      service.logout();
      expect(service.encuestaPendiente()).toBeTrue();
    });
  });
});
