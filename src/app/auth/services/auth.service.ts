import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({providedIn: 'root'})
export class AuthService {

  url = environment.API_URL

  http = inject(HttpClient)
  constructor() { }

  createPerson(persona:any): Observable<any>{
    return this.http.post(`${this.url}/auth/addpersona`, persona)
  }

}
