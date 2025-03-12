import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, OnInit} from '@angular/core';
import domtoimage from 'dom-to-image';
import QRCode from 'qrcode';

@Component({
  selector: 'app-credencial',
  imports: [CommonModule],
  templateUrl: './credencial.component.html',
  styleUrl: './credencial.component.css'
})
export default class CredencialComponen implements OnInit {
  ngOnInit(): void {
    this.generateQrCode();
  }
  @ViewChild('credencialCard', { static: false }) credencialCard!: ElementRef;
  userId: number = 123;  // Definimos el ID del usuario
  qrUrl: string = 'http://iugna.edu.ar'; // URL del QR generada


  downloadImage() {
    if (!this.credencialCard) {
      console.error("No se encontró la credencial.");
      return;
    }

    const card = this.credencialCard.nativeElement;
    // Generar la imagen
    this.generateImage(card);
  }

  private generateImage(card: HTMLElement) {
    setTimeout(() => {
      domtoimage.toPng(card, {
        quality: 1, // Máxima calidad
        bgcolor: 'white', // Fondo blanco
      })
      .then((dataUrl) => {
        // Crear un enlace para la descarga
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'credencial.png'; // Nombre del archivo descargado
        link.click(); // Simula el clic para descargar la imagen
      })
      .catch((error) => {
        console.error('Error al generar la imagen:', error);
      });
    }, 500); // Esperar 500ms antes de capturar la imagen
  }

  generateQrCode() {
    const userUrl = `https://iugna.edu.ar`; // URL dinámica con el ID del usuario
    QRCode.toDataURL(userUrl, { errorCorrectionLevel: 'H' }, (err, url) => {
      if (err) {
        console.error('Error al generar el QR:', err);
        return;
      }
      this.qrUrl = url; // Asignamos la URL del QR generada
    });
  }

}
