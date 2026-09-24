import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { AyudaEconomica, GestionListasService } from '../../services/gestion-listas.service';

@Component({
  selector: 'app-ayuda-economica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ayuda-economica.component.html',
  styleUrl: './ayuda-economica.component.css',
})
export default class AyudaEconomicaComponent implements OnInit {

  private gestionListasService = inject(GestionListasService);

  solicitudes = signal<AyudaEconomica[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  /** El sistema de gestión decide si al socio se le muestra la sección. */
  habilitado = signal<boolean>(true);

  /** Solicitudes con el plan de pagos abierto, por número de solicitud. */
  private desplegadas = signal<Set<string>>(new Set<string>());

  hayDatos = computed(() => this.habilitado() && this.solicitudes().length > 0);

  enCurso = computed(() => this.solicitudes().filter(s => s.enCurso));

  /** Lo que el socio debe hoy, sumando todas las ayudas que sigue pagando. */
  saldoTotal = computed(() =>
    // Sumar decimales en punto flotante arrastra basura (385986.42000000004).
    Math.round(this.enCurso().reduce((total, s) => total + s.saldo, 0) * 100) / 100
  );

  ngOnInit(): void {
    this.pedir(false);
  }

  /** Reintentar sí descarta lo cacheado: si falló, no hay nada que reusar. */
  cargar(): void {
    this.pedir(true);
  }

  estaDesplegada(solicitud: AyudaEconomica): boolean {
    return this.desplegadas().has(solicitud.numeroSolicitud);
  }

  alternarDespliegue(solicitud: AyudaEconomica): void {
    this.desplegadas.update(actuales => {
      const proximas = new Set(actuales);
      proximas.has(solicitud.numeroSolicitud)
        ? proximas.delete(solicitud.numeroSolicitud)
        : proximas.add(solicitud.numeroSolicitud);
      return proximas;
    });
  }

  /** Qué parte del préstamo ya pagó, de 0 a 100. */
  progreso(solicitud: AyudaEconomica): number {
    if (!solicitud.plazos) return 0;
    return (solicitud.cuotasPagadas / solicitud.plazos) * 100;
  }

  private pedir(descartarCache: boolean): void {
    this.cargando.set(true);
    this.error.set(null);

    const listas$ = descartarCache
      ? this.gestionListasService.recargar()
      : this.gestionListasService.getListas();

    listas$.subscribe({
      next: ({ ayudasEconomicas }) => {
        this.solicitudes.set(ayudasEconomicas.solicitudes);
        this.habilitado.set(ayudasEconomicas.muestra);
        this.desplegadas.set(new Set<string>());
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos obtener sus ayudas económicas. Intente nuevamente en unos minutos.');
        this.cargando.set(false);
      },
    });
  }
}
