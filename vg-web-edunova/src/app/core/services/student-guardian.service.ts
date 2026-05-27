import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentGuardian, StudentGuardianRequest } from '../interfaces/student-guardian.interface';

@Injectable({ providedIn: 'root' })
export class StudentGuardianService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8083/api/student-guardians';

  listarTodas(): Observable<StudentGuardian[]> {
    return this.http.get<StudentGuardian[]>(this.baseUrl);
  }

  listarPorEstudiante(studentId: number): Observable<StudentGuardian[]> {
    return this.http.get<StudentGuardian[]>(`${this.baseUrl}/student/${studentId}`);
  }

  listarPorApoderado(guardianId: number): Observable<StudentGuardian[]> {
    return this.http.get<StudentGuardian[]>(`${this.baseUrl}/guardian/${guardianId}`);
  }

  asignar(data: StudentGuardianRequest): Observable<StudentGuardian> {
    return this.http.post<StudentGuardian>(this.baseUrl, data);
  }

  actualizar(studentId: number, guardianId: number, data: StudentGuardianRequest): Observable<StudentGuardian> {
    return this.http.put<StudentGuardian>(`${this.baseUrl}/student/${studentId}/guardian/${guardianId}`, data);
  }

  eliminar(studentId: number, guardianId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/student/${studentId}/guardian/${guardianId}`);
  }
}
