import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { SwPush } from '@angular/service-worker';

import PersonalDateCredentialComponent from './personal-date-credential.component';
import { AuthService } from '../../../auth/services/auth.service';

/**
 * La descarga de la foto se mudó a AuthService: la credencial necesita saber
 * si ya está lista antes de montar este componente, así que no puede pedirla
 * él. Acá se prueba esa división: el servicio descarga una sola vez y el
 * componente sólo dibuja lo que el servicio ya resolvió.
 */
describe('PersonalDateCredentialComponent', () => {
  let fixture: ComponentFixture<PersonalDateCredentialComponent>;
  let component: PersonalDateCredentialComponent;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  const userData = {
    Persona: [{
      Id: 42,
      Documento: '111',
      Apellido: 'Perez',
      Nombre: 'Ana',
    }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalDateCredentialComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SwPush, useValue: { isEnabled: false } },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    spyOn(authService, 'checkStatus').and.returnValue(of(true));
    (authService as any).user = () => userData;

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    fixture = TestBed.createComponent(PersonalDateCredentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Montarlo no dispara ninguna descarga: de eso se encarga la credencial.
    httpMock.expectNone(authService.getProfileImageUrl(42));
    expect(component).toBeTruthy();
  });

  it('muestra la foto que dejó resuelta el servicio', () => {
    authService.cargarImagenPerfil(42);
    httpMock.expectOne(authService.getProfileImageUrl(42)).flush(new Blob(['fake-image']));

    fixture = TestBed.createComponent(PersonalDateCredentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.hasImage()).toBeTrue();
    expect(authService.imagenPerfilResuelta()).toBeTrue();
  });

  it('descarga la foto una sola vez aunque se pida de nuevo', () => {
    authService.cargarImagenPerfil(42);
    httpMock.expectOne(authService.getProfileImageUrl(42)).flush(new Blob(['fake-image']));

    authService.cargarImagenPerfil(42);
    httpMock.expectNone(authService.getProfileImageUrl(42));
  });

  it('da la foto por resuelta aunque la descarga falle, para no dejar la credencial esperando', () => {
    authService.cargarImagenPerfil(42);
    httpMock.expectOne(authService.getProfileImageUrl(42))
      .error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });

    expect(authService.imagenPerfilResuelta()).toBeTrue();
    expect(authService.imagenPerfilUrl()).toBeNull();
  });
});
