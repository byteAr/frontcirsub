import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DescuentosService, PeriodoDescuentos } from '../../services/descuentos.service';

/** Cuántos meses se agregan cada vez que el socio llega al final de la lista. */
const MESES_POR_TANDA = 12;

@Component({
  selector: 'app-descuentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './descuentos.component.html',
  styleUrl: './descuentos.component.css'
})
export default class DescuentosComponent implements OnInit {

  private descuentosService = inject(DescuentosService);

  periodos = signal<PeriodoDescuentos[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  visibles = signal<number>(MESES_POR_TANDA);

  /**
   * Meses desplegados. Se guarda el período y no el índice para que no se
   * descoloque al cargar otra tanda.
   */
  private desplegados = signal<Set<string>>(new Set<string>());

  periodosVisibles = computed(() => this.periodos().slice(0, this.visibles()));
  hayMas = computed(() => this.visibles() < this.periodos().length);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.descuentosService.getDescuentos().subscribe({
      next: periodos => {
        this.periodos.set(periodos ?? []);
        this.visibles.set(MESES_POR_TANDA);
        this.desplegados.set(new Set<string>());
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos obtener sus descuentos. Intente nuevamente en unos minutos.');
        this.cargando.set(false);
      }
    });
  }

  estaDesplegado(periodo: PeriodoDescuentos): boolean {
    return this.desplegados().has(periodo.periodo);
  }

  alternarDespliegue(periodo: PeriodoDescuentos): void {
    this.desplegados.update(actuales => {
      const proximos = new Set(actuales);
      proximos.has(periodo.periodo)
        ? proximos.delete(periodo.periodo)
        : proximos.add(periodo.periodo);
      return proximos;
    });
  }

  onScrollVentana(): void {
    if (!this.hayMas()) return;

    const faltante =
      document.documentElement.scrollHeight - window.scrollY - window.innerHeight;

    if (faltante < 120) {
      this.visibles.update(actual => actual + MESES_POR_TANDA);
    }
  }
}
