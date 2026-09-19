// Simulador de cuotas. Está terminado y con tests, pero hoy no cuelga de
// ninguna ruta: la pantalla de Ayuda económica pasó a mostrar las solicitudes
// del socio. Queda acá para engancharlo cuando se decida dónde va.
import { CommonModule } from '@angular/common';
import { Component, computed, HostListener, inject, signal } from '@angular/core';

import { CondicionesPrestamo, SimuladorPrestamoService } from '../../services/simulador-prestamo.service';
import { simular, Simulacion, tasaEfectivaAnual, tasaMensual } from '../../utils/prestamo';

/** Ancho del círculo del deslizador, para ubicar el globito justo encima. */
const ANCHO_CIRCULO_PX = 28;

const numero = new Intl.NumberFormat('es-AR');
const porcentaje = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

@Component({
  selector: 'app-simulador-prestamo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './simulador-prestamo.component.html',
  styleUrl: './simulador-prestamo.component.css',
})
export default class SimuladorPrestamoComponent {

  private simuladorPrestamoService = inject(SimuladorPrestamoService);

  condiciones = signal<CondicionesPrestamo | null>(null);

  /** El monto que se simula. Mientras se escribe puede quedar fuera de rango. */
  monto = signal<number>(0);

  /** Lo que se ve en el campo: el monto con separador de miles. */
  montoTexto = signal<string>('');

  mesesElegidos = signal<number>(0);

  /** Mientras se arrastra el deslizador se muestra el globito con el monto. */
  arrastrando = signal<boolean>(false);

  aviso = signal<string | null>(null);

  constructor() {
    this.simuladorPrestamoService.getCondiciones().subscribe(condiciones => {
      this.condiciones.set(condiciones);
      this.fijarMonto(condiciones.montoInicial);
      // Arranca en el plazo más largo: es la cuota más baja, la que la
      // mayoría viene a mirar primero.
      this.mesesElegidos.set(condiciones.plazos.at(-1)?.meses ?? 0);
    });
  }

  montoValido = computed(() => {
    const c = this.condiciones();
    return !!c && this.monto() >= c.montoMinimo && this.monto() <= c.montoMaximo;
  });

  /** Una simulación por plazo: se recalculan todas con cada cambio de monto. */
  simulaciones = computed<Simulacion[]>(() => {
    const c = this.condiciones();
    if (!c || !this.montoValido()) return [];

    return c.plazos.map(plazo => simular(this.monto(), plazo.tna, plazo.meses));
  });

  elegida = computed(() =>
    this.simulaciones().find(s => s.meses === this.mesesElegidos()) ?? null
  );

  /** El deslizador no puede salir de su rango aunque el campo sí. */
  montoEnRango = computed(() => {
    const c = this.condiciones();
    if (!c) return 0;
    return Math.min(c.montoMaximo, Math.max(c.montoMinimo, this.monto()));
  });

  /** Cuánto del recorrido va lleno, de 0 a 100: pinta la barra y ubica el globito. */
  avance = computed(() => {
    const c = this.condiciones();
    if (!c) return 0;
    return ((this.montoEnRango() - c.montoMinimo) / (c.montoMaximo - c.montoMinimo)) * 100;
  });

  /**
   * El centro del círculo no recorre todo el ancho: va de medio círculo a
   * ancho menos medio círculo. Sin esta corrección el globito se despega del
   * círculo hacia los extremos.
   */
  posicionGlobo = computed(() => {
    const fraccion = this.avance() / 100;
    const correccion = ANCHO_CIRCULO_PX / 2 - fraccion * ANCHO_CIRCULO_PX;
    return `calc(${this.avance()}% + ${correccion}px)`;
  });

  /** Las tasas del plazo elegido, listas para el texto gris. */
  tasas = computed(() => {
    const c = this.condiciones();
    const tna = this.elegida()?.tna ?? c?.plazos[0]?.tna;
    if (tna === undefined) return null;

    return {
      tna: porcentaje.format(tna * 100),
      tem: porcentaje.format(tasaMensual(tna) * 100),
      tea: porcentaje.format(tasaEfectivaAnual(tna) * 100),
    };
  });

  formatear(valor: number): string {
    return numero.format(valor);
  }

  elegirPlazo(meses: number): void {
    this.mesesElegidos.set(meses);
  }

  alDeslizar(event: Event): void {
    this.fijarMonto(Number((event.target as HTMLInputElement).value));
  }

  /**
   * Se formatea con separador de miles mientras se escribe: un número largo
   * sin puntos es difícil de leer. Pasado el máximo se planta en el máximo;
   * por debajo del mínimo se avisa pero no se corrige hasta que sale del
   * campo, porque mientras escribe "5" para llegar a "500.000" es normal
   * pasar por montos chicos.
   */
  alEscribir(event: Event): void {
    const c = this.condiciones();
    if (!c) return;

    const campo = event.target as HTMLInputElement;
    const digitos = campo.value.replace(/\D/g, '');
    let valor = digitos ? Number(digitos) : 0;

    if (valor > c.montoMaximo) {
      valor = c.montoMaximo;
      this.aviso.set(`El máximo es $ ${this.formatear(c.montoMaximo)}.`);
    } else if (valor < c.montoMinimo) {
      this.aviso.set(`El mínimo es $ ${this.formatear(c.montoMinimo)}.`);
    } else {
      this.aviso.set(null);
    }

    const texto = digitos ? this.formatear(valor) : '';
    this.monto.set(valor);
    this.montoTexto.set(texto);
    // Se escribe a mano además de la señal: si el texto formateado coincide
    // con el anterior, Angular no repinta y quedaría la letra que se tipeó.
    campo.value = texto;
  }

  alSalirDelCampo(): void {
    const c = this.condiciones();
    if (!c) return;

    this.fijarMonto(Math.min(c.montoMaximo, Math.max(c.montoMinimo, this.monto())));
  }

  empezarArrastre(): void {
    this.arrastrando.set(true);
  }

  /**
   * Se escucha en la ventana y no en el deslizador: si el dedo se suelta
   * fuera de la barra, el evento no le llega a ella y el globito quedaría
   * colgado.
   */
  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  terminarArrastre(): void {
    this.arrastrando.set(false);
  }

  private fijarMonto(valor: number): void {
    this.monto.set(valor);
    this.montoTexto.set(this.formatear(valor));
    this.aviso.set(null);
  }
}
