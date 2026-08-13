import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { OrdenPago, ReintegrosService } from '../../services/reintegros.service';

/** Cuántas filas se agregan cada vez que el socio llega al final de la lista. */
const FILAS_POR_TANDA = 15;

@Component({
  selector: 'app-reintegros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reintegros.component.html',
  styleUrl: './reintegros.component.css'
})
export default class ReintegrosComponent implements OnInit {

  private reintegrosService = inject(ReintegrosService);

  ordenes = signal<OrdenPago[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  /**
   * Scroll infinito del lado del cliente: el PHP manda todo junto y sin
   * paginar, así que se van revelando de a tandas. Si más adelante el
   * backend pagina, sólo cambia de dónde salen los datos.
   */
  visibles = signal<number>(FILAS_POR_TANDA);

  ordenesVisibles = computed(() => this.ordenes().slice(0, this.visibles()));
  hayMas = computed(() => this.visibles() < this.ordenes().length);

  totalPendiente = computed(() =>
    this.ordenes()
      .filter(o => o.estado === 'pendiente')
      .reduce((total, o) => total + o.importe, 0)
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.reintegrosService.getOrdenesPago().subscribe({
      next: ordenes => {
        this.ordenes.set(ordenes ?? []);
        this.visibles.set(FILAS_POR_TANDA);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos obtener sus reintegros. Intente nuevamente en unos minutos.');
        this.cargando.set(false);
      }
    });
  }

  /** Se dispara al llegar cerca del final del contenedor con scroll. */
  onScroll(event: Event): void {
    if (!this.hayMas()) return;

    const el = event.target as HTMLElement;
    const faltante = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (faltante < 80) {
      this.visibles.update(actual => actual + FILAS_POR_TANDA);
    }
  }
}
