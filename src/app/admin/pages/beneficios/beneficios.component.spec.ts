import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { UserData } from '../../../auth/interfaces/user.interface';
import { AuthService } from '../../../auth/services/auth.service';
import BeneficiosComponent from './beneficios.component';

type Flags = { far?: boolean; eva?: boolean; sep?: boolean; seg?: boolean };

describe('BeneficiosComponent', () => {
  let fixture: ComponentFixture<BeneficiosComponent>;
  let component: BeneficiosComponent;
  const usuario = signal<UserData | null>(null);

  /** Perfil mínimo con los beneficios que interesan a la vista. */
  function conBeneficios(flags: Flags): void {
    usuario.set({
      Persona: [],
      Beneficios: [{ far: false, eva: false, sep: false, seg: false, ...flags }],
    } as UserData);
    fixture.detectChanges();
  }

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const enlaces = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')) as HTMLAnchorElement[];

  beforeEach(async () => {
    usuario.set(null);

    await TestBed.configureTestingModule({
      imports: [BeneficiosComponent],
      providers: [{
        provide: AuthService,
        useValue: { user: usuario.asReadonly(), checkStatus: () => of(true) },
      }],
    }).compileComponents();

    fixture = TestBed.createComponent(BeneficiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra el esqueleto mientras no llega el perfil, sin afirmar ningún estado', () => {
    expect(component.cargando()).toBeTrue();
    expect(texto()).not.toContain('Adherido');
    expect(texto()).not.toContain('No adherido');
  });

  it('usa "adherido" en los textos, nunca "contratado"', () => {
    conBeneficios({ far: true });

    expect(texto()).toContain('Adherido');
    expect(texto()).toContain('No adherido');
    expect(texto().toLowerCase()).not.toContain('contratad');
    expect(texto().toLowerCase()).not.toContain('contratar');
  });

  it('marca cada beneficio según lo que tiene contratado', () => {
    conBeneficios({ far: true, sep: true });

    const estado = Object.fromEntries(component.beneficios().map(b => [b.clave, b.contratado]));
    expect(estado).toEqual({ far: true, eva: false, sep: true, seg: false });
  });

  it('pone primero los adheridos y después los que no', () => {
    conBeneficios({ sep: true, seg: true });

    expect(component.beneficios().map(b => b.nombre)).toEqual([
      'Seguro de sepelio', 'Seguro de vida', 'Farmacia', 'Evacuaciones',
    ]);
  });

  it('dentro de cada grupo respeta el orden de siempre', () => {
    conBeneficios({ seg: true, far: true });

    // Adheridos: farmacia antes que vida. No adheridos: evacuaciones antes que sepelio.
    expect(component.beneficios().map(b => b.nombre)).toEqual([
      'Farmacia', 'Seguro de vida', 'Evacuaciones', 'Seguro de sepelio',
    ]);
  });

  it('la barra del resumen sigue el mismo orden: primero los segmentos llenos', () => {
    conBeneficios({ seg: true });

    const segmentos = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('section [role="img"] span'),
    ).map(s => s.classList.contains('bg-gray-200'));

    expect(segmentos).toEqual([false, true, true, true]);
  });

  describe('resumen', () => {
    it('cuenta los adheridos', () => {
      conBeneficios({ far: true, eva: true });
      expect(component.resumen()).toBe('Está adherido a 2 de 4 beneficios');
    });

    it('lo dice distinto si no tiene ninguno', () => {
      conBeneficios({});
      expect(component.resumen()).toBe('Todavía no está adherido a ningún beneficio');
    });

    it('lo dice distinto si los tiene todos', () => {
      conBeneficios({ far: true, eva: true, sep: true, seg: true });
      expect(component.resumen()).toBe('Está adherido a todos los beneficios');
    });
  });

  describe('WhatsApp', () => {
    it('ofrece adherirse sólo a los que no tiene', () => {
      conBeneficios({ far: true, sep: true });

      const adherirme = enlaces().filter(a => a.textContent?.trim() === 'Adherirme');
      expect(adherirme.length).toBe(2);
    });

    it('el mensaje nombra el beneficio, así quien atiende sabe qué quiere', () => {
      conBeneficios({});

      const farmacia = component.beneficios().find(b => b.clave === 'far')!;
      expect(farmacia.enlaceAdhesion).toContain('wa.me/5491126526532');
      expect(decodeURIComponent(farmacia.enlaceAdhesion))
        .toContain('quiero adherirme al beneficio de Farmacia');
    });

    it('a quien ya está adherido le ofrece consultas sólo donde el área tiene número', () => {
      conBeneficios({ far: true, eva: true, sep: true, seg: true });

      const consultas = enlaces().filter(a => a.textContent?.includes('Consultas por WhatsApp'));
      expect(consultas.map(a => a.href)).toEqual([
        jasmine.stringMatching(/wa\.me\/5491158558733/),
        jasmine.stringMatching(/wa\.me\/5491132705301/),
      ]);
    });

    it('no ofrece adherirse a nada si ya tiene todo', () => {
      conBeneficios({ far: true, eva: true, sep: true, seg: true });

      expect(enlaces().some(a => a.textContent?.trim() === 'Adherirme')).toBeFalse();
    });
  });
});
