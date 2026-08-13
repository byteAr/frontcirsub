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
      .filter(o => !this.esAprobado(o))
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

  /**
   * El backend ya normaliza el estado, pero la comparación se hace acá de
   * forma tolerante: el PHP devuelve "apro" crudo y un cambio de su lado no
   * debería dejar todas las filas pintadas como pendientes.
   */
  esAprobado(orden: OrdenPago): boolean {
    const estado = (orden.estado ?? '').toString().trim().toLowerCase();

    // "oprobado" es un error de tipeo de api-ops.php. Se acepta acá también
    // para no depender de que el backend esté actualizado; sale cuando lo
    // corrijan del lado del PHP.
    return estado === 'aprobado' || estado === 'apro' || estado === 'oprobado';
  }

  etiquetaEstado(orden: OrdenPago): string {
    if (this.esAprobado(orden)) return 'Aprobado';

    const estado = (orden.estado ?? '').toString().trim().toLowerCase();
    if (estado === 'pendiente' || estado === 'pdte') return 'Pendiente';

    // Estado desconocido: se muestra lo que haya descrito el backend en vez de
    // inventar uno, que sería mentirle al socio sobre si le pagaron o no.
    return orden.estadoDescripcion || 'Pendiente';
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
