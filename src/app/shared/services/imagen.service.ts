import { Injectable } from '@angular/core';

/** Lado mayor al que se reduce la imagen. Una receta sigue siendo legible. */
const LADO_MAXIMO = 1600;

/** Calidad del JPEG resultante. */
const CALIDAD = 0.8;

/** Por debajo de esto no vale la pena recomprimir. */
const TAMANIO_MINIMO_PARA_COMPRIMIR = 800 * 1024;

/**
 * La foto de perfil se muestra chica (el avatar de la credencial son unos
 * 40px) y se guarda en base64 en la base, así que 800px de lado sobra y
 * ahorra muchísimo peso.
 */
const LADO_MAXIMO_AVATAR = 800;
const CALIDAD_AVATAR = 0.85;

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

    const blob = await this.redimensionar(archivo, LADO_MAXIMO, CALIDAD);

    if (!blob || blob.size >= archivo.size) return archivo;

    return new File([blob], this.nombreJpg(archivo.name), { type: 'image/jpeg' });
  }

  /**
   * Versión para la foto de perfil. A diferencia de comprimir(), se aplica
   * siempre y sin umbral: la captura de la cámara sale como PNG a resolución
   * completa (1,7 MB medidos en producción) y termina en base64 dentro de la
   * base, así que conviene achicarla aunque sea chica.
   */
  async comprimirAvatar(imagen: Blob): Promise<Blob> {
    const blob = await this.redimensionar(imagen, LADO_MAXIMO_AVATAR, CALIDAD_AVATAR);

    if (!blob || blob.size >= imagen.size) return imagen;

    return blob;
  }

  /**
   * Devuelve null si algo falla, para que quien llame se quede con el
   * original: es preferible subir una imagen pesada a no poder subirla.
   */
  private async redimensionar(
    imagen: Blob,
    ladoMaximo: number,
    calidad: number,
  ): Promise<Blob | null> {
    try {
      const bitmap = await this.decodificar(imagen);
      const { width, height } = this.escalar(bitmap.width, bitmap.height, ladoMaximo);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const contexto = canvas.getContext('2d');
      if (!contexto) return null;

      // Fondo blanco: si el original es un PNG con transparencia, al pasarlo a
      // JPEG las zonas transparentes saldrían negras.
      contexto.fillStyle = '#ffffff';
      contexto.fillRect(0, 0, width, height);
      contexto.drawImage(bitmap, 0, 0, width, height);

      if ('close' in bitmap) bitmap.close();

      return await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', calidad)
      );
    } catch {
      return null;
    }
  }

  /**
   * createImageBitmap con from-image respeta la orientación EXIF; sin eso las
   * fotos sacadas de costado se guardarían rotadas. Si el navegador no lo
   * soporta, se cae a <img>, que en los navegadores actuales ya viene
   * orientado.
   */
  private async decodificar(archivo: Blob): Promise<ImageBitmap | HTMLImageElement> {
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

  private escalar(
    ancho: number,
    alto: number,
    ladoMaximo: number,
  ): { width: number; height: number } {
    const ladoMayor = Math.max(ancho, alto);
    if (ladoMayor <= ladoMaximo) return { width: ancho, height: alto };

    const factor = ladoMaximo / ladoMayor;
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
