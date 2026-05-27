import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Materia } from '../../interfaces/academic.interface';

@Injectable({ providedIn: 'root' })
export class MateriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.academicApiUrl}/materias`;

  listar(): Observable<Materia[]> {
    return this.http.get<Materia[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Materia> {
    return this.http.get<Materia>(`${this.baseUrl}/${id}`);
  }

  crear(materia: Materia): Observable<Materia> {
    return this.http.post<Materia>(this.baseUrl, materia);
  }

  actualizar(id: number, materia: Materia): Observable<Materia> {
    return this.http.put<Materia>(`${this.baseUrl}/${id}`, materia);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarPorNivel(nivelId: number): Observable<Materia[]> {
    return this.http.get<Materia[]>(`${this.baseUrl}/nivel/${nivelId}`);
  }
}
