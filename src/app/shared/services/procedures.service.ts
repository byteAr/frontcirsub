import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class ProcedureService {

  private baseUrl = environment.API_URL

  private _http = inject(HttpClient);

  getAllPorcedures(): Observable<any>{
    const response = this._http.get(`${this.baseUrl}/tramites`);
    return response
  }

}
