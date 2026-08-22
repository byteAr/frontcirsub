import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { SolicitarReintegroComponent } from '../../components/solicitar-reintegro/solicitar-reintegro.component';
import { OrdenPago, ReintegrosService } from '../../services/reintegros.service';

/** Cuántas filas se agregan cada vez que el socio llega al final de la lista. */
const FILAS_POR_TANDA = 15;

@Component({
  selector: 'app-reintegros',
  standalone: true,
  imports: [CommonModule, SolicitarReintegroComponent],
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

  /**
   * Comprobantes desplegados en la vista de celular. Se guarda el comprobante
   * y no el índice para que no se descoloque al cargar otra tanda.
   */
  private desplegadas = signal<Set<string>>(new Set<string>());

  ordenesVisibles = computed(() => this.ordenes().slice(0, this.visibles()));
  hayMas = computed(() => this.visibles() < this.ordenes().length);

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
        this.desplegadas.set(new Set<string>());
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos obtener sus reintegros. Intente nuevamente en unos minutos.');
        this.cargando.set(false);
      }
    });
  }

  estaDesplegada(orden: OrdenPago): boolean {
    return this.desplegadas().has(orden.comprobante);
  }

  alternarDespliegue(orden: OrdenPago): void {
    this.desplegadas.update(actuales => {
      const proximas = new Set(actuales);
      proximas.has(orden.comprobante)
        ? proximas.delete(orden.comprobante)
        : proximas.add(orden.comprobante);
      return proximas;
    });
  }

  /**
   * El backend ya normaliza el estado, pero acá se vuelve a resolver de forma
   * tolerante: el PHP ya cambió sus literales dos veces sin aviso y un cambio
   * de su lado no debería dejar toda la tabla pintada de un solo color.
   */
  private claveEstado(orden: OrdenPago): 'pendiente' | 'aprobado' | 'pagado' | 'otro' {
    const estado = (orden.estado ?? '').toString().trim().toLowerCase();

    if (estado === 'pendiente' || estado === 'pdte') return 'pendiente';

    // "oprobado" fue un typo de api-ops.php; se sigue aceptando por las dudas.
    if (estado === 'aprobado' || estado === 'apro' || estado === 'oprobado') {
      return 'aprobado';
    }

    if (estado === 'pagado' || estado === 'pago') return 'pagado';

    return 'otro';
  }

  /**
   * Un color por paso del circuito: naranja lo que el socio todavía espera,
   * celeste lo autorizado que aún no se transfirió, verde lo cobrado. El gris
   * es para un literal desconocido, que no se pinta ni de bueno ni de malo.
   */
  claseEstado(orden: OrdenPago): string {
    switch (this.claveEstado(orden)) {
      case 'pendiente': return 'bg-orange-500';
      case 'aprobado':  return 'bg-cyan-600';
      case 'pagado':    return 'bg-green-600';
      default:          return 'bg-gray-500';
    }
  }

  /** Reloj, un tilde o doble tilde, al estilo de los mensajes de WhatsApp. */
  iconoEstado(orden: OrdenPago): 'reloj' | 'tilde' | 'doble-tilde' {
    switch (this.claveEstado(orden)) {
      case 'aprobado': return 'tilde';
      case 'pagado':   return 'doble-tilde';
      default:         return 'reloj';
    }
  }

  etiquetaEstado(orden: OrdenPago): string {
    switch (this.claveEstado(orden)) {
      case 'pendiente': return 'Pendiente';
      case 'aprobado':  return 'Aprobado';
      case 'pagado':    return 'Pagado';
      // Estado desconocido: se muestra lo que haya descrito el backend en vez
      // de inventar uno, que sería mentirle al socio sobre su plata.
      default:          return orden.estadoDescripcion || 'Pendiente';
    }
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

  /** En celular el scroll es el de la página, no el de un contenedor. */
  onScrollVentana(): void {
    if (!this.hayMas()) return;

    const faltante =
      document.documentElement.scrollHeight -
      window.scrollY -
      window.innerHeight;

    if (faltante < 120) {
      this.visibles.update(actual => actual + FILAS_POR_TANDA);
    }
  }
}
