import { CommonModule, DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin, fromEvent, interval, of } from 'rxjs';

import {
  ActivosAhora,
  EstadisticasService,
  PersonaConAcceso,
  Plataforma,
  PuntoTendencia,
  ResumenDia,
} from '../../services/estadisticas.service';

Chart.register(...registerables);

/** Los colores de la app: el celeste y el verde del degradé del login. */
const CELESTE = '#00BBCF';
const VERDE = '#00C579';
const TINTA = '#0f172a';
const GRIS = '#94a3b8';

type Filtro = Plataforma | 'todas';

/**
 * Cada cuánto se refresca el día de hoy. Diez segundos alcanza para que se
 * sienta en vivo y no le pesa a nadie: sólo lo hacen quienes tienen la vista
 * abierta, y se pausa cuando la pestaña queda en segundo plano.
 */
const REFRESCO_MS = 10_000;
/** La tendencia de 30 días casi no se mueve: se refresca una vez por minuto. */
const VUELTAS_POR_TENDENCIA = 6;
/**
 * Al volver a la pestaña, la app avisa "llegué" y el dashboard se refresca a
 * la vez. Si el refresco llega primero, quien mira no se ve a sí mismo hasta
 * la vuelta siguiente. Esperar un segundo le da tiempo al aviso.
 */
const ESPERA_AL_VOLVER_MS = 1_000;

