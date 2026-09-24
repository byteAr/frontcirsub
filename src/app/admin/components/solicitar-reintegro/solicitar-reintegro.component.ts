import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { ImagenService } from '../../../shared/services/imagen.service';
import { BotonAdherirmeComponent } from '../boton-adherirme/boton-adherirme.component';
import { NOMBRE_BENEFICIO } from '../../constants/beneficios';
import { GestionListasService, TipoTramite } from '../../services/gestion-listas.service';
import { ReintegrosService } from '../../services/reintegros.service';

const EXTENSIONES_PERMITIDAS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
const MAX_ARCHIVOS = 10;
const MAX_TAMANIO = 10 * 1024 * 1024; // 10MB

@Component({
  selector: 'app-solicitar-reintegro',
  imports: [CommonModule, BotonAdherirmeComponent],
  templateUrl: './solicitar-reintegro.component.html',
  styleUrl: './solicitar-reintegro.component.css'
})
export class SolicitarReintegroComponent implements OnDestroy {

  @ViewChild('modalForm') modalForm!: ElementRef<HTMLDialogElement>;
  @ViewChild('modalResultado') modalResultado!: ElementRef<HTMLDialogElement>;
  @ViewChild('modalAdhesion') modalAdhesion!: ElementRef<HTMLDialogElement>;
  @ViewChild('inputArchivos') inputArchivos!: ElementRef<HTMLInputElement>;
  @ViewChild('inputCamara') inputCamara!: ElementRef<HTMLInputElement>;

  private reintegrosService = inject(ReintegrosService);
  private gestionListasService = inject(GestionListasService);
  private authService = inject(AuthService);
  private imagenService = inject(ImagenService);

  /**
   * Todos los tipos de trámite, tenga o no el beneficio que exigen: así el
   * socio ve lo que existe, y si elige uno al que no está adherido se le
   * explica por qué no puede y cómo adherirse. Salen de api-list_tramite.php:
   * la lista la maneja gestión, no el front. La clave (RM, RN, TE...) va como
   * prefijo del archivo en disco y es con lo que el sistema de gestión
   * clasifica lo que sube el socio.
   */
  tipos = signal<TipoTramite[]>([]);
  tipoSeleccionado = signal<string>('');
  cargandoTipos = signal<boolean>(false);
  errorTipos = signal<boolean>(false);

  /** El trámite que eligió sin estar adherido al beneficio que exige. */
  tramiteSinAdhesion = signal<TipoTramite | null>(null);

  nombreBeneficioFaltante = computed(() => {
    const beneficio = this.tramiteSinAdhesion()?.beneficio;
    return beneficio ? NOMBRE_BENEFICIO[beneficio] : '';
  });

  /** Beneficios contratados, como los devuelve sp_Perfil_completo_detallado. */
  private beneficios = computed(() => {
    const contratados = this.authService.user()?.Beneficios ?? [];

    return {
      far: contratados.some(b => b.far === true),
      eva: contratados.some(b => b.eva === true),
      sep: contratados.some(b => b.sep === true),
      seg: contratados.some(b => b.seg === true),
    };
  });

  archivos = signal<File[]>([]);
  enviando = signal<boolean>(false);
  /** Verdadero mientras se achican las fotos recién elegidas. */
  procesando = signal<boolean>(false);
  errorValidacion = signal<string | null>(null);

  resultado = signal<'exito' | 'error' | null>(null);
  mensajeResultado = signal<string>('');

  extensionesPermitidas = EXTENSIONES_PERMITIDAS.join(',');

  /** Se guarda para poder abortar la subida si el socio cancela. */
  private subidaEnCurso?: Subscription;

  /** Evita que el cierre automático tras un error borre los archivos elegidos. */
  private conservarArchivosAlCerrar = false;

  ngOnDestroy(): void {
    this.subidaEnCurso?.unsubscribe();
  }

  abrirFormulario() {
    this.cargarTipos();
    this.modalForm.nativeElement.showModal();
  }

