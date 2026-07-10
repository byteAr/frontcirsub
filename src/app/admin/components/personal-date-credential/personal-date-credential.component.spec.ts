import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { SwPush } from '@angular/service-worker';

import PersonalDateCredentialComponent from './personal-date-credential.component';
import { AuthService } from '../../../auth/services/auth.service';

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
        { provide: SwPush, useValue: { isEnabled: false } },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    spyOn(authService, 'checkStatus').and.returnValue(of(true));
    (authService as any).user = () => userData;

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PersonalDateCredentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    // The constructor effect fires the profile-image request during the
    // beforeEach detectChanges(); flush it so afterEach's httpMock.verify()
    // doesn't see it as an outstanding request.
    const req = httpMock.expectOne(authService.getProfileImageUrl(42));
    req.flush(new Blob(['fake-image']));

    expect(component).toBeTruthy();
  });

  it('fetches the profile image once and reuses it for a second mounted instance', () => {
    const req = httpMock.expectOne(authService.getProfileImageUrl(42));
    req.flush(new Blob(['fake-image']));
    fixture.detectChanges();

    expect(component.hasImage()).toBeTrue();

    const fixture2 = TestBed.createComponent(PersonalDateCredentialComponent);
    fixture2.detectChanges();

    httpMock.expectNone(authService.getProfileImageUrl(42));
    expect(fixture2.componentInstance.hasImage()).toBeTrue();
  });
});
