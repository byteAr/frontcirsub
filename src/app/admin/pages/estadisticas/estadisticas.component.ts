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
  ResumenPeriodo,
} from '../../services/estadisticas.service';

Chart.register(...registerables);

/** Los colores de la app: el celeste y el verde del degradé del login. */
const CELESTE = '#00BBCF';
const VERDE = '#00C579';
const TINTA = '#0f172a';
const GRIS = '#94a3b8';

type Filtro = Plataforma | 'todas';
type Modo = 'dia' | 'semana';

/**
 * Cada cuánto se refresca mientras se mira algo que incluye hoy. Diez
 * segundos alcanza para que se sienta en vivo y no le pesa a nadie: sólo lo
 * hacen quienes tienen la vista abierta, y se pausa en segundo plano.
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

/** Los nombres tal cual los ve el asociado en el menú. */
const NOMBRES_DE_VISTAS: Record<string, string> = {
  credencial: 'Credencial Virtual',
  beneficios: 'Beneficios',
  reintegros: 'Mis trámites',
  descuentos: 'Mis descuentos',
  ahorros: 'Mis ahorros',
  'ayuda-economica': 'Ayuda económica',
  cbu: 'Actualización de CBU',
  encuesta: 'Encuesta',
  notificaciones: 'Notificaciones',
};