  /**
   * Trae los tipos de trámite, todos. Arranca seleccionado el primero que el
   * socio puede pedir, para que el formulario nunca abra con un trámite que
   * le va a saltar el aviso de "no adherido" sin haber tocado nada.
   */
  cargarTipos() {
    if (this.tipos().length) return; // ya cargados en una apertura anterior

    this.cargandoTipos.set(true);
    this.errorTipos.set(false);

    this.gestionListasService.getListas().subscribe({
      next: ({ tipos }) => {
        this.tipos.set(tipos);
        this.cargandoTipos.set(false);
        this.errorTipos.set(tipos.length === 0);

        const permitidos = tipos.filter(tipo => this.puedePedir(tipo));
        if (!permitidos.some(tipo => tipo.clave === this.tipoSeleccionado())) {
          this.tipoSeleccionado.set(permitidos[0]?.clave ?? '');
        }
      },
      error: () => {
        this.cargandoTipos.set(false);
        this.errorTipos.set(true);
      }
    });
  }

  private puedePedir(tipo: TipoTramite): boolean {
    if (!tipo.beneficio) return true;

    return this.beneficios()[tipo.beneficio];
  }

  /**
   * Cancelar tiene que funcionar siempre, incluso con una subida en curso:
   * si no, una conexión que se cuelga deja al socio encerrado en el modal.
   */
  cerrarFormulario() {
    this.modalForm.nativeElement.close();
  }

  /**
   * Corre para cualquier cierre del formulario, sea por el botón o por Escape.
   * Aborta la subida si quedó una en curso: mientras el modal no esté a la
   * vista, no hay forma de avisarle el resultado al socio.
   */
  onFormularioCerrado() {
    this.subidaEnCurso?.unsubscribe();
    this.subidaEnCurso = undefined;
    this.enviando.set(false);

    if (!this.conservarArchivosAlCerrar) this.limpiar();
  }

  seleccionarTipo(event: Event) {
    const selector = event.target as HTMLSelectElement;
    const tipo = this.tipos().find(t => t.clave === selector.value);

    if (tipo && !this.puedePedir(tipo)) {
      // El selector vuelve a lo que estaba: si quedara marcado, el socio
      // cargaría los documentos y recién al enviar se enteraría del rechazo.
      selector.value = this.tipoSeleccionado();
      this.avisarNoAdherido(tipo);
      return;
    }

    this.tipoSeleccionado.set(selector.value);
  }

  /**
   * Se abre encima del formulario, sin cerrarlo: al volver, el socio sigue
   * con lo que tenía cargado.
   */
  private avisarNoAdherido(tipo: TipoTramite) {
    this.tramiteSinAdhesion.set(tipo);
    this.modalAdhesion.nativeElement.showModal();
  }

  cerrarAvisoAdhesion() {
    this.modalAdhesion.nativeElement.close();
  }

  onArchivosSeleccionados(event: Event) {
    const input = event.target as HTMLInputElement;
    this.agregarArchivos(Array.from(input.files ?? []));
    input.value = ''; // permite volver a elegir el mismo archivo
  }

  onFotoTomada(event: Event) {
    const input = event.target as HTMLInputElement;
    const foto = input.files?.[0];
    input.value = '';

    if (!foto) return;

    // La cámara suele devolver un nombre genérico: le damos uno identificable.
    // Se numera FOTO1, FOTO2... y no "receta" porque el tipo de documento ya
    // va en el prefijo del archivo, y no siempre va a ser una receta.
    // El backend le agrega el timestamp que garantiza que no se repita en disco.
    const extension = foto.type === 'image/png' ? '.png' : '.jpg';
    const numero = this.archivos().filter(a => a.name.startsWith('FOTO')).length + 1;
    const renombrada = new File([foto], `FOTO${numero}${extension}`, {
      type: foto.type === 'image/png' ? 'image/png' : 'image/jpeg'
    });

    this.agregarArchivos([renombrada]);
  }

  quitarArchivo(indice: number) {
    this.archivos.update(actuales => actuales.filter((_, i) => i !== indice));
    this.errorValidacion.set(null);
  }

