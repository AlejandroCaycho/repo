import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Nivel } from '../../interfaces/academic.interface';

@Injectable({ providedIn: 'root' })
export class NivelService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.academicApiUrl}/niveles`;

  listar(): Observable<Nivel[]> {
    return this.http.get<Nivel[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Nivel> {
    return this.http.get<Nivel>(`${this.baseUrl}/${id}`);
  }

  crear(nivel: Nivel): Observable<Nivel> {
    return this.http.post<Nivel>(this.baseUrl, nivel);
  }

  actualizar(id: number, nivel: Nivel): Observable<Nivel> {
    return this.http.put<Nivel>(`${this.baseUrl}/${id}`, nivel);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
