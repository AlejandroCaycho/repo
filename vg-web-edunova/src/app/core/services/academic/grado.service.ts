import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Grado } from '../../interfaces/academic.interface';

@Injectable({ providedIn: 'root' })
export class GradoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.academicApiUrl}/grados`;

  listar(): Observable<Grado[]> {
    return this.http.get<Grado[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Grado> {
    return this.http.get<Grado>(`${this.baseUrl}/${id}`);
  }

  crear(grado: Grado): Observable<Grado> {
    return this.http.post<Grado>(this.baseUrl, grado);
  }

  actualizar(id: number, grado: Grado): Observable<Grado> {
    return this.http.put<Grado>(`${this.baseUrl}/${id}`, grado);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarPorInstitucion(institucionId: number): Observable<Grado[]> {
    return this.http.get<Grado[]>(`${this.baseUrl}/institucion/${institucionId}`);
  }

  listarPorNivel(nivelId: number): Observable<Grado[]> {
    return this.http.get<Grado[]>(`${this.baseUrl}/nivel/${nivelId}`);
  }
}
