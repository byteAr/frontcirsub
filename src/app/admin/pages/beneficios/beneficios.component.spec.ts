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
    expect(texto()).not.toContain('Contratado');
    expect(texto()).not.toContain('No contratado');
  });

  it('marca cada beneficio según lo que tiene contratado', () => {
    conBeneficios({ far: true, sep: true });

    const estado = Object.fromEntries(component.beneficios().map(b => [b.clave, b.contratado]));
    expect(estado).toEqual({ far: true, eva: false, sep: true, seg: false });
  });

  it('respeta el orden fijo, contratado o no', () => {
    conBeneficios({ seg: true });

    expect(component.beneficios().map(b => b.nombre)).toEqual([
      'Farmacia', 'Evacuaciones', 'Seguro de sepelio', 'Seguro de vida',
    ]);
  });

  describe('resumen', () => {
    it('cuenta los contratados', () => {
      conBeneficios({ far: true, eva: true });
      expect(component.resumen()).toBe('Tiene 2 de 4 beneficios contratados');
    });

    it('lo dice distinto si no tiene ninguno', () => {
      conBeneficios({});
      expect(component.resumen()).toBe('Todavía no tiene beneficios contratados');
    });

    it('lo dice distinto si los tiene todos', () => {
      conBeneficios({ far: true, eva: true, sep: true, seg: true });
      expect(component.resumen()).toBe('Tiene todos los beneficios contratados');
    });
  });

  describe('WhatsApp', () => {
    it('ofrece contratar sólo los que no tiene', () => {
      conBeneficios({ far: true, sep: true });

      const contratar = enlaces().filter(a => a.textContent?.includes('Contratar por WhatsApp'));
      expect(contratar.length).toBe(2);
    });

    it('el mensaje nombra el beneficio, así quien atiende sabe qué quiere', () => {
      conBeneficios({});

      const farmacia = component.beneficios().find(b => b.clave === 'far')!;
      expect(farmacia.enlaceAdhesion).toContain('wa.me/5491126526532');
      expect(decodeURIComponent(farmacia.enlaceAdhesion))
        .toContain('quiero adherirme al beneficio de Farmacia');
    });

    it('a quien ya lo tiene le ofrece consultas sólo donde el área tiene número', () => {
      conBeneficios({ far: true, eva: true, sep: true, seg: true });

      const consultas = enlaces().filter(a => a.textContent?.includes('Consultas por WhatsApp'));
      expect(consultas.map(a => a.href)).toEqual([
        jasmine.stringMatching(/wa\.me\/5491158558733/),
        jasmine.stringMatching(/wa\.me\/5491132705301/),
      ]);
    });

    it('no ofrece contratar nada si ya tiene todo', () => {
      conBeneficios({ far: true, eva: true, sep: true, seg: true });

      expect(enlaces().some(a => a.textContent?.includes('Contratar por WhatsApp'))).toBeFalse();
    });
  });
});
