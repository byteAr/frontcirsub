import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { UserData } from '../../../auth/interfaces/user.interface';
import { AuthService } from '../../../auth/services/auth.service';
import { CredencialService } from '../../services/credencial.service';
import CBUComponent from './cbu.component';

describe('CBUComponent', () => {
  let component: CBUComponent;
  let fixture: ComponentFixture<CBUComponent>;
  let credencial: jasmine.SpyObj<CredencialService>;
  let avisos: jasmine.Spy;
  const CBU_NUEVO = '2850590940090418135201';

  beforeEach(async () => {
    credencial = jasmine.createSpyObj<CredencialService>('CredencialService', ['getCbu', 'updateCbu']);
    credencial.getCbu.and.returnValue(of({ cbu: '1111111111111111111111' }));

    await TestBed.configureTestingModule({
      imports: [CBUComponent, NoopAnimationsModule],
      providers: [
        { provide: CredencialService, useValue: credencial },
        { provide: AuthService, useValue: { user: signal({ Persona: [{ Id: 4 }] } as UserData).asReadonly() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CBUComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    avisos = spyOn(component.messageService, 'add');
  });

  /** Edita, carga el CBU nuevo y confirma en el modal. */
  function cambiarCbu(): void {
    component.activatedEdit();
    component.form.get('cbu')?.setValue(CBU_NUEVO);
    component.solicitarConfirmacion();
    component.confirmarGuardar();
  }

  const ultimoAviso = () => avisos.calls.mostRecent().args[0];

  it('muestra el CBU guardado', () => {
    expect(component.cbuIngresado).toBe('1111111111111111111111');
  });

  it('confirma el cambio recién cuando el backend dice ok', () => {
    credencial.updateCbu.and.returnValue(of({ ok: true }));

    cambiarCbu();

    expect(credencial.updateCbu).toHaveBeenCalledOnceWith(4, CBU_NUEVO);
    expect(ultimoAviso().severity).toBe('success');
    expect(component.form.get('cbu')?.disabled).toBeTrue();
  });

  it('si el backend no pudo guardar, no dice que se guardó y deja reintentar', () => {
    credencial.updateCbu.and.returnValue(of({ ok: false }));

    cambiarCbu();

    expect(ultimoAviso().severity).toBe('error');
    expect(component.form.get('cbu')?.enabled).toBeTrue();
    expect(component.cbuIngresado).toBe(CBU_NUEVO);
  });

  it('con la sesión vencida pide volver a ingresar', () => {
    credencial.updateCbu.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    cambiarCbu();

    expect(ultimoAviso().severity).toBe('error');
    expect(ultimoAviso().detail).toContain('Su sesión expiró');
    expect(component.form.get('cbu')?.enabled).toBeTrue();
  });

  it('ante otro error avisa sin dar el cambio por hecho', () => {
    credencial.updateCbu.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    cambiarCbu();

    expect(ultimoAviso().severity).toBe('error');
    expect(avisos.calls.allArgs().some(([a]) => a.severity === 'success')).toBeFalse();
  });
});
