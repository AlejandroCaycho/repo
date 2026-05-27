import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Profesor } from '../../interfaces/academic.interface';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.academicApiUrl + '/docentes';

  listar(): Observable<Profesor[]> {
    return this.http.get<Profesor[]>(this.apiUrl);
  }
}
