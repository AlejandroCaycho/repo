import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AnoAcademico } from '../../interfaces/academic.interface';

@Injectable({ providedIn: 'root' })
export class AnoAcademicoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.academicApiUrl}/anos-academicos`;

  listar(): Observable<AnoAcademico[]> {
    return this.http.get<AnoAcademico[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<AnoAcademico> {
    return this.http.get<AnoAcademico>(`${this.baseUrl}/${id}`);
  }

  crear(ano: AnoAcademico): Observable<AnoAcademico> {
    return this.http.post<AnoAcademico>(this.baseUrl, ano);
  }

  actualizar(id: number, ano: AnoAcademico): Observable<AnoAcademico> {
    return this.http.put<AnoAcademico>(`${this.baseUrl}/${id}`, ano);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
