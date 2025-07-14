import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-avatar-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-profile.component.html',
  styleUrls: ['./avatar-profile.component.css'],
})
export default class AvatarProfileComponent {
  @ViewChild('videoElement') videoElement!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef;

  isLoading: boolean = false;

  capturedImage: string | null = null;
  private mediaStream: MediaStream | null = null;

  async ngAfterViewInit() {
    this.canvas.nativeElement.width = 300;
    this.canvas.nativeElement.height = 300;
    await this.startCamera();
  }

  async startCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.nativeElement.srcObject = this.mediaStream;
      await this.videoElement.nativeElement.play();
    } catch (err) {
      console.error('Error al acceder a la cámara', err);
      alert('No se pudo acceder a la cámara. Asegúrate de otorgar permisos.');
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  capturePhoto() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvas.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const squareSize = Math.min(videoWidth, videoHeight);

    // Recortar desde el centro
    const startX = (videoWidth - squareSize) / 2;
    const startY = (videoHeight - squareSize) / 2;

    // Canvas cuadrado
    canvas.width = squareSize;
    canvas.height = squareSize;

    // Espejo horizontal
    context.translate(squareSize, 0);
    context.scale(-1, 1);

    // Capturar imagen centrada y cuadrada
    context.drawImage(video, startX, startY, squareSize, squareSize, 0, 0, squareSize, squareSize);

    this.capturedImage = canvas.toDataURL('image/png');
    this.stopCamera();
  }

  async retakePhoto() {
    this.capturedImage = null;
    await this.startCamera();
  }

  async updateProfile() {
    if (!this.capturedImage) {
      alert('Por favor, toma una foto primero.');
      return;
    }

    this.isLoading = true; // Activa el estado de carga

    // Convertir Data URL a Blob
    // Esta función auxiliar convierte una data URL en un objeto Blob
    const dataURLtoBlob = (dataurl: string): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const arr = dataurl.split(',');
        // @ts-ignore
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        resolve(new Blob([u8arr], { type: mime }));
      });
    };

    try {
      const imageBlob = await dataURLtoBlob(this.capturedImage);
      console.log('Blob de la imagen:', imageBlob);

      // Crear un FormData para enviar el archivo
      // Esto es crucial para enviar archivos binarios en peticiones multipart/form-data
      const formData = new FormData();
      formData.append('profilePicture', imageBlob, 'profile.jpeg'); // 'profilePicture' es el nombre del campo en el backend



    } catch (blobError) {
      this.isLoading = false;
      console.error('Error al convertir Data URL a Blob:', blobError);
      alert('Error interno al preparar la imagen.');
    }
  }

  ngOnDestroy() {
    this.stopCamera(); // Detener la cámara al destruir el componente
  }
}
