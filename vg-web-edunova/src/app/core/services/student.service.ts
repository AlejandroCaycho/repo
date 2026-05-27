import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student, StudentRequest } from '../interfaces/student.interface';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8083/api/students';

  listarTodas(): Observable<Student[]> {
    return this.http.get<Student[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.baseUrl}/${id}`);
  }

  crear(data: StudentRequest): Observable<Student> {
    return this.http.post<Student>(this.baseUrl, data);
  }

  actualizar(id: number, data: StudentRequest): Observable<Student> {
    return this.http.put<Student>(`${this.baseUrl}/${id}`, data);
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

  buscarPorMatricula(enrollmentNumber: string): Observable<Student> {
    return this.http.get<Student>(`${this.baseUrl}/enrollment/${enrollmentNumber}`);
  }

  buscarPorCodigo(studentCode: string): Observable<Student> {
    return this.http.get<Student>(`${this.baseUrl}/student-code/${studentCode}`);
  }

  buscarPorEstado(academicStatus: string): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.baseUrl}/status/${academicStatus}`);
  }

  buscarPorGrado(gradeId: number): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.baseUrl}/grade/${gradeId}`);
  }
}