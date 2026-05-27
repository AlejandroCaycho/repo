import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TutorEstudianteRequest, TutorEstudianteResponse } from '../interfaces/welfare.interfaces';

@Injectable({ providedIn: 'root' })
export class TutorEstudianteService {
  private url = `${environment.welfareUrl}/tutores-estudiante`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TutorEstudianteResponse[]>                                              { return this.http.get<TutorEstudianteResponse[]>(this.url); }
  getActivos(): Observable<TutorEstudianteResponse[]>                                          { return this.http.get<TutorEstudianteResponse[]>(`${this.url}/activos`); }
  getInactivos(): Observable<TutorEstudianteResponse[]>                                        { return this.http.get<TutorEstudianteResponse[]>(`${this.url}/inactivos`); }
  getByProfesor(id: number): Observable<TutorEstudianteResponse[]>                             { return this.http.get<TutorEstudianteResponse[]>(`${this.url}/profesor/${id}`); }
  getByEstudiante(id: number): Observable<TutorEstudianteResponse[]>                           { return this.http.get<TutorEstudianteResponse[]>(`${this.url}/estudiante/${id}`); }
  getByEstado(estado: string): Observable<TutorEstudianteResponse[]>                           { return this.http.get<TutorEstudianteResponse[]>(`${this.url}/estado/${estado}`); }
  getByPrograma(id: number): Observable<TutorEstudianteResponse[]>                             { return this.http.get<TutorEstudianteResponse[]>(`${this.url}/programa/${id}`); }
  getById(id: number): Observable<TutorEstudianteResponse>                                     { return this.http.get<TutorEstudianteResponse>(`${this.url}/${id}`); }
  create(data: TutorEstudianteRequest): Observable<TutorEstudianteResponse>                    { return this.http.post<TutorEstudianteResponse>(this.url, data); }
  update(id: number, data: TutorEstudianteRequest): Observable<TutorEstudianteResponse>        { return this.http.put<TutorEstudianteResponse>(`${this.url}/${id}`, data); }
  activar(id: number): Observable<TutorEstudianteResponse>                                     { return this.http.patch<TutorEstudianteResponse>(`${this.url}/${id}/activar`, {}); }
  desactivar(id: number): Observable<TutorEstudianteResponse>                                  { return this.http.patch<TutorEstudianteResponse>(`${this.url}/${id}/desactivar`, {}); }
  delete(id: number): Observable<void>                                                         { return this.http.delete<void>(`${this.url}/${id}`); }
}
