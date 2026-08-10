import { Injectable } from '@angular/core';

/** Lado mayor al que se reduce la imagen. Una receta sigue siendo legible. */
const LADO_MAXIMO = 1600;

/** Calidad del JPEG resultante. */
const CALIDAD = 0.8;

/** Por debajo de esto no vale la pena recomprimir. */
const TAMANIO_MINIMO_PARA_COMPRIMIR = 800 * 1024;

const TIPOS_COMPRIMIBLES = ['image/jpeg', 'image/jpg', 'image/png'];

@Injectable({
  providedIn: 'root'
})
export class ImagenService {

  esComprimible(archivo: File): boolean {
    return TIPOS_COMPRIMIBLES.includes(archivo.type);
  }

  /**
   * Reduce una foto para que viaje liviana por datos móviles.
   *
   * Nunca lanza: ante cualquier problema devuelve el archivo original, porque
   * es preferible una subida pesada a que el socio no pueda enviar la receta.
   * También devuelve el original si comprimir no achica nada.
   */
  async comprimir(archivo: File): Promise<File> {
    if (!this.esComprimible(archivo)) return archivo;
    if (archivo.size <= TAMANIO_MINIMO_PARA_COMPRIMIR) return archivo;

    try {
      const bitmap = await this.decodificar(archivo);
      const { width, height } = this.escalar(bitmap.width, bitmap.height);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const contexto = canvas.getContext('2d');
      if (!contexto) return archivo;

      // Fondo blanco: si el original es un PNG con transparencia, al pasarlo a
      // JPEG las zonas transparentes saldrían negras.
      contexto.fillStyle = '#ffffff';
      contexto.fillRect(0, 0, width, height);
      contexto.drawImage(bitmap, 0, 0, width, height);

      if ('close' in bitmap) bitmap.close();

      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', CALIDAD)
      );

      if (!blob || blob.size >= archivo.size) return archivo;

      return new File([blob], this.nombreJpg(archivo.name), { type: 'image/jpeg' });
    } catch {
      return archivo;
    }
  }

  /**
   * createImageBitmap con from-image respeta la orientación EXIF; sin eso las
   * fotos sacadas de costado se guardarían rotadas. Si el navegador no lo
   * soporta, se cae a <img>, que en los navegadores actuales ya viene
   * orientado.
   */
  private async decodificar(archivo: File): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(archivo, { imageOrientation: 'from-image' });
      } catch {
        // sigue con el fallback
      }
    }

    const url = URL.createObjectURL(archivo);
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('No se pudo leer la imagen'));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private escalar(ancho: number, alto: number): { width: number; height: number } {
    const ladoMayor = Math.max(ancho, alto);
    if (ladoMayor <= LADO_MAXIMO) return { width: ancho, height: alto };

    const factor = LADO_MAXIMO / ladoMayor;
    return {
      width: Math.round(ancho * factor),
      height: Math.round(alto * factor)
    };
  }

  private nombreJpg(nombre: string): string {
    const punto = nombre.lastIndexOf('.');
    const base = punto > 0 ? nombre.slice(0, punto) : nombre;
    return `${base}.jpg`;
  }
}
