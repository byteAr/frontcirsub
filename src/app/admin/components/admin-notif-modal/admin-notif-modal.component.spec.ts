import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AdminNotifService } from '../../../shared/services/admin-notif.service';
import { AdminNotifModalComponent } from './admin-notif-modal.component';

/**
 * El envío a todos le llega a cientos de asociados reales y no se puede
 * deshacer. Lo que se fija acá es que no salga de un solo toque, que antes se
 * vea a cuánta gente alcanza, y que el botón no esté ni para quien no es
 * super admin.
 */
describe('AdminNotifModalComponent - enviar a todos', () => {
  let fixture: ComponentFixture<AdminNotifModalComponent>;
  let componente: AdminNotifModalComponent;
  let servicio: jasmine.SpyObj<AdminNotifService>;

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const botones = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
  const boton = (etiqueta: string | RegExp) =>
    botones().find((b) => (typeof etiqueta === 'string'
      ? (b.textContent ?? '').includes(etiqueta)
      : etiqueta.test(b.textContent ?? ''))) as HTMLButtonElement | undefined;

  function crear(role: 'superadmin' | 'sender' = 'superadmin'): void {
    fixture = TestBed.createComponent(AdminNotifModalComponent);
    fixture.componentRef.setInput('role', role);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  }

  /** Deja el formulario listo con destino "todos" y un mensaje escrito. */
  function prepararEnvioATodos(): void {
    boton('Todos los asociados')!.click();
    componente.titulo.set('Asamblea');
    componente.cuerpo.set('El viernes a las 18.');
    fixture.detectChanges();
  }

  beforeEach(async () => {
    servicio = jasmine.createSpyObj<AdminNotifService>('AdminNotifService', [
      'contarAudiencia',
      'sendToAll',
      'sendNotification',
      'searchByDni',
      'listPermissions',
    ]);
    servicio.contarAudiencia.and.returnValue(of({ enGestion: 584, conApp: 310 }));
    servicio.sendToAll.and.returnValue(
      of({ ok: true, destinatarios: 584, notificados: 310, sinSuscripcion: 274, fallidos: 0 }),
    );
    servicio.listPermissions.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AdminNotifModalComponent, NoopAnimationsModule],
      providers: [{ provide: AdminNotifService, useValue: servicio }],
    }).compileComponents();
  });

  it('a quien no es super admin no le ofrece el envío a todos', () => {
    crear('sender');

    expect(boton('Todos los asociados')).toBeUndefined();
  });

  it('antes de mandar muestra a cuántos asociados les va a llegar', () => {
    crear();

    boton('Todos los asociados')!.click();
    fixture.detectChanges();

    expect(servicio.contarAudiencia).toHaveBeenCalledTimes(1);
    expect(texto()).toContain('584');
    expect(texto()).toContain('310');
  });

  it('el primer toque no manda nada: pide confirmación', () => {
    crear();
    prepararEnvioATodos();

    boton('Enviar a todos los asociados')!.click();
    fixture.detectChanges();

    expect(servicio.sendToAll).not.toHaveBeenCalled();
    expect(texto()).toContain('no se puede deshacer');
    expect(boton('Sí, enviar a todos')).toBeDefined();
  });

  it('recién manda con el segundo toque, el de confirmar', () => {
    crear();
    prepararEnvioATodos();

    boton('Enviar a todos los asociados')!.click();
    fixture.detectChanges();
    boton('Sí, enviar a todos')!.click();
    fixture.detectChanges();

    expect(servicio.sendToAll).toHaveBeenCalledOnceWith({
      titulo: 'Asamblea',
      cuerpo: 'El viernes a las 18.',
    });
    expect(texto()).toContain('Envío terminado');
  });

  it('cancelar deja todo como estaba, sin mandar', () => {
    crear();
    prepararEnvioATodos();

    boton('Enviar a todos los asociados')!.click();
    fixture.detectChanges();
    boton('Cancelar')!.click();
    fixture.detectChanges();

    expect(servicio.sendToAll).not.toHaveBeenCalled();
    expect(boton('Enviar a todos los asociados')).toBeDefined();
  });

  it('sin título o sin mensaje no deja llegar ni a la confirmación', () => {
    crear();
    boton('Todos los asociados')!.click();
    componente.titulo.set('Solo el título');
    fixture.detectChanges();

    expect(boton('Enviar a todos los asociados')!.disabled).toBeTrue();
  });

  it('si el envío falla, lo dice y vuelve al estado inicial', () => {
    crear();
    prepararEnvioATodos();
    servicio.sendToAll.and.returnValue(throwError(() => ({ status: 500 })));

    boton('Enviar a todos los asociados')!.click();
    fixture.detectChanges();
    boton('Sí, enviar a todos')!.click();
    fixture.detectChanges();

    expect(componente.confirmandoTodos()).toBeFalse();
    expect(componente.resultadoMasivo()).toBeNull();
  });

  it('si no se puede consultar el padrón, avisa y deja reintentar', () => {
    servicio.contarAudiencia.and.returnValue(throwError(() => new Error('sin conexión')));
    crear();

    boton('Todos los asociados')!.click();
    fixture.detectChanges();

    expect(texto()).toContain('No se pudo consultar el padrón');
    expect(boton('Reintentar')).toBeDefined();
  });
});
