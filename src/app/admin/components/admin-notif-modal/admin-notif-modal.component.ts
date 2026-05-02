import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AdminNotifService, PermissionUser } from '../../../shared/services/admin-notif.service';

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
  permSearchResult = signal<{ id: number; nombre: string; apellido: string } | null>(null);
  isSearchingPerm = signal(false);
  permSearchError = signal('');
  permConfirmMode = signal(false);
  isAddingPerm = signal(false);

  // Lista de usuarios con permiso
  permList = signal<PermissionUser[]>([]);
  isLoadingPermList = signal(false);
  removingDni = signal<string | null>(null);

  close() {
    this.closed.emit();
  }

  setTab(tab: 'send' | 'permissions') {
    this.activeTab.set(tab);
    if (tab === 'permissions') {
      this.cargarPermisos();
    }
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

  // Paso 1: buscar la persona antes de confirmar
  buscarParaPermiso() {
    const dni = this.permDni().trim();
    if (!dni) return;
    this.isSearchingPerm.set(true);
    this.permSearchResult.set(null);
    this.permSearchError.set('');
    this.permConfirmMode.set(false);

    this.adminNotifService.searchByDni(dni).subscribe({
      next: (result) => {
        this.permSearchResult.set(result);
        this.permConfirmMode.set(true);
        this.isSearchingPerm.set(false);
      },
      error: () => {
        this.permSearchError.set('No se encontró ningún socio con ese DNI.');
        this.isSearchingPerm.set(false);
      },
    });
  }

  cancelarBusquedaPerm() {
    this.permDni.set('');
    this.permSearchResult.set(null);
    this.permSearchError.set('');
    this.permConfirmMode.set(false);
  }

  // Paso 2: confirmar y agregar el permiso
  confirmarPermiso() {
    const result = this.permSearchResult();
    if (!result) return;
    this.isAddingPerm.set(true);

    this.adminNotifService
      .addPermission({ dni: this.permDni().trim(), nombre: result.nombre, apellido: result.apellido })
      .subscribe({
        next: () => {
          this.isAddingPerm.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Permiso agregado',
            detail: `${result.nombre} ${result.apellido} ya puede enviar notificaciones.`,
          });
          this.cancelarBusquedaPerm();
          this.cargarPermisos();
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

  cargarPermisos() {
    this.isLoadingPermList.set(true);
    this.adminNotifService.listPermissions().subscribe({
      next: (list) => {
        this.permList.set(list);
        this.isLoadingPermList.set(false);
      },
      error: () => {
        this.isLoadingPermList.set(false);
      },
    });
  }

  eliminarPermiso(dni: string, nombre: string, apellido: string) {
    this.removingDni.set(dni);
    this.adminNotifService.removePermission(dni).subscribe({
      next: () => {
        this.removingDni.set(null);
        this.permList.update((list) => list.filter((u) => u.dni !== dni));
        this.messageService.add({
          severity: 'info',
          summary: 'Permiso removido',
          detail: `Se quitó el permiso a ${nombre} ${apellido}.`,
        });
      },
      error: () => {
        this.removingDni.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo quitar el permiso.',
        });
      },
    });
  }
}
