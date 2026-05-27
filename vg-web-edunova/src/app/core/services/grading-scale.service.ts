import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GradingScale, GradingScaleRequest } from '../interfaces/grading-scale.interface';

@Injectable({ providedIn: 'root' })
export class GradingScaleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8083/api/grading-scales';

  listarTodas(): Observable<GradingScale[]> {
    return this.http.get<GradingScale[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<GradingScale> {
    return this.http.get<GradingScale>(`${this.baseUrl}/${id}`);
  }

  crear(data: GradingScaleRequest): Observable<GradingScale> {
    return this.http.post<GradingScale>(this.baseUrl, data);
  }

  actualizar(id: number, data: GradingScaleRequest): Observable<GradingScale> {
    return this.http.put<GradingScale>(`${this.baseUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  softDelete(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/soft-delete`, {});
  }

  activar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/activate`, {});
  }

  buscarPorTipo(type: string): Observable<GradingScale[]> {
    return this.http.get<GradingScale[]>(`${this.baseUrl}/type/${type}`);
  }

  buscarPorInstitucion(institutionId: number): Observable<GradingScale[]> {
    return this.http.get<GradingScale[]>(`${this.baseUrl}/institution/${institutionId}`);
  }
}