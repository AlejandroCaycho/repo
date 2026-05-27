import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Teacher, TeacherRequest } from '../interfaces/teacher.interface';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8083/api/teachers';

  listarTodas(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.baseUrl}/${id}`);
  }

  crear(data: TeacherRequest): Observable<Teacher> {
    return this.http.post<Teacher>(this.baseUrl, data);
  }

  actualizar(id: number, data: TeacherRequest): Observable<Teacher> {
    return this.http.put<Teacher>(`${this.baseUrl}/${id}`, data);
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

  buscarPorCodigo(teacherCode: string): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.baseUrl}/code/${teacherCode}`);
  }

  buscarPorEspecialidad(specialty: string): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${this.baseUrl}/specialty/${specialty}`);
  }

  buscarPorPersona(personId: number): Observable<Teacher> {
    return this.http.get<Teacher>(`${this.baseUrl}/person/${personId}`);
  }
}