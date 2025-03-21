import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tipoDni } from '../../auth/pages/register/register.component';

@Injectable({providedIn: 'root'})
export class TramitesService {

  url: string = environment.API_URL;
  http = inject(HttpClient);

  constructor() { }

  createTramite(data:any): Observable<any>{
    return this.http.post(`${this.url}/tramites`, data)
  }

  getTypesDni(): Observable<any> {
    return this.http.get(`${this.url}/tramites/tipodocumentos`)

  }



}
