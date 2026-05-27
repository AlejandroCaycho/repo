import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalificacionRequest, CalificacionResponse } from '../../interfaces/evaluacion.interface';

@Injectable({
  providedIn: 'root'
})
export class CalificacionService {
  private readonly apiUrl = `${environment.gradingUrl}/api/v1/grading/calificaciones`;

  constructor(private http: HttpClient) {}

  registrar(request: CalificacionRequest): Observable<CalificacionResponse> {
    return this.http.post<CalificacionResponse>(this.apiUrl, request);
  }

  obtenerPorId(id: number): Observable<CalificacionResponse> {
    return this.http.get<CalificacionResponse>(`${this.apiUrl}/${id}`);
  }

  listarTodas(): Observable<CalificacionResponse[]> {
    return this.http.get<CalificacionResponse[]>(this.apiUrl);
  }

  listarPorEstudianteClasePeriodo(estudianteId: number, claseId: number, periodoId: number): Observable<CalificacionResponse[]> {
    return this.http.get<CalificacionResponse[]>(`${this.apiUrl}/estudiante/${estudianteId}/clase/${claseId}/periodo/${periodoId}`);
  }

  listarPorEstudiantePeriodo(estudianteId: number, periodoId: number): Observable<CalificacionResponse[]> {
    return this.http.get<CalificacionResponse[]>(`${this.apiUrl}/estudiante/${estudianteId}/periodo/${periodoId}`);
  }

  listarPorClasePeriodo(claseId: number, periodoId: number): Observable<CalificacionResponse[]> {
    return this.http.get<CalificacionResponse[]>(`${this.apiUrl}/clase/${claseId}/periodo/${periodoId}`);
  }

  actualizar(id: number, request: CalificacionRequest): Observable<CalificacionResponse> {
    return this.http.put<CalificacionResponse>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
