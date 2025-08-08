import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

interface Cbu {
  cbu: string
}

@Injectable({
  providedIn: 'root'
})
export class CredencialService {

  http = inject(HttpClient);

  url = environment.API_URL;

  constructor() { }

  getCbu(id: string) {
    return this.http.get<Cbu>(`${this.url}/credencial?id=${id}`)
  }

  updateCbu(id: number, cbu:string) {
    return this.http.patch(`${this.url}/credencial`, {id, cbu})
  }
}
