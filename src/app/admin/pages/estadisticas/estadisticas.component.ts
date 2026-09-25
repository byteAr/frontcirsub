import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';

import {
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

  private readonly lienzoHoras = viewChild<ElementRef<HTMLCanvasElement>>('graficoHoras');
  private readonly lienzoReparto = viewChild<ElementRef<HTMLCanvasElement>>('graficoReparto');
  private readonly lienzoTendencia = viewChild<ElementRef<HTMLCanvasElement>>('graficoTendencia');

  private graficos: Chart[] = [];

  readonly hoy = hoyArgentina();
  fecha = signal(this.hoy);
  filtro = signal<Filtro>('todas');

  cargando = signal(true);
  error = signal('');
  dia = signal<ResumenDia | null>(null);
  tendencia = signal<PuntoTendencia[]>([]);

  esDueno = signal(false);

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
  }

  ngOnDestroy(): void {
    this.graficos.forEach((g) => g.destroy());
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
    }).subscribe({
      next: ({ dia, tendencia }) => {
        this.dia.set(dia);
        this.tendencia.set(tendencia);
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

  // ------------------------------------------------------------ gráficos

  private dibujar(): void {
    this.graficos.forEach((g) => g.destroy());
    this.graficos = [];

    const dia = this.dia();
    if (!dia) return;

    const horas = this.lienzoHoras()?.nativeElement;
    const reparto = this.lienzoReparto()?.nativeElement;
    const tendencia = this.lienzoTendencia()?.nativeElement;

    if (horas) this.graficos.push(new Chart(horas, this.configHoras(dia, horas)));
    if (reparto) this.graficos.push(new Chart(reparto, this.configReparto(dia)));
    if (tendencia) this.graficos.push(new Chart(tendencia, this.configTendencia(tendencia)));
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
