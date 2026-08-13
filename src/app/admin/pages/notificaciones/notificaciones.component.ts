import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { AuthService } from '../../../auth/services/auth.service';
import { AdminNotifService } from '../../../shared/services/admin-notif.service';

export type TipoNotificacion = 'oficial' | 'servicio';

export interface Notificacion {
  tipo: TipoNotificacion;
  de: string;
  asunto: string;
  mensaje: string;
  /** dd/mm/aa, tal como se muestra. */
  fecha: string;
  /** Para ordenar. Null cuando la fecha no se pudo interpretar. */
  fechaOrden: number | null;
}

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css'
})
export default class NotificacionesComponent implements OnInit {

  private authService = inject(AuthService);
  private adminNotifService = inject(AdminNotifService);

  todas = signal<Notificacion[]>([]);
  cargando = signal<boolean>(true);

  /** null = sin filtro, se muestran todas. */
  filtro = signal<TipoNotificacion | null>(null);

  notificaciones = computed(() => {
    const filtro = this.filtro();
    const lista = filtro ? this.todas().filter(n => n.tipo === filtro) : this.todas();

    // Más recientes arriba. Las que no tienen fecha interpretable van al final.
    return [...lista].sort((a, b) => {
      if (a.fechaOrden === b.fechaOrden) return 0;
      if (a.fechaOrden === null) return 1;
      if (b.fechaOrden === null) return -1;
      return b.fechaOrden - a.fechaOrden;
    });
  });

  seleccionada = signal<Notificacion | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  alternarFiltro(tipo: TipoNotificacion): void {
    this.filtro.update(actual => (actual === tipo ? null : tipo));
  }

  abrir(notificacion: Notificacion): void {
    this.seleccionada.set(notificacion);
  }

  cerrar(): void {
    this.seleccionada.set(null);
  }

  private cargar(): void {
    const persona = this.authService.user()?.Persona?.[0];
    const apellido = persona?.Apellido ?? '';
    const userId = persona?.Id;

    // Mensajes fijos que hoy están escritos en el código. Cuando exista el
    // servicio de notificaciones, estos dos salen y entran por la misma vía
    // que el resto.
    const oficiales: Notificacion[] = [
      {
        tipo: 'oficial',
        de: 'Comisión Directiva',
        asunto: 'Bienvenida',
        mensaje: `Estimado socio, es un honor contar con su pertenencia a nuestra institución. A partir de hoy, ponemos a su disposición una nueva herramienta: la credencial digital. Con ella podremos mantener una comunicación permanente con usted y avanzar hacia una administración más transparente, ágil y cercana. ¡Gracias por acompañarnos en este nuevo paso!`,
        fecha: '06/03/26',
        fechaOrden: this.aOrden('06/03/26')
      }
    ];

    const bienvenidaServicio: Notificacion = {
      tipo: 'servicio',
      de: 'Departamento Afiliaciones',
      asunto: 'Bienvenida',
      mensaje: `Estimado/a Socio/a ${apellido}, tenemos el gusto de registrarlo en la credencial digital, herramienta por medio de la cual les haremos llegar la información actualizada de nuestra MUTUAL y de esta forma lograr una comunicación permanente con usted, que es lo más importante para la mutual.`,
      fecha: '06/03/26',
      fechaOrden: this.aOrden('06/03/26')
    };

    if (!userId) {
      this.todas.set([...oficiales, bienvenidaServicio]);
      this.cargando.set(false);
      return;
    }

    this.adminNotifService.getMessages(userId).subscribe({
      next: ({ messages }) => {
        const deServicio: Notificacion[] = (messages ?? []).map(m => ({
          tipo: 'servicio' as const,
          de: 'Departamento Afiliaciones',
          asunto: m.titulo,
          mensaje: m.cuerpo,
          fecha: new Date(m.fecha).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }),
          fechaOrden: new Date(m.fecha).getTime() || null
        }));

        this.todas.set([...oficiales, ...deServicio, bienvenidaServicio]);
        this.cargando.set(false);

        // Entrar a la vista cuenta como leerlas.
        this.adminNotifService.markRead(userId).subscribe({
          next: () => this.adminNotifService.unreadCount.set(0),
          error: () => {}
        });
      },
      error: () => {
        this.todas.set([...oficiales, bienvenidaServicio]);
        this.cargando.set(false);
      }
    });
  }

  /** dd/mm/aa -> milisegundos, para poder ordenar mezclando ambos orígenes. */
  private aOrden(fecha: string): number | null {
    const match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(fecha.trim());
    if (!match) return null;

    const [, dd, mm, aa] = match;
    return new Date(2000 + Number(aa), Number(mm) - 1, Number(dd)).getTime();
  }
}
