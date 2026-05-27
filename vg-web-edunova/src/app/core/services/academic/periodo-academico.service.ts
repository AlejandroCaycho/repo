import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PeriodoAcademico } from '../../interfaces/academic.interface';

@Injectable({ providedIn: 'root' })
export class PeriodoAcademicoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.academicApiUrl}/periodos-academicos`;

  listar(): Observable<PeriodoAcademico[]> {
    return this.http.get<PeriodoAcademico[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<PeriodoAcademico> {
    return this.http.get<PeriodoAcademico>(`${this.baseUrl}/${id}`);
  }

  crear(periodo: PeriodoAcademico): Observable<PeriodoAcademico> {
    return this.http.post<PeriodoAcademico>(this.baseUrl, periodo);
  }

  actualizar(id: number, periodo: PeriodoAcademico): Observable<PeriodoAcademico> {
    return this.http.put<PeriodoAcademico>(`${this.baseUrl}/${id}`, periodo);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarPorAnoAcademico(anoAcademicoId: number): Observable<PeriodoAcademico[]> {
    return this.http.get<PeriodoAcademico[]>(`${this.baseUrl}/ano/${anoAcademicoId}`);
  }
}
