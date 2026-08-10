import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ImagenService } from '../../../shared/services/imagen.service';
import { ReintegrosService, TipoDocumentoReintegro } from '../../services/reintegros.service';

const EXTENSIONES_PERMITIDAS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
const MAX_ARCHIVOS = 10;
const MAX_TAMANIO = 10 * 1024 * 1024; // 10MB

@Component({
  selector: 'app-solicitar-reintegro',
  imports: [CommonModule],
  templateUrl: './solicitar-reintegro.component.html',
  styleUrl: './solicitar-reintegro.component.css'
})
export class SolicitarReintegroComponent implements OnDestroy {

  @ViewChild('modalForm') modalForm!: ElementRef<HTMLDialogElement>;
  @ViewChild('modalResultado') modalResultado!: ElementRef<HTMLDialogElement>;
  @ViewChild('inputArchivos') inputArchivos!: ElementRef<HTMLInputElement>;
  @ViewChild('inputCamara') inputCamara!: ElementRef<HTMLInputElement>;

  private reintegrosService = inject(ReintegrosService);
  private imagenService = inject(ImagenService);

  // Por ahora sólo existe "Receta Médica" (RM), el backend expone el resto cuando se agreguen.
  tipos = signal<TipoDocumentoReintegro[]>([{ codigo: 'RM', descripcion: 'Receta Médica' }]);
  tipoSeleccionado = signal<string>('RM');

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
    this.reintegrosService.getTiposDocumento().subscribe({
      next: tipos => {
        if (tipos?.length) {
          this.tipos.set(tipos);
          if (!tipos.some(t => t.codigo === this.tipoSeleccionado())) {
            this.tipoSeleccionado.set(tipos[0].codigo);
          }
        }
      },
      error: () => {} // si falla, se usa el tipo por defecto
    });

    this.modalForm.nativeElement.showModal();
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
    this.tipoSeleccionado.set((event.target as HTMLSelectElement).value);
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
    // El backend le agrega el timestamp que garantiza que no se repita en disco.
    const extension = foto.type === 'image/png' ? '.png' : '.jpg';
    const numero = this.archivos().filter(a => a.name.startsWith('receta-')).length + 1;
    const renombrada = new File([foto], `receta-${numero}${extension}`, {
      type: foto.type === 'image/png' ? 'image/png' : 'image/jpeg'
    });

    this.agregarArchivos([renombrada]);
  }

  quitarArchivo(indice: number) {
    this.archivos.update(actuales => actuales.filter((_, i) => i !== indice));
    this.errorValidacion.set(null);
  }

  enviar() {
    if (this.enviando() || !this.archivos().length) return;

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
