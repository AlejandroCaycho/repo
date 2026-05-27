import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SesionTutoriaRequest, SesionTutoriaResponse } from '../interfaces/welfare.interfaces';

@Injectable({ providedIn: 'root' })
export class SesionTutoriaService {
  private url = `${environment.welfareUrl}/sesiones-tutoria`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SesionTutoriaResponse[]>                                            { return this.http.get<SesionTutoriaResponse[]>(this.url); }
  getByTutorEstudiante(id: number): Observable<SesionTutoriaResponse[]>                   { return this.http.get<SesionTutoriaResponse[]>(`${this.url}/tutor-estudiante/${id}`); }
  getByTutorGrado(id: number): Observable<SesionTutoriaResponse[]>                        { return this.http.get<SesionTutoriaResponse[]>(`${this.url}/tutor-grado/${id}`); }
  getByTipo(tipo: string): Observable<SesionTutoriaResponse[]>                            { return this.http.get<SesionTutoriaResponse[]>(`${this.url}/tipo/${tipo}`); }
  getByModalidad(modalidad: string): Observable<SesionTutoriaResponse[]>                  { return this.http.get<SesionTutoriaResponse[]>(`${this.url}/modalidad/${modalidad}`); }
  getById(id: number): Observable<SesionTutoriaResponse>                                  { return this.http.get<SesionTutoriaResponse>(`${this.url}/${id}`); }
  create(data: SesionTutoriaRequest): Observable<SesionTutoriaResponse>                   { return this.http.post<SesionTutoriaResponse>(this.url, data); }
  update(id: number, data: SesionTutoriaRequest): Observable<SesionTutoriaResponse>       { return this.http.put<SesionTutoriaResponse>(`${this.url}/${id}`, data); }
  delete(id: number): Observable<void>                                                    { return this.http.delete<void>(`${this.url}/${id}`); }
}
