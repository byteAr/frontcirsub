import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AdminNotifService } from '../../../shared/services/admin-notif.service';

@Component({
  selector: 'app-admin-notif-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  templateUrl: './admin-notif-modal.component.html',
  providers: [MessageService],
})
export class AdminNotifModalComponent {
  role = input.required<'superadmin' | 'sender'>();
  closed = output<void>();

  private adminNotifService = inject(AdminNotifService);
  private messageService = inject(MessageService);

  // Tab activa (solo visible para superadmin)
  activeTab = signal<'send' | 'permissions'>('send');

  // Sección: buscar y enviar
  searchDni = signal('');
  searchResult = signal<{ id: number; nombre: string; apellido: string } | null>(null);
  isSearching = signal(false);
  searchError = signal('');
  titulo = signal('');
  cuerpo = signal('');
  isSending = signal(false);

  // Sección: gestionar accesos (solo superadmin)
  permDni = signal('');
  isAddingPerm = signal(false);

  close() {
    this.closed.emit();
  }

  buscarPorDni() {
    const dni = this.searchDni().trim();
    if (!dni) return;
    this.isSearching.set(true);
    this.searchResult.set(null);
    this.searchError.set('');

    this.adminNotifService.searchByDni(dni).subscribe({
      next: (result) => {
        this.searchResult.set(result);
        this.isSearching.set(false);
      },
      error: () => {
        this.searchError.set('No se encontró ningún socio con ese DNI.');
        this.isSearching.set(false);
      },
    });
  }

  enviarNotificacion() {
    const result = this.searchResult();
    if (!result || !this.titulo().trim() || !this.cuerpo().trim()) return;
    this.isSending.set(true);

    this.adminNotifService
      .sendNotification({
        targetUserId: result.id,
        titulo: this.titulo().trim(),
        cuerpo: this.cuerpo().trim(),
      })
      .subscribe({
        next: (res) => {
          this.isSending.set(false);
          if (res.ok) {
            this.messageService.add({
              severity: 'success',
              summary: 'Enviado',
              detail: res.pushed
                ? 'Notificación enviada correctamente.'
                : 'Mensaje guardado. El usuario lo verá al ingresar.',
            });
            // Resetear formulario
            this.searchDni.set('');
            this.searchResult.set(null);
            this.titulo.set('');
            this.cuerpo.set('');
          }
        },
        error: () => {
          this.isSending.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo enviar la notificación.',
          });
        },
      });
  }

  agregarPermiso() {
    const dni = this.permDni().trim();
    if (!dni) return;
    this.isAddingPerm.set(true);

    this.adminNotifService.addPermission(dni).subscribe({
      next: () => {
        this.isAddingPerm.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Permiso agregado',
          detail: `El DNI ${dni} ya puede enviar notificaciones.`,
        });
        this.permDni.set('');
      },
      error: () => {
        this.isAddingPerm.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo agregar el permiso.',
        });
      },
    });
  }
}
