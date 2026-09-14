import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';

import { GestionListasService, ValoresMutual } from '../../services/gestion-listas.service';

/** Una jerarquía de la columna GRADO de la planilla, con su número. */
interface Jerarquia {
  grado: string;
  numero: number;
}

/**
 * Los tres tipos de socio con las jerarquías que le corresponden a cada uno.
 *
 * Esta parte no viene del PHP: el endpoint sólo dice cuánto sale la cuota de
 * cada tipo ("Cuota Social Tipo1"), no qué jerarquía cae en cada uno. La
 * correspondencia sale de la planilla de Afiliaciones y cambia muy de vez en
 * cuando, así que vive acá. Los colores son los mismos que usa el papel.
 */
interface GrupoTipo {
  tipo: string;
  jerarquias: Jerarquia[];
  /** Fondo de las celdas de jerarquía y del número de tipo. */
  clase: string;
}

const GRUPOS_TIPO: GrupoTipo[] = [
  {
    tipo: '1',
    clase: 'bg-orange-100 text-orange-900',
    jerarquias: [
      { grado: 'PENSIONADO', numero: 99 },
      { grado: 'GENDARME', numero: 28 },
    ],
  },
  {
    tipo: '2',
    clase: 'bg-sky-100 text-sky-900',
    jerarquias: [
      { grado: 'CABO', numero: 27 },
      { grado: 'CABO 1RO', numero: 26 },
      { grado: 'SARGENTO', numero: 25 },
    ],
  },
  {
    tipo: '3',
    clase: 'bg-violet-100 text-violet-900',
    jerarquias: [
      { grado: 'SARG 1RO', numero: 24 },
      { grado: 'SARG AY', numero: 23 },
      { grado: 'SUBOF PR', numero: 22 },
      { grado: 'SUBOF MY', numero: 21 },
      { grado: 'E.C.C.', numero: 40 },
    ],
  },
];

/**
 * Período de la planilla y mes de actualización de cada columna.
 *
 * Estáticos por ahora: api-list_tramite.php manda los importes pero no desde
 * cuándo rigen. Quedan juntos y en un solo lugar para que actualizarlos sea
 * cambiar estas líneas, hasta que gestión los agregue a la respuesta.
 */
const PERIODO = 'Agosto 2026';

const MESES_ACTUALIZACION = {
  cuotaSocial: 'ago-26',
  sepelio: 'dic-25',
  farmacia: 'ago-26',
  evacuacion: 'ago-26',
  seguroVida: 'dic-25',
};

const MES_SUBSIDIOS = 'ago-26';

@Component({
  selector: 'app-valores-mutual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './valores-mutual.component.html',
  styleUrl: './valores-mutual.component.css',
})
export class ValoresMutualComponent {

  @ViewChild('modalValores') modalValores!: ElementRef<HTMLDialogElement>;

  private gestionListasService = inject(GestionListasService);

  valores = signal<ValoresMutual | null>(null);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  grupos = GRUPOS_TIPO;
  periodo = PERIODO;
  meses = MESES_ACTUALIZACION;
  mesSubsidios = MES_SUBSIDIOS;

  /** Para el rowspan de las columnas que valen igual para todas las jerarquías. */
  totalJerarquias = GRUPOS_TIPO.reduce((total, grupo) => total + grupo.jerarquias.length, 0);

  abrir(): void {
    this.modalValores.nativeElement.showModal();

    // Se pide recién al abrir: la mayoría de las visitas a "Mis reintegros" no
    // tocan este botón, y el servicio lo cachea para las veces siguientes.
    if (this.valores()) return;

    this.pedir(false);
  }

  cerrar(): void {
    this.modalValores.nativeElement.close();
  }

  /** Reintentar sí descarta lo cacheado: si falló, no hay nada que reusar. */
  cargar(): void {
    this.pedir(true);
  }

  private pedir(descartarCache: boolean): void {
    this.cargando.set(true);
    this.error.set(null);

    const listas$ = descartarCache
      ? this.gestionListasService.recargar()
      : this.gestionListasService.getListas();

    listas$.subscribe({
      next: listas => {
        this.valores.set(listas.valores);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos obtener los valores en este momento. Intente nuevamente en unos minutos.');
        this.cargando.set(false);
      },
    });
  }

  /** Cuota social del tipo, o null si el PHP no la mandó. */
  cuotaDe(tipo: string): number | null {
    return this.valores()?.cuotaPorTipo[tipo] ?? null;
  }
}
