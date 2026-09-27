import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { UserData } from '../../../auth/interfaces/user.interface';
import { AuthService } from '../../../auth/services/auth.service';
import { ImagenService } from '../../../shared/services/imagen.service';
import { GestionListasService, TipoTramite } from '../../services/gestion-listas.service';
import { ReintegrosService } from '../../services/reintegros.service';
import { SolicitarReintegroComponent } from './solicitar-reintegro.component';

/** Los seis tipos que manda hoy api-list_tramite.php, ya normalizados. */
const TIPOS: TipoTramite[] = [
  { clave: 'RM', descripcion: 'Reintegro de farmacia', beneficio: 'far' },
  { clave: 'RN', descripcion: 'Subsidio por nacimiento' },
  { clave: 'RE', descripcion: 'Reintegro de escolaridad' },
  { clave: 'TE', descripcion: 'Trámite de evacuación', beneficio: 'eva' },
  { clave: 'TP', descripcion: 'Trámite de préstamo' },
  { clave: 'RC', descripcion: 'Subsidio por casamiento' },
];

describe('SolicitarReintegroComponent', () => {
  let fixture: ComponentFixture<SolicitarReintegroComponent>;
  let component: SolicitarReintegroComponent;
  let reintegros: jasmine.SpyObj<ReintegrosService>;
  const usuario = signal<UserData | null>(null);

  const raiz = () => fixture.nativeElement as HTMLElement;
  const selector = () => raiz().querySelector('select') as HTMLSelectElement;
  const modalAdhesion = () => component.modalAdhesion.nativeElement;
  const modalForm = () => component.modalForm.nativeElement;
  const modalResultado = () => component.modalResultado.nativeElement;
  const boton = (contenedor: HTMLElement, texto: string) =>
    Array.from(contenedor.querySelectorAll('button')).find(b => b.textContent?.trim() === texto);
  const pdf = (nombre = 'receta.pdf') => new File(['x'], nombre, { type: 'application/pdf' });

  /** Abre el formulario con un socio que tiene sólo los beneficios indicados. */
  function abrirCon(flags: { far?: boolean; eva?: boolean }): void {
    usuario.set({
      Persona: [],
      Beneficios: [{ far: false, eva: false, sep: false, seg: false, ...flags }],
    } as UserData);
    component.abrirFormulario();
    fixture.detectChanges();
  }

  /** Lo mismo que hace el socio al tocar una opción del selector. */
  function elegir(clave: string): void {
    selector().value = clave;
    selector().dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    usuario.set(null);
    reintegros = jasmine.createSpyObj<ReintegrosService>('ReintegrosService', ['subirDocumentos']);

    await TestBed.configureTestingModule({
      imports: [SolicitarReintegroComponent],
      providers: [
        { provide: AuthService, useValue: { user: usuario.asReadonly() } },
        { provide: GestionListasService, useValue: { getListas: () => of({ tipos: TIPOS }) } },
        { provide: ReintegrosService, useValue: reintegros },
        { provide: ImagenService, useValue: { comprimir: (archivo: File) => Promise.resolve(archivo) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitarReintegroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Los <dialog> abiertos con showModal() quedan en la capa superior del
    // documento de Karma: se cierran para que no tapen al test siguiente.
    raiz().querySelectorAll('dialog').forEach(d => d.open && d.close());
  });

  it('muestra todos los trámites, esté adherido o no', () => {
    abrirCon({});

    expect(Array.from(selector().options).map(o => o.value).filter(Boolean))
      .toEqual(['RM', 'RN', 'RE', 'TE', 'TP', 'RC']);
  });

  it('arranca sin tipo elegido y sin dejar adjuntar: primero se elige el trámite', () => {
    abrirCon({ far: true });

    expect(component.tipoSeleccionado()).toBe('');
    expect(selector().selectedOptions[0].textContent).toContain('Seleccione el tipo de trámite');
    expect(boton(modalForm(), 'Adjuntar')).toBeUndefined();
  });

  describe('al elegir un tipo', () => {

    beforeEach(() => {
      abrirCon({});
      elegir('RC');
    });

    it('el selector se reemplaza por una leyenda con el nombre del trámite', () => {
      expect(selector()).toBeNull();
      expect(modalForm().textContent).toContain('El tipo de trámite seleccionado es');
      expect(modalForm().textContent).toContain('Subsidio por casamiento');
    });

    it('recién ahí deja adjuntar', () => {
      expect(boton(modalForm(), 'Adjuntar')).toBeDefined();
      expect(boton(modalForm(), 'Sacar foto')).toBeDefined();
    });

    it('"Cambiar tipo de trámite" vuelve a mostrar el selector, sin ninguno marcado', () => {
      boton(modalForm(), 'Cambiar tipo de trámite')!.click();
      fixture.detectChanges();

      expect(selector()).not.toBeNull();
      expect(component.tipoSeleccionado()).toBe('');
      expect(boton(modalForm(), 'Adjuntar')).toBeUndefined();
    });

    it('si cambia a otro tipo, quita los archivos: eran para el trámite anterior', () => {
      component.archivos.set([pdf()]);
      component.cambiarTipo();
      fixture.detectChanges();

      expect(modalForm().textContent).toContain('Si elige otro tipo, se quita el archivo');

      elegir('TP');

      expect(component.archivos()).toEqual([]);
      expect(modalForm().textContent).toContain('Trámite de préstamo');
    });

    it('si vuelve a elegir el mismo, los archivos se quedan', () => {
      component.archivos.set([pdf()]);
      component.cambiarTipo();
      fixture.detectChanges();

      elegir('RC');

      expect(component.archivos().length).toBe(1);
    });

    it('mientras elige otro tipo no se puede enviar', () => {
      component.archivos.set([pdf()]);
      component.cambiarTipo();

      component.enviar();

      expect(reintegros.subirDocumentos).not.toHaveBeenCalled();
    });
  });

  describe('al enviar', () => {

    beforeEach(() => {
      abrirCon({});
      elegir('RC');
      component.archivos.set([pdf('acta.pdf'), pdf('libreta.pdf')]);
    });

    describe('con éxito', () => {

      beforeEach(() => {
        reintegros.subirDocumentos.and.returnValue(of({ ok: true, archivos: [{}, {}] } as any));
        component.enviar();
        fixture.detectChanges();
      });

      it('manda los archivos con el tipo elegido', () => {
        expect(reintegros.subirDocumentos).toHaveBeenCalledOnceWith('RC', jasmine.any(Array));
      });

      it('dice "Archivos enviados exitosamente" y nombra el trámite', () => {
        expect(modalResultado().open).toBeTrue();
        expect(modalResultado().textContent).toContain('Archivos enviados exitosamente');
        expect(modalResultado().textContent).toContain('Subsidio por casamiento');
      });

      it('ofrece "Iniciar otro trámite" y "Cerrar"', () => {
        expect(boton(modalResultado(), 'Iniciar otro trámite')).toBeDefined();
        expect(boton(modalResultado(), 'Cerrar')).toBeDefined();
        expect(boton(modalResultado(), 'Reintentar')).toBeUndefined();
      });

      it('"Iniciar otro trámite" vuelve al formulario en blanco, con el selector', () => {
        boton(modalResultado(), 'Iniciar otro trámite')!.click();
        fixture.detectChanges();

        expect(modalResultado().open).toBeFalse();
        expect(modalForm().open).toBeTrue();
        expect(selector()).not.toBeNull();
        expect(component.tipoSeleccionado()).toBe('');
        expect(component.archivos()).toEqual([]);
      });

      it('"Cerrar" cierra todo', () => {
        boton(modalResultado(), 'Cerrar')!.click();
        fixture.detectChanges();

        expect(modalResultado().open).toBeFalse();
        expect(modalForm().open).toBeFalse();
      });
    });

    it('si falla, "Reintentar" vuelve con el mismo tipo y los mismos archivos', () => {
      reintegros.subirDocumentos.and.returnValue(throwError(() => ({ status: 0 })));
      component.enviar();
      fixture.detectChanges();

      boton(modalResultado(), 'Reintentar')!.click();
      fixture.detectChanges();

      expect(modalForm().open).toBeTrue();
      expect(component.tipoSeleccionado()).toBe('RC');
      expect(component.archivos().length).toBe(2);
      expect(modalForm().textContent).toContain('Subsidio por casamiento');
    });
  });

  describe('al elegir un trámite de un beneficio al que no está adherido', () => {

    beforeEach(() => {
      abrirCon({ eva: true }); // tiene evacuación, no tiene farmacia
      elegir('RM');
    });

    it('abre el aviso de "no adherido"', () => {
      expect(modalAdhesion().open).toBeTrue();
      expect(modalAdhesion().textContent).toContain('No está adherido al beneficio de Farmacia');
    });

    it('el selector queda sin elegir, así no carga documentos que se van a rechazar', () => {
      expect(selector().value).toBe('');
      expect(component.tipoSeleccionado()).toBe('');
      expect(boton(modalForm(), 'Adjuntar')).toBeUndefined();
    });

    it('ofrece el mismo botón de adherirse que la vista de Beneficios', () => {
      const boton = modalAdhesion().querySelector('app-boton-adherirme a') as HTMLAnchorElement;

      expect(boton.textContent?.trim()).toBe('Adherirme');
      expect(decodeURIComponent(boton.href)).toContain('wa.me/5491126526532');
      expect(decodeURIComponent(boton.href)).toContain('quiero adherirme al beneficio de Farmacia');
    });

    it('"Volver" cierra el aviso y deja el formulario abierto', () => {
      const volver = Array.from(modalAdhesion().querySelectorAll('button'))
        .find(b => b.textContent?.trim() === 'Volver')!;
      volver.click();

      expect(modalAdhesion().open).toBeFalse();
      expect(component.modalForm.nativeElement.open).toBeTrue();
    });
  });

  it('un trámite de un beneficio al que sí está adherido se elige sin aviso', () => {
    abrirCon({ eva: true });
    elegir('TE');

    expect(modalAdhesion().open).toBeFalse();
    expect(component.tipoSeleccionado()).toBe('TE');
  });

  it('un trámite que no exige beneficio se elige sin aviso', () => {
    abrirCon({});
    elegir('TP');

    expect(modalAdhesion().open).toBeFalse();
    expect(component.tipoSeleccionado()).toBe('TP');
  });

  it('si igual quedara elegido un trámite sin adhesión, avisa en vez de enviar', () => {
    abrirCon({});
    component.tipoSeleccionado.set('RM');
    component.eligiendoTipo.set(false);
    component.archivos.set([pdf()]);

    component.enviar();
    fixture.detectChanges();

    expect(modalAdhesion().open).toBeTrue();
    expect(reintegros.subirDocumentos).not.toHaveBeenCalled();
  });
});
