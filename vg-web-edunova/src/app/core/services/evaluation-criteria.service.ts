import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EvaluationCriteria, EvaluationCriteriaRequest } from '../interfaces/evaluation-criteria.interface';

@Injectable({ providedIn: 'root' })
export class EvaluationCriteriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8083/api/evaluation-criteria';

  listarTodas(): Observable<EvaluationCriteria[]> {
    return this.http.get<EvaluationCriteria[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<EvaluationCriteria> {
    return this.http.get<EvaluationCriteria>(`${this.baseUrl}/${id}`);
  }

  crear(data: EvaluationCriteriaRequest): Observable<EvaluationCriteria> {
    return this.http.post<EvaluationCriteria>(this.baseUrl, data);
  }

  actualizar(id: number, data: EvaluationCriteriaRequest): Observable<EvaluationCriteria> {
    return this.http.put<EvaluationCriteria>(`${this.baseUrl}/${id}`, data);
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

  buscarPorEscala(scaleId: number): Observable<EvaluationCriteria[]> {
    return this.http.get<EvaluationCriteria[]>(`${this.baseUrl}/scale/${scaleId}`);
  }

  buscarPorTipo(type: string): Observable<EvaluationCriteria[]> {
    return this.http.get<EvaluationCriteria[]>(`${this.baseUrl}/type/${type}`);
  }

  buscarPorPadre(parentId: number): Observable<EvaluationCriteria[]> {
    return this.http.get<EvaluationCriteria[]>(`${this.baseUrl}/parent/${parentId}`);
  }

  buscarPorMateria(subjectId: number): Observable<EvaluationCriteria[]> {
    return this.http.get<EvaluationCriteria[]>(`${this.baseUrl}/subject/${subjectId}`);
  }

  buscarPorPeriodo(academicPeriodId: number): Observable<EvaluationCriteria[]> {
    return this.http.get<EvaluationCriteria[]>(`${this.baseUrl}/period/${academicPeriodId}`);
  }
}