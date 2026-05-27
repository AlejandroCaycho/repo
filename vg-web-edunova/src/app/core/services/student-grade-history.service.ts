import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentGradeHistoryRequest, StudentGradeHistoryResponse } from '../interfaces/student-grade-history.interface';

@Injectable({ providedIn: 'root' })
export class StudentGradeHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8083/api/student-grade-history';

  listarTodas(): Observable<StudentGradeHistoryResponse[]> {
    return this.http.get<StudentGradeHistoryResponse[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<StudentGradeHistoryResponse> {
    return this.http.get<StudentGradeHistoryResponse>(`${this.baseUrl}/${id}`);
  }

  buscarPorEstudiante(studentId: number): Observable<StudentGradeHistoryResponse[]> {
    return this.http.get<StudentGradeHistoryResponse[]>(`${this.baseUrl}/student/${studentId}/ordered`);
  }

  buscarPorMovimiento(movementType: string): Observable<StudentGradeHistoryResponse[]> {
    return this.http.get<StudentGradeHistoryResponse[]>(`${this.baseUrl}/movement-type/${movementType}`);
  }

  buscarPorAnoAcademico(academicYearId: number): Observable<StudentGradeHistoryResponse[]> {
    return this.http.get<StudentGradeHistoryResponse[]>(`${this.baseUrl}/academic-year/${academicYearId}`);
  }

  crear(data: StudentGradeHistoryRequest): Observable<StudentGradeHistoryResponse> {
    return this.http.post<StudentGradeHistoryResponse>(this.baseUrl, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
