import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { UserData } from '../../../auth/interfaces/user.interface';
import { AuthService } from '../../../auth/services/auth.service';
import { CredencialService } from '../../services/credencial.service';
import EncuestaComponent from './encuesta.component';

describe('EncuestaComponent', () => {
  let fixture: ComponentFixture<EncuestaComponent>;
  let component: EncuestaComponent;
  let credencial: jasmine.SpyObj<CredencialService>;
  let marcarEncuestaRespondida: jasmine.Spy;
  const usuario = signal<UserData | null>(null);

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const botonCalificar = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find(b => /Calificar|Enviando/.test(b.textContent ?? '')) as HTMLButtonElement;

  function crear(encuestaRespondida: boolean): void {
    usuario.set({ Persona: [{ Id: 4, Encuesta: encuestaRespondida }] } as UserData);
    fixture = TestBed.createComponent(EncuestaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function calificarCon(servicio: number, atencion: number): void {
    component.setRating(servicio);
    component.setRating2(atencion);
    fixture.detectChanges();
    botonCalificar().click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    credencial = jasmine.createSpyObj<CredencialService>('CredencialService', ['updateEncuesta']);
    marcarEncuestaRespondida = jasmine.createSpy('marcarEncuestaRespondida');

    await TestBed.configureTestingModule({
      imports: [EncuestaComponent],
      providers: [
        { provide: CredencialService, useValue: credencial },
        { provide: AuthService, useValue: { user: usuario.asReadonly(), marcarEncuestaRespondida } },
      ],
    }).compileComponents();
  });

  it('muestra las dos preguntas a quien todavía no calificó', () => {
    crear(false);

    expect(texto()).toContain('¿Cómo calificaría la Credencial Digital?');
    expect(texto()).toContain('¿Cómo calificaría la atención del operador?');
  });

  it('no deja enviar hasta tener las dos calificaciones', () => {
    crear(false);

    component.setRating(4);
    fixture.detectChanges();

    expect(botonCalificar().disabled).toBeTrue();
    botonCalificar().click();
    expect(credencial.updateEncuesta).not.toHaveBeenCalled();
  });

  it('envía las dos calificaciones, sin id: el backend lo toma del token', () => {
    crear(false);
    credencial.updateEncuesta.and.returnValue(of({ ok: true }));

    calificarCon(5, 3);

    expect(credencial.updateEncuesta).toHaveBeenCalledOnceWith(5, 3);
  });

  it('agradece recién cuando el backend confirma', () => {
    crear(false);
    const respuesta = new Subject<unknown>();
    credencial.updateEncuesta.and.returnValue(respuesta);

    calificarCon(5, 5);

    // Todavía viajando: no hay agradecimiento y el botón no se puede repetir.
    expect(texto()).not.toContain('¡Gracias por calificarnos!');
    expect(botonCalificar().disabled).toBeTrue();
    expect(botonCalificar().textContent).toContain('Enviando...');

    respuesta.next({ ok: true });
    respuesta.complete();
    fixture.detectChanges();

    expect(texto()).toContain('¡Gracias por calificarnos!');
  });

  it('al calificar marca la encuesta como respondida, así se va del sidebar', () => {
    crear(false);
    credencial.updateEncuesta.and.returnValue(of({ ok: true }));

    calificarCon(4, 4);

    expect(marcarEncuestaRespondida).toHaveBeenCalledTimes(1);
  });

  it('si falla lo avisa y deja reintentar, sin dar la encuesta por respondida', () => {
    crear(false);
    credencial.updateEncuesta.and.returnValue(throwError(() => new Error('sin conexión')));

    calificarCon(3, 2);

    expect(texto()).toContain('No pudimos registrar su calificación.');
    expect(texto()).not.toContain('¡Gracias por calificarnos!');
    expect(marcarEncuestaRespondida).not.toHaveBeenCalled();
    expect(botonCalificar().disabled).toBeFalse();
  });

  it('a quien ya calificó en otra sesión no lo deja calificar de nuevo', () => {
    crear(true);

    expect(texto()).toContain('¡Gracias por calificarnos!');
    expect(texto()).not.toContain('¿Cómo calificaría la Credencial Digital?');
  });
});
