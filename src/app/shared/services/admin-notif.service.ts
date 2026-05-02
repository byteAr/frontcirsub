import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminMessage {
  id: string;
  titulo: string;
  cuerpo: string;
  fecha: string; // ISO 8601
}

@Injectable({ providedIn: 'root' })
export class AdminNotifService {
  private http = inject(HttpClient);
  private apiUrl = environment.API_URL;

  /** Signal reactivo: badge en la credencial reacciona a este valor */
  unreadCount = signal<number>(0);

  private getHeaders() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }

  getRole(
    dni: string,
  ): Observable<{ role: 'superadmin' | 'sender' | null }> {
    return this.http.get<{ role: 'superadmin' | 'sender' | null }>(
      `${this.apiUrl}/admin-notifications/permissions/${dni}`,
    );
  }

  searchByDni(
    dni: string,
  ): Observable<{ id: number; nombre: string; apellido: string }> {
    return this.http.get<{ id: number; nombre: string; apellido: string }>(
      `${this.apiUrl}/admin-notifications/search?dni=${dni}`,
      { headers: this.getHeaders() },
    );
  }

  sendNotification(dto: {
    targetUserId: number;
    titulo: string;
    cuerpo: string;
  }): Observable<{ ok: boolean; pushed: boolean }> {
    return this.http.post<{ ok: boolean; pushed: boolean }>(
      `${this.apiUrl}/admin-notifications/send`,
      dto,
      { headers: this.getHeaders() },
    );
  }

  addPermission(dni: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `${this.apiUrl}/admin-notifications/permissions`,
      { dni },
      { headers: this.getHeaders() },
    );
  }

  getMessages(
    userId: number,
  ): Observable<{ messages: AdminMessage[]; unread: number }> {
    return this.http.get<{ messages: AdminMessage[]; unread: number }>(
      `${this.apiUrl}/admin-notifications/messages/${userId}`,
      { headers: this.getHeaders() },
    );
  }

  markRead(userId: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `${this.apiUrl}/admin-notifications/messages/${userId}/mark-read`,
      {},
      { headers: this.getHeaders() },
    );
  }
}
