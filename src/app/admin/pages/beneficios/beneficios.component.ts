import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { AuthService } from '../../../auth/services/auth.service';

/** Claves tal como vienen en userData.Beneficios de sp_Perfil_completo_detallado. */
type ClaveBeneficio = 'far' | 'eva' | 'sep' | 'seg';

type Icono = 'farmacia' | 'evacuacion' | 'sepelio' | 'vida';

interface DefinicionBeneficio {
  clave: ClaveBeneficio;
  nombre: string;
  descripcion: string;
  icono: Icono;
  /**
   * Color propio del beneficio, para que se distingan de un vistazo. Ninguno
   * es verde: el verde queda reservado para "Contratado".
   */
  tono: {
    fondo: string;
    icono: string;
    segmento: string;
  };
  /** WhatsApp de consultas para quien ya lo tiene, si el área tiene uno. */
  consultas?: string;
}

export interface BeneficioVista extends DefinicionBeneficio {
  contratado: boolean;
  enlaceAdhesion: string;
  enlaceConsultas: string | null;
}

/** Número de adhesiones. Es el mismo que usaba el botón "Adherirme" de antes. */
const WHATSAPP_ADHESIONES = '5491126526532';

/**
 * El orden es fijo a propósito, contratado o no: el socio encuentra cada
 * beneficio siempre en el mismo lugar.
 */
const BENEFICIOS: DefinicionBeneficio[] = [
  {
    clave: 'far',
    nombre: 'Farmacia',
    descripcion: 'Reintegro de gastos de medicamentos.',
    icono: 'farmacia',
    tono: { fondo: 'bg-cyan-50', icono: 'text-cyan-600', segmento: 'bg-cyan-500' },
    consultas: '5491158558733',
  },
  {
    clave: 'eva',
    nombre: 'Evacuaciones',
    descripcion: 'Alojamiento en caso de evacuación.',
    icono: 'evacuacion',
    tono: { fondo: 'bg-amber-50', icono: 'text-amber-600', segmento: 'bg-amber-500' },
    consultas: '5491132705301',
  },
  {
    clave: 'sep',
    nombre: 'Seguro de sepelio',
    descripcion: 'Cobertura del servicio de sepelio.',
    icono: 'sepelio',
    // Violeta y no gris: el gris es el color de "no contratado", y un sepelio
    // contratado en pizarra se confundía con uno que no lo está. El violeta
    // es el color tradicional del duelo, así que sigue siendo sobrio.
    tono: { fondo: 'bg-violet-50', icono: 'text-violet-600', segmento: 'bg-violet-500' },
  },
  {
    clave: 'seg',
    nombre: 'Seguro de vida',
    descripcion: 'Cobertura de seguro de vida.',
    icono: 'vida',
    tono: { fondo: 'bg-rose-50', icono: 'text-rose-600', segmento: 'bg-rose-500' },
  },
];

@Component({
  selector: 'app-beneficios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './beneficios.component.html',
  styleUrl: './beneficios.component.css',
})
export default class BeneficiosComponent {

  private authService = inject(AuthService);

  constructor() {
    // Mismo resguardo que tenían las vistas viejas: si se entra directo por la
    // URL, el perfil puede no estar cargado todavía. La llamada está cacheada.
    this.authService.checkStatus().subscribe();
  }

  /** Mientras no llegue el perfil no se sabe qué tiene contratado. */
  cargando = computed(() => this.authService.user() === null);

  beneficios = computed<BeneficioVista[]>(() => {
    const contratados = this.authService.user()?.Beneficios ?? [];

    return BENEFICIOS.map(definicion => ({
      ...definicion,
      contratado: contratados.some(b => b[definicion.clave] === true),
      enlaceAdhesion: this.whatsapp(
        WHATSAPP_ADHESIONES,
        `Hola, quiero adherirme al beneficio de ${definicion.nombre}.`,
      ),
      enlaceConsultas: definicion.consultas
        ? this.whatsapp(
            definicion.consultas,
            `Hola, quiero hacer una consulta sobre el beneficio de ${definicion.nombre}.`,
          )
        : null,
    }));
  });

  cantidadContratados = computed(() => this.beneficios().filter(b => b.contratado).length);

  total = BENEFICIOS.length;

  resumen = computed(() => {
    const cantidad = this.cantidadContratados();

    if (cantidad === 0) return 'Todavía no tiene beneficios contratados';
    if (cantidad === this.total) return 'Tiene todos los beneficios contratados';

    return `Tiene ${cantidad} de ${this.total} beneficios contratados`;
  });

  /**
   * El mensaje ya nombra el beneficio: así quien atiende sabe de entrada qué
   * quiere contratar el socio, en vez del texto genérico de antes.
   */
  private whatsapp(numero: string, mensaje: string): string {
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  }
}
