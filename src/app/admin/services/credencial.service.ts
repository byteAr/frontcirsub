import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

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

  updateCbuPhp(id: number, cbu:string) {
    return this.http.post(`https://gestion.cirsubgn.org.ar/Cirsub/CirsubApp/Transf/receptorcbu.php`, {id, cbu})
  }

  updateEncuesta(id: number, servicio: number, atencion: number ): Observable<any> {
    return this.http.post(`${this.url}/credencial/encuesta`, {id, servicio, atencion})
  }
}