/** Hoy en Argentina, como AAAA-MM-DD, sin depender del reloj del teléfono. */
function hoyArgentina(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** El lunes de la semana de una fecha. Si ya es lunes, la misma fecha. */
export function lunesDe(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  const desdeElLunes = (d.getUTCDay() + 6) % 7; // lunes = 0, domingo = 6
  d.setUTCDate(d.getUTCDate() - desdeElLunes);
  return d.toISOString().slice(0, 10);
}

/** "2026-09-21" → "21/09". */
function corta(fecha: string): string {
  const [, mes, dia] = fecha.split('-');
  return `${dia}/${mes}`;
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
  modo = signal<Modo>('dia');
  fecha = signal(this.hoy);
  filtro = signal<Filtro>('todas');

  cargando = signal(true);
  error = signal('');
  resumen = signal<ResumenPeriodo | null>(null);
  tendencia = signal<PuntoTendencia[]>([]);

  esDueno = signal(false);

  readonly filtros: { valor: Filtro; etiqueta: string }[] = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'pwa', etiqueta: 'App' },
    { valor: 'web', etiqueta: 'Navegador' },
  ];

  /** Lo que se está mirando: un día, o de lunes a hoy. */
  rango = computed(() =>
    this.modo() === 'semana'
      ? { desde: lunesDe(this.hoy), hasta: this.hoy }
      : { desde: this.fecha(), hasta: this.fecha() },
  );

  /** Sólo se mueve lo que incluye hoy; los días que ya pasaron están cerrados. */
  enVivo = computed(() => this.rango().hasta === this.hoy);
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

  /** El rótulo de la tarjeta de personas: "Hoy", "El 24/09" o "Esta semana". */
  cuando = computed(() => {
    if (this.modo() === 'semana') return 'Esta semana';
    return this.fecha() === this.hoy ? 'Hoy' : `El ${corta(this.fecha())}`;
  });

  /** "Del lunes 21/09 a hoy", para aclarar qué cubre la semana. */
  rangoTexto = computed(() => {
    const { desde, hasta } = this.rango();
    return desde === hasta ? '' : `Del lunes ${corta(desde)} a hoy`;
  });

  horaPicoTexto = computed(() => {
    const pico = this.resumen()?.horaPico;
    return pico === null || pico === undefined ? 'Sin actividad' : `${pico} a ${pico + 1} h`;
  });

  personasEnPico = computed(() => {
    const r = this.resumen();
    return r && r.horaPico !== null ? r.porHora[r.horaPico].personas : 0;
  });

  /** Qué parte del total entró por la app instalada. */
  porcentajeApp = computed(() => {
    const r = this.resumen();
    if (!r) return 0;
    const total = r.porPlataforma.pwa + r.porPlataforma.web;
    return total ? Math.round((r.porPlataforma.pwa / total) * 100) : 0;
  });

  /** Las vistas con su nombre de menú, de la más visitada a la menos. */
  vistas = computed(() =>
    (this.resumen()?.vistas ?? []).map((v) => ({
      ...v,
      nombre: NOMBRES_DE_VISTAS[v.vista] ?? v.vista,
    })),
  );

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

  // ------------------------------------------------------------ filtros

  cambiarModo(modo: Modo): void {
    if (modo === this.modo()) return;
    this.modo.set(modo);
    this.cargar();
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

  private plataforma(): Plataforma | undefined {
    return this.filtro() === 'todas' ? undefined : (this.filtro() as Plataforma);
  }

  // ------------------------------------------------------------ datos

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    const { desde, hasta } = this.rango();

    forkJoin({
      resumen: this.servicio.periodo(desde, hasta, this.plataforma()),
      tendencia: this.servicio.tendencia(hasta, 30, this.plataforma()),
      ahora: this.enVivo() ? this.servicio.ahora() : of(null),
    }).subscribe({
      next: ({ resumen, tendencia, ahora }) => {
        this.resumen.set(resumen);
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
    const { desde, hasta } = this.rango();
    const conTendencia = ++this.vuelta % VUELTAS_POR_TENDENCIA === 0;

    forkJoin({
      resumen: this.servicio.periodo(desde, hasta, this.plataforma()),
      ahora: this.servicio.ahora(),
      tendencia: conTendencia ? this.servicio.tendencia(hasta, 30, this.plataforma()) : of(null),
    }).subscribe({
      next: ({ resumen, ahora, tendencia }) => {
        this.resumen.set(resumen);
        this.activos.set(ahora);
        if (tendencia) this.tendencia.set(tendencia);
        this.actualizado.set(Date.now());
        this.actualizarGraficos();
      },
      error: () => undefined,
    });
  }

  /**
   * Mientras la vista está abierta y mirando algo que incluye hoy, se refresca
   * sola. Si la pestaña queda en segundo plano, se pausa; al volver, se pone
   * al día en lugar de esperar al próximo turno.
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

  // ------------------------------------------------------------ gráficos

  private destruirGraficos(): void {
    [this.graficoHoras, this.graficoReparto, this.graficoTendencia].forEach((g) => g?.destroy());
    this.graficoHoras = this.graficoReparto = this.graficoTendencia = undefined;
  }

  private dibujar(): void {
    this.destruirGraficos();

    const resumen = this.resumen();
    if (!resumen) return;

    const horas = this.lienzoHoras()?.nativeElement;
    const reparto = this.lienzoReparto()?.nativeElement;
    const tendencia = this.lienzoTendencia()?.nativeElement;

    if (horas) this.graficoHoras = new Chart(horas, this.configHoras(resumen, horas));
    if (reparto) this.graficoReparto = new Chart(reparto, this.configReparto(resumen));
    if (tendencia) this.graficoTendencia = new Chart(tendencia, this.configTendencia(tendencia));
  }

  /** Reemplaza los datos de cada gráfico y le deja a Chart.js la transición. */
  private actualizarGraficos(): void {
    const resumen = this.resumen();
    const horas = this.lienzoHoras()?.nativeElement;
    const tendencia = this.lienzoTendencia()?.nativeElement;
    if (!resumen || !horas || !tendencia || !this.graficoHoras || !this.graficoReparto || !this.graficoTendencia) {
      this.dibujar();
      return;
    }

    const nuevasHoras = this.configHoras(resumen, horas).data.datasets[0];
    this.graficoHoras.data.datasets[0].data = nuevasHoras.data;
    this.graficoHoras.data.datasets[0].backgroundColor = nuevasHoras.backgroundColor;
    this.graficoHoras.update();

    const nuevoReparto = this.configReparto(resumen).data.datasets[0];
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

  private configHoras(resumen: ResumenPeriodo, lienzo: HTMLCanvasElement): ChartConfiguration<'bar'> {
    const normal = this.degradado(lienzo, 'rgba(0,187,207,0.9)', 'rgba(0,197,121,0.55)');
    const pico = this.degradado(lienzo, '#0891b2', '#059669');

    return {
      type: 'bar',
      data: {
        labels: resumen.porHora.map((h) => `${h.hora}h`),
        datasets: [
          {
            label: 'Personas',
            data: resumen.porHora.map((h) => h.personas),
            backgroundColor: resumen.porHora.map((h) => (h.hora === resumen.horaPico ? pico : normal)),
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 26,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: this.tooltip() },
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
    };
  }

  private configReparto(resumen: ResumenPeriodo): ChartConfiguration<'doughnut'> {
    const { pwa, web } = resumen.porPlataforma;
    const vacio = pwa + web === 0;

    return {
      type: 'doughnut',
      data: {
        labels: ['App instalada', 'Navegador'],
        datasets: [
          {
            data: vacio ? [1] : [pwa, web],
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
    const { desde, hasta } = this.rango();

    return {
      type: 'line',
      data: {
        labels: puntos.map((p) => corta(p.fecha)),
        datasets: [
          {
            label: 'Personas',
            data: puntos.map((p) => p.personas),
            borderColor: CELESTE,
            backgroundColor: relleno,
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            // Se marcan los días que se están mirando: uno, o de lunes a hoy.
            pointRadius: puntos.map((p) => (p.fecha >= desde && p.fecha <= hasta ? 5 : 0)),
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