/** Hoy en Argentina, como AAAA-MM-DD, sin depender del reloj del teléfono. */
function hoyArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.component.html',
})
export default class EstadisticasComponent implements AfterViewInit, OnDestroy {
  private readonly servicio = inject(EstadisticasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  private readonly lienzoHoras = viewChild<ElementRef<HTMLCanvasElement>>('graficoHoras');
  private readonly lienzoReparto = viewChild<ElementRef<HTMLCanvasElement>>('graficoReparto');
  private readonly lienzoTendencia = viewChild<ElementRef<HTMLCanvasElement>>('graficoTendencia');

  private graficoHoras?: Chart;
  private graficoReparto?: Chart;
  private graficoTendencia?: Chart;
  private vuelta = 0;

  readonly hoy = hoyArgentina();
  fecha = signal(this.hoy);
  filtro = signal<Filtro>('todas');

  cargando = signal(true);
  error = signal('');
  dia = signal<ResumenDia | null>(null);
  tendencia = signal<PuntoTendencia[]>([]);

  esDueno = signal(false);

  /** Sólo el día de hoy se mueve; los anteriores ya están cerrados. */
  enVivo = computed(() => this.fecha() === this.hoy);
  activos = signal<ActivosAhora | null>(null);
  /** Cuándo llegó el último dato, para el "hace N segundos". */
  actualizado = signal<number | null>(null);
  private reloj = signal(Date.now());

  haceTexto = computed(() => {
    const cuando = this.actualizado();
    if (!cuando) return '';
    const segundos = Math.max(0, Math.round((this.reloj() - cuando) / 1000));
    return segundos < 5 ? 'recién' : `hace ${segundos} s`;
  });

  readonly filtros: { valor: Filtro; etiqueta: string }[] = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'pwa', etiqueta: 'App' },
    { valor: 'web', etiqueta: 'Navegador' },
  ];

  /** Qué parte del total entró por la app instalada. */
  porcentajeApp = computed(() => {
    const d = this.dia();
    if (!d) return 0;
    const total = d.porPlataforma.pwa.personas + d.porPlataforma.web.personas;
    return total ? Math.round((d.porPlataforma.pwa.personas / total) * 100) : 0;
  });

  /** La hora pico en palabras: "11 a 12 h". */
  horaPicoTexto = computed(() => {
    const pico = this.dia()?.horaPico;
    return pico === null || pico === undefined ? 'Sin actividad' : `${pico} a ${pico + 1} h`;
  });

  personasEnPico = computed(() => {
    const d = this.dia();
    return d && d.horaPico !== null ? d.porHora[d.horaPico].personas : 0;
  });

  /** Promedio de pantallas por sesión: cuánto se usa cada vez que se entra. */
  pantallasPorSesion = computed(() => {
    const t = this.dia()?.totales;
    return t && t.sesiones ? (t.visitas / t.sesiones).toFixed(1) : '0';
  });

  ngAfterViewInit(): void {
    this.servicio.permiso().subscribe(({ esDueno }) => {
      this.esDueno.set(esDueno);
      if (esDueno) this.cargarAccesos();
    });
    this.cargar();
    this.iniciarEnVivo();
  }

  ngOnDestroy(): void {
    this.destruirGraficos();
  }

  /**
   * Mientras la vista está abierta y mirando el día de hoy, se refresca sola.
   * Si la pestaña queda en segundo plano, se pausa; al volver, se pone al día
   * en el acto en lugar de esperar al próximo turno.
   */
  private iniciarEnVivo(): void {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloj.set(Date.now()));

    interval(REFRESCO_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.enVivo() && !this.cargando() && this.document.visibilityState !== 'hidden') {
          this.refrescar();
        }
      });

    fromEvent(this.document, 'visibilitychange')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.document.visibilityState === 'visible' && this.enVivo() && !this.cargando()) {
          setTimeout(() => this.refrescar(), ESPERA_AL_VOLVER_MS);
        }
      });
  }

  cambiarFecha(fecha: string): void {
    if (!fecha || fecha > this.hoy) return;
    this.fecha.set(fecha);
    this.cargar();
  }

  moverDia(delta: number): void {
    const d = new Date(`${this.fecha()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    this.cambiarFecha(d.toISOString().slice(0, 10));
  }

  cambiarFiltro(filtro: Filtro): void {
    this.filtro.set(filtro);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    const plataforma = this.filtro() === 'todas' ? undefined : (this.filtro() as Plataforma);

    forkJoin({
      dia: this.servicio.dia(this.fecha(), plataforma),
      tendencia: this.servicio.tendencia(this.fecha(), 30, plataforma),
      ahora: this.enVivo() ? this.servicio.ahora() : of(null),
    }).subscribe({
      next: ({ dia, tendencia, ahora }) => {
        this.dia.set(dia);
        this.tendencia.set(tendencia);
        this.activos.set(ahora);
        this.actualizado.set(Date.now());
        this.cargando.set(false);
        // Los lienzos recién existen cuando el @if deja de mostrar la carga.
        setTimeout(() => this.dibujar());
      },
      error: () => {
        this.error.set('No se pudieron cargar las estadísticas. Probá de nuevo en un rato.');
        this.cargando.set(false);
      },
    });
  }

  /**
   * El refresco en vivo: sin esqueleto de carga ni redibujar, para que no
   * parpadee. Los gráficos se actualizan en el lugar y los valores se deslizan
   * hasta el número nuevo. Si una vuelta falla, se queda con lo último que
   * tenía y lo reintenta en la siguiente.
   */
  refrescar(): void {
    const plataforma = this.filtro() === 'todas' ? undefined : (this.filtro() as Plataforma);
    const conTendencia = ++this.vuelta % VUELTAS_POR_TENDENCIA === 0;

    forkJoin({
      dia: this.servicio.dia(this.fecha(), plataforma),
      ahora: this.servicio.ahora(),
      tendencia: conTendencia ? this.servicio.tendencia(this.fecha(), 30, plataforma) : of(null),
    }).subscribe({
      next: ({ dia, ahora, tendencia }) => {
        this.dia.set(dia);
        this.activos.set(ahora);
        if (tendencia) this.tendencia.set(tendencia);
        this.actualizado.set(Date.now());
        this.actualizarGraficos();
      },
      error: () => undefined,
    });
  }

  // ------------------------------------------------------------ gráficos

  private destruirGraficos(): void {
    [this.graficoHoras, this.graficoReparto, this.graficoTendencia].forEach((g) => g?.destroy());
    this.graficoHoras = this.graficoReparto = this.graficoTendencia = undefined;
  }

  private dibujar(): void {
    this.destruirGraficos();

    const dia = this.dia();
    if (!dia) return;

    const horas = this.lienzoHoras()?.nativeElement;
    const reparto = this.lienzoReparto()?.nativeElement;
    const tendencia = this.lienzoTendencia()?.nativeElement;

    if (horas) this.graficoHoras = new Chart(horas, this.configHoras(dia, horas));
    if (reparto) this.graficoReparto = new Chart(reparto, this.configReparto(dia));
    if (tendencia) this.graficoTendencia = new Chart(tendencia, this.configTendencia(tendencia));
  }

  /** Reemplaza los datos de cada gráfico y le deja a Chart.js la transición. */
  private actualizarGraficos(): void {
    const dia = this.dia();
    const horas = this.lienzoHoras()?.nativeElement;
    const tendencia = this.lienzoTendencia()?.nativeElement;
    if (!dia || !horas || !tendencia || !this.graficoHoras || !this.graficoReparto || !this.graficoTendencia) {
      this.dibujar();
      return;
    }

    const nuevasHoras = this.configHoras(dia, horas).data;
    this.graficoHoras.data.datasets.forEach((serie, i) => {
      serie.data = nuevasHoras.datasets[i].data;
      serie.backgroundColor = nuevasHoras.datasets[i].backgroundColor;
    });
    this.graficoHoras.update();

    const nuevoReparto = this.configReparto(dia).data.datasets[0];
    this.graficoReparto.data.datasets[0].data = nuevoReparto.data;
    this.graficoReparto.data.datasets[0].backgroundColor = nuevoReparto.backgroundColor;
    this.graficoReparto.update();

    const nuevaTendencia = this.configTendencia(tendencia).data;
    this.graficoTendencia.data.labels = nuevaTendencia.labels;
    this.graficoTendencia.data.datasets[0].data = nuevaTendencia.datasets[0].data;
    Object.assign(this.graficoTendencia.data.datasets[0], {
      pointRadius: (nuevaTendencia.datasets[0] as { pointRadius?: unknown }).pointRadius,
    });
    this.graficoTendencia.update();
  }

  private degradado(lienzo: HTMLCanvasElement, arriba: string, abajo: string): CanvasGradient {
    const ctx = lienzo.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, lienzo.clientHeight || 280);
    g.addColorStop(0, arriba);
    g.addColorStop(1, abajo);
    return g;
  }

  private configHoras(dia: ResumenDia, lienzo: HTMLCanvasElement): ChartConfiguration<'bar' | 'line'> {
    const normal = this.degradado(lienzo, 'rgba(0,187,207,0.9)', 'rgba(0,197,121,0.55)');
    const pico = this.degradado(lienzo, '#0891b2', '#059669');

    return {
      type: 'bar',
      data: {
        labels: dia.porHora.map((h) => `${h.hora}h`),
        datasets: [
          {
            type: 'bar',
            label: 'Personas',
            data: dia.porHora.map((h) => h.personas),
            backgroundColor: dia.porHora.map((h) => (h.hora === dia.horaPico ? pico : normal)),
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 26,
            order: 2,
          },
          {
            type: 'line',
            label: 'Sesiones',
            data: dia.porHora.map((h) => h.sesiones),
            borderColor: TINTA,
            backgroundColor: TINTA,
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { usePointStyle: true, boxWidth: 8, color: '#475569', font: { size: 12 } },
          },
          tooltip: this.tooltip(),
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: GRIS, font: { size: 11 }, maxRotation: 0, autoSkip: true } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148,163,184,0.15)' },
            border: { display: false },
            ticks: { color: GRIS, precision: 0, font: { size: 11 } },
          },
        },
      },
    } as ChartConfiguration<'bar' | 'line'>;
  }

  private configReparto(dia: ResumenDia): ChartConfiguration<'doughnut'> {
    const { pwa, web } = dia.porPlataforma;
    const vacio = pwa.personas + web.personas === 0;

    return {
      type: 'doughnut',
      data: {
        labels: ['App instalada', 'Navegador'],
        datasets: [
          {
            data: vacio ? [1] : [pwa.personas, web.personas],
            backgroundColor: vacio ? ['#e2e8f0'] : [VERDE, CELESTE],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: { display: false },
          tooltip: vacio ? { enabled: false } : this.tooltip(),
        },
      },
    };
  }

  private configTendencia(lienzo: HTMLCanvasElement): ChartConfiguration<'line'> {
    const puntos = this.tendencia();
    const relleno = this.degradado(lienzo, 'rgba(0,187,207,0.35)', 'rgba(0,187,207,0)');
    const elegido = this.fecha();

    return {
      type: 'line',
      data: {
        labels: puntos.map((p) => {
          const [, mes, dia] = p.fecha.split('-');
          return `${dia}/${mes}`;
        }),
        datasets: [
          {
            label: 'Personas',
            data: puntos.map((p) => p.personas),
            borderColor: CELESTE,
            backgroundColor: relleno,
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: puntos.map((p) => (p.fecha === elegido ? 5 : 0)),
            pointBackgroundColor: VERDE,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: this.tooltip() },
        scales: {
          x: { grid: { display: false }, ticks: { color: GRIS, font: { size: 11 }, maxTicksLimit: 8, maxRotation: 0 } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148,163,184,0.15)' },
            border: { display: false },
            ticks: { color: GRIS, precision: 0, font: { size: 11 } },
          },
        },
      },
    };
  }

  private tooltip() {
    return {
      backgroundColor: TINTA,
      padding: 12,
      cornerRadius: 10,
      titleFont: { size: 12, weight: 'bold' as const },
      bodyFont: { size: 12 },
      displayColors: true,
      boxPadding: 4,
    };
  }

  // ------------------------------------------------------------ accesos

  accesos = signal<PersonaConAcceso[]>([]);
  dniBuscado = signal('');
  encontrado = signal<PersonaConAcceso | null>(null);
  buscando = signal(false);
  errorAcceso = signal('');
  quitandoDni = signal<string | null>(null);

  cargarAccesos(): void {
    this.servicio.listarAccesos().subscribe({ next: (lista) => this.accesos.set(lista) });
  }

  buscarAsociado(): void {
    const dni = this.dniBuscado().trim();
    if (!/^\d{6,9}$/.test(dni)) {
      this.errorAcceso.set('Ingresá un DNI válido, sólo números.');
      return;
    }
    this.buscando.set(true);
    this.errorAcceso.set('');
    this.encontrado.set(null);

    this.servicio.buscarAsociado(dni).subscribe({
      next: (persona) => {
        this.encontrado.set(persona);
        this.buscando.set(false);
      },
      error: () => {
        this.errorAcceso.set('No hay ningún asociado con ese DNI.');
        this.buscando.set(false);
      },
    });
  }

  confirmarAcceso(): void {
    const persona = this.encontrado();
    if (!persona) return;

    this.servicio.darAcceso(persona.dni).subscribe({
      next: () => {
        this.encontrado.set(null);
        this.dniBuscado.set('');
        this.cargarAccesos();
      },
      error: () => this.errorAcceso.set('No se pudo dar el acceso.'),
    });
  }

  quitarAcceso(dni: string): void {
    this.quitandoDni.set(dni);
    this.servicio.quitarAcceso(dni).subscribe({
      next: () => {
        this.quitandoDni.set(null);
        this.cargarAccesos();
      },
      error: () => this.quitandoDni.set(null),
    });
  }
}
