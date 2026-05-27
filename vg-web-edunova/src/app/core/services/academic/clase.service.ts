import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Clase } from '../../interfaces/academic.interface';

@Injectable({ providedIn: 'root' })
export class ClaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.academicApiUrl}/clases`;

  listar(): Observable<Clase[]> {
    return this.http.get<Clase[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Clase> {
    return this.http.get<Clase>(`${this.baseUrl}/${id}`);
  }

  crear(clase: Clase): Observable<Clase> {
    return this.http.post<Clase>(this.baseUrl, clase);
  }

  actualizar(id: number, clase: Clase): Observable<Clase> {
    return this.http.put<Clase>(`${this.baseUrl}/${id}`, clase);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarPorProfesor(profesorId: number): Observable<Clase[]> {
    return this.http.get<Clase[]>(`${this.baseUrl}/profesor/${profesorId}`);
  }

  listarPorGrado(gradoId: number): Observable<Clase[]> {
    return this.http.get<Clase[]>(`${this.baseUrl}/grado/${gradoId}`);
  }
}
