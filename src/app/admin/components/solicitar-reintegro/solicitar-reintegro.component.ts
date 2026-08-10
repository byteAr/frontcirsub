import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
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
export class SolicitarReintegroComponent {

  @ViewChild('modalForm') modalForm!: ElementRef<HTMLDialogElement>;
  @ViewChild('modalResultado') modalResultado!: ElementRef<HTMLDialogElement>;
  @ViewChild('inputArchivos') inputArchivos!: ElementRef<HTMLInputElement>;
  @ViewChild('inputCamara') inputCamara!: ElementRef<HTMLInputElement>;

  private reintegrosService = inject(ReintegrosService);

  // Por ahora sólo existe "Receta Médica" (RM), el backend expone el resto cuando se agreguen.
  tipos = signal<TipoDocumentoReintegro[]>([{ codigo: 'RM', descripcion: 'Receta Médica' }]);
  tipoSeleccionado = signal<string>('RM');

  archivos = signal<File[]>([]);
  enviando = signal<boolean>(false);
  errorValidacion = signal<string | null>(null);

  resultado = signal<'exito' | 'error' | null>(null);
  mensajeResultado = signal<string>('');

  extensionesPermitidas = EXTENSIONES_PERMITIDAS.join(',');

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

  cerrarFormulario() {
    this.modalForm.nativeElement.close();
    this.limpiar();
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

    this.reintegrosService.subirDocumentos(this.tipoSeleccionado(), this.archivos())
      .subscribe({
        next: resp => {
          this.enviando.set(false);
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
          const mensaje = error?.error?.message;
          this.mostrarResultado(
            'error',
            Array.isArray(mensaje)
              ? mensaje.join('. ')
              : mensaje || 'No pudimos cargar los documentos. Intente nuevamente en unos minutos.'
          );
        }
      });
  }

  cerrarResultado() {
    this.modalResultado.nativeElement.close();
    if (this.resultado() === 'error') {
      this.modalForm.nativeElement.showModal(); // vuelve al formulario para reintentar
    }
  }

  tamanioLegible(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private agregarArchivos(nuevos: File[]) {
    if (!nuevos.length) return;

    const aceptados: File[] = [];
    let error: string | null = null;

    for (const archivo of nuevos) {
      const extension = archivo.name.slice(archivo.name.lastIndexOf('.')).toLowerCase();

      if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
        error = `"${archivo.name}" no es un formato válido (PDF, Word, PNG o JPG).`;
        continue;
      }

      if (archivo.size > MAX_TAMANIO) {
        error = `"${archivo.name}" supera los 10 MB permitidos.`;
        continue;
      }

      aceptados.push(archivo);
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
    this.modalForm.nativeElement.close();

    if (estado === 'exito') this.limpiar();

    this.modalResultado.nativeElement.showModal();
  }

  private limpiar() {
    this.archivos.set([]);
    this.errorValidacion.set(null);
  }
}
