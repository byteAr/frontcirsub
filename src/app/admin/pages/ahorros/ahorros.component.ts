import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { Ahorro, GestionListasService } from '../../services/gestion-listas.service';

@Component({
  selector: 'app-ahorros-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ahorros.component.html',
  styleUrl: './ahorros.component.css',
})
export default class AhorrosComponent implements OnInit {

  private gestionListasService = inject(GestionListasService);

  cuentas = signal<Ahorro[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  /**
   * El sistema de gestión decide si al socio hay que mostrarle la sección.
   * Si dice que no, no se muestran saldos aunque hayan llegado cuentas.
   */
  habilitado = signal<boolean>(true);

  total = computed(() =>
    // Sumar decimales en punto flotante arrastra basura (115398.42000000001).
    Math.round(this.cuentas().reduce((suma, cuenta) => suma + cuenta.saldo, 0) * 100) / 100
  );

  /** La fecha del movimiento más reciente, que es a cuándo están los saldos. */
  actualizado = computed(() => {
    const fechas = this.cuentas()
      .filter(cuenta => cuenta.fechaIso)
      .sort((a, b) => b.fechaIso!.localeCompare(a.fechaIso!));

    return fechas[0]?.fecha ?? '';
  });

  hayCuentas = computed(() => this.habilitado() && this.cuentas().length > 0);

  ngOnInit(): void {
    // El sidebar ya preguntó al entrar al dashboard para saber si ofrecer la
    // vista, así que acá alcanza con lo cacheado.
    this.pedir(false);
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
      next: ({ ahorros }) => {
        this.cuentas.set(ahorros.cuentas);
        this.habilitado.set(ahorros.muestra);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos obtener sus ahorros. Intente nuevamente en unos minutos.');
        this.cargando.set(false);
      },
    });
  }
}
