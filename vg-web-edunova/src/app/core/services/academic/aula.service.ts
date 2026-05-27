import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Aula } from '../../interfaces/academic.interface';

@Injectable({ providedIn: 'root' })
export class AulaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.academicApiUrl}/aulas`;

  listar(): Observable<Aula[]> {
    return this.http.get<Aula[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Aula> {
    return this.http.get<Aula>(`${this.baseUrl}/${id}`);
  }

  crear(aula: Aula): Observable<Aula> {
    return this.http.post<Aula>(this.baseUrl, aula);
  }

  actualizar(id: number, aula: Aula): Observable<Aula> {
    return this.http.put<Aula>(`${this.baseUrl}/${id}`, aula);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
