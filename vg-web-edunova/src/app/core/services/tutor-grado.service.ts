import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TutorGradoRequest, TutorGradoResponse } from '../interfaces/welfare.interfaces';

@Injectable({ providedIn: 'root' })
export class TutorGradoService {
  private url = `${environment.welfareUrl}/tutores-grado`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TutorGradoResponse[]>                                         { return this.http.get<TutorGradoResponse[]>(this.url); }
  getActivos(): Observable<TutorGradoResponse[]>                                     { return this.http.get<TutorGradoResponse[]>(`${this.url}/activos`); }
  getInactivos(): Observable<TutorGradoResponse[]>                                   { return this.http.get<TutorGradoResponse[]>(`${this.url}/inactivos`); }
  getByProfesor(id: number): Observable<TutorGradoResponse[]>                        { return this.http.get<TutorGradoResponse[]>(`${this.url}/profesor/${id}`); }
  getByGrado(id: number): Observable<TutorGradoResponse[]>                           { return this.http.get<TutorGradoResponse[]>(`${this.url}/grado/${id}`); }
  getByPrograma(id: number): Observable<TutorGradoResponse[]>                        { return this.http.get<TutorGradoResponse[]>(`${this.url}/programa/${id}`); }
  getById(id: number): Observable<TutorGradoResponse>                                { return this.http.get<TutorGradoResponse>(`${this.url}/${id}`); }
  create(data: TutorGradoRequest): Observable<TutorGradoResponse>                    { return this.http.post<TutorGradoResponse>(this.url, data); }
  update(id: number, data: TutorGradoRequest): Observable<TutorGradoResponse>        { return this.http.put<TutorGradoResponse>(`${this.url}/${id}`, data); }
  activar(id: number): Observable<TutorGradoResponse>                                { return this.http.patch<TutorGradoResponse>(`${this.url}/${id}/activar`, {}); }
  desactivar(id: number): Observable<TutorGradoResponse>                             { return this.http.patch<TutorGradoResponse>(`${this.url}/${id}/desactivar`, {}); }
  delete(id: number): Observable<void>                                               { return this.http.delete<void>(`${this.url}/${id}`); }
}
