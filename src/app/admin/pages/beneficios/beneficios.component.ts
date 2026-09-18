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
   * es verde: el verde queda reservado para "Adherido".
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
 * Orden base. En pantalla van primero los adheridos y después los que no,
 * pero dentro de cada grupo se respeta este orden, así dos socios con los
 * mismos beneficios los ven siempre igual.
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
    // Violeta y no gris: el gris es el color de "no adherido", y un sepelio
    // adherido en pizarra se confundía con uno que no lo está. El violeta
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

    const lista = BENEFICIOS.map(definicion => ({
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

    // Primero lo que ya tiene, después lo que puede sumar. Se arman los dos
    // grupos por separado en vez de ordenar, para que cada uno conserve el
    // orden base sin depender de que el sort sea estable.
    return [
      ...lista.filter(beneficio => beneficio.contratado),
      ...lista.filter(beneficio => !beneficio.contratado),
    ];
  });

  cantidadContratados = computed(() => this.beneficios().filter(b => b.contratado).length);

  total = BENEFICIOS.length;

  resumen = computed(() => {
    const cantidad = this.cantidadContratados();

    if (cantidad === 0) return 'Todavía no está adherido a ningún beneficio';
    if (cantidad === this.total) return 'Está adherido a todos los beneficios';

    return `Está adherido a ${cantidad} de ${this.total} beneficios`;
  });

  /**
   * El mensaje ya nombra el beneficio: así quien atiende sabe de entrada qué
   * quiere contratar el socio, en vez del texto genérico de antes.
   */
  private whatsapp(numero: string, mensaje: string): string {
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  }
}