  enviar() {
    if (this.enviando() || !this.archivos().length || !this.tipoSeleccionado()) return;

    // Red de contención: el selector ya no deja elegir un trámite sin
    // adhesión, pero si por algún camino quedara uno, se avisa en vez de
    // mandar documentos que el backend va a rechazar con 403.
    const tipo = this.tipos().find(t => t.clave === this.tipoSeleccionado());
    if (tipo && !this.puedePedir(tipo)) {
      this.avisarNoAdherido(tipo);
      return;
    }

    this.enviando.set(true);
    this.errorValidacion.set(null);

    this.subidaEnCurso = this.reintegrosService.subirDocumentos(this.tipoSeleccionado(), this.archivos())
      .subscribe({
        next: resp => {
          this.enviando.set(false);
          this.subidaEnCurso = undefined;
          const cantidad = resp?.archivos?.length ?? this.archivos().length;
          this.mostrarResultado(
            'exito',
            cantidad === 1
              ? 'Su documento se cargó correctamente. En breve procesaremos su solicitud de reintegro.'
              : `Se cargaron ${cantidad} documentos correctamente. En breve procesaremos su solicitud de reintegro.`
          );
        },
        error: error => {
          this.enviando.set(false);
          this.subidaEnCurso = undefined;
          this.mostrarResultado('error', this.mensajeDeError(error));
        }
      });
  }

  cerrarResultado() {
    this.modalResultado.nativeElement.close();
    if (this.resultado() === 'error') {
      this.modalForm.nativeElement.showModal(); // vuelve al formulario para reintentar
    }
  }

  /** Traduce el error a algo que el socio pueda entender y accionar. */
  private mensajeDeError(error: any): string {
    if (error?.name === 'TimeoutError') {
      return 'La carga está tardando demasiado. Revise su conexión e intente de nuevo, preferentemente con wifi.';
    }

    if (error?.status === 413) {
      return 'El documento es demasiado grande para enviarlo. Pruebe con una foto de menor resolución.';
    }

    if (error?.status === 401) {
      return 'Su sesión expiró. Vuelva a iniciar sesión e intente nuevamente.';
    }

    if (error?.status === 403) {
      return 'No figura como habilitado en este beneficio. Comuníquese por whatsapp al 11-58558733.';
    }

    if (error?.status === 0) {
      return 'No pudimos conectarnos con el servidor. Verifique su conexión a internet.';
    }

    const mensaje = error?.error?.message;
    if (Array.isArray(mensaje)) return mensaje.join('. ');
    if (mensaje) return mensaje;

    return 'No pudimos cargar los documentos. Intente nuevamente en unos minutos.';
  }

  tamanioLegible(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private async agregarArchivos(nuevos: File[]) {
    if (!nuevos.length) return;

    const aceptados: File[] = [];
    let error: string | null = null;

    this.procesando.set(true);

    try {
      for (const original of nuevos) {
        const extension = original.name.slice(original.name.lastIndexOf('.')).toLowerCase();

        if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
          error = `"${original.name}" no es un formato válido (PDF, Word, PNG o JPG).`;
          continue;
        }

        // Las fotos se achican acá y no al enviar, así el socio ve en la lista
        // el peso real de lo que va a subir. Los PDF y Word pasan de largo.
        const archivo = await this.imagenService.comprimir(original);

        if (archivo.size > MAX_TAMANIO) {
          error = `"${original.name}" supera los 10 MB permitidos.`;
          continue;
        }

        aceptados.push(archivo);
      }
    } finally {
      this.procesando.set(false);
    }

    this.archivos.update(actuales => {
      const total = [...actuales, ...aceptados];
      if (total.length > MAX_ARCHIVOS) {
        error = `Puede adjuntar hasta ${MAX_ARCHIVOS} documentos por solicitud.`;
        return total.slice(0, MAX_ARCHIVOS);
      }
      return total;
    });

    this.errorValidacion.set(error);
  }

  private mostrarResultado(estado: 'exito' | 'error', mensaje: string) {
    this.resultado.set(estado);
    this.mensajeResultado.set(mensaje);

    // Este cierre dispara onFormularioCerrado(); en caso de error hay que
    // conservar los archivos para que "Reintentar" no arranque de cero.
    this.conservarArchivosAlCerrar = estado === 'error';
    this.modalForm.nativeElement.close();
    this.conservarArchivosAlCerrar = false;

    if (estado === 'exito') this.limpiar();

    this.modalResultado.nativeElement.showModal();
  }

  private limpiar() {
    this.archivos.set([]);
    this.errorValidacion.set(null);
  }
}
