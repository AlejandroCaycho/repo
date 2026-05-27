import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PromedioPeriodoRequest, PromedioPeriodoResponse } from '../../interfaces/evaluacion.interface';

@Injectable({
  providedIn: 'root'
})
export class PromedioService {
  private readonly apiUrl = `${environment.gradingUrl}/api/v1/grading/promedios`;

  constructor(private http: HttpClient) {}

  calcular(request: PromedioPeriodoRequest): Observable<PromedioPeriodoResponse> {
    return this.http.post<PromedioPeriodoResponse>(`${this.apiUrl}/calcular`, request);
  }

  obtener(estudianteId: number, claseId: number, periodoId: number): Observable<PromedioPeriodoResponse> {
    return this.http.get<PromedioPeriodoResponse>(
      `${this.apiUrl}/estudiante/${estudianteId}/clase/${claseId}/periodo/${periodoId}`
    );
  }

  listarTodos(): Observable<PromedioPeriodoResponse[]> {
    return this.http.get<PromedioPeriodoResponse[]>(this.apiUrl);
  }

  listarPorEstudiantePeriodo(estudianteId: number, periodoId: number): Observable<PromedioPeriodoResponse[]> {
    return this.http.get<PromedioPeriodoResponse[]>(
      `${this.apiUrl}/estudiante/${estudianteId}/periodo/${periodoId}`
    );
  }

  listarPorClasePeriodo(claseId: number, periodoId: number): Observable<PromedioPeriodoResponse[]> {
    return this.http.get<PromedioPeriodoResponse[]>(
      `${this.apiUrl}/clase/${claseId}/periodo/${periodoId}`
    );
  }
}
