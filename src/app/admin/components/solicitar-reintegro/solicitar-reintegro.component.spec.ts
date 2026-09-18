import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

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
  { clave: 'TE', descripcion: 'Tramite de evacuacion', beneficio: 'eva' },
  { clave: 'TP', descripcion: 'Tramite de prestamo' },
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

    expect(Array.from(selector().options).map(o => o.value))
      .toEqual(['RM', 'RN', 'RE', 'TE', 'TP', 'RC']);
  });

  it('arranca en el primer trámite que puede pedir, para no abrir con un aviso', () => {
    abrirCon({}); // sin farmacia: RM no se puede, el primero posible es RN

    expect(component.tipoSeleccionado()).toBe('RN');
  });

  it('si está adherido a farmacia, arranca en el reintegro de farmacia', () => {
    abrirCon({ far: true });

    expect(component.tipoSeleccionado()).toBe('RM');
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

    it('vuelve el selector a lo que estaba, así no carga documentos que se van a rechazar', () => {
      expect(selector().value).toBe('RN');
      expect(component.tipoSeleccionado()).toBe('RN');
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
    component.archivos.set([new File(['x'], 'receta.pdf', { type: 'application/pdf' })]);

    component.enviar();
    fixture.detectChanges();

    expect(modalAdhesion().open).toBeTrue();
    expect(reintegros.subirDocumentos).not.toHaveBeenCalled();
  });
});
