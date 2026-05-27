import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IncidenciaRequest, IncidenciaResponse } from '../interfaces/welfare.interfaces';

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private url = `${environment.welfareUrl}/incidencias`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<IncidenciaResponse[]>                                         { return this.http.get<IncidenciaResponse[]>(this.url); }
  getAbiertas(): Observable<IncidenciaResponse[]>                                    { return this.http.get<IncidenciaResponse[]>(`${this.url}/abiertas`); }
  getCerradas(): Observable<IncidenciaResponse[]>                                    { return this.http.get<IncidenciaResponse[]>(`${this.url}/cerradas`); }
  getByEstudiante(id: number): Observable<IncidenciaResponse[]>                      { return this.http.get<IncidenciaResponse[]>(`${this.url}/estudiante/${id}`); }
  getByInstitucion(id: number): Observable<IncidenciaResponse[]>                     { return this.http.get<IncidenciaResponse[]>(`${this.url}/institucion/${id}`); }
  getByEstado(estado: string): Observable<IncidenciaResponse[]>                      { return this.http.get<IncidenciaResponse[]>(`${this.url}/estado/${estado}`); }
  getBySeveridad(severidad: string): Observable<IncidenciaResponse[]>                { return this.http.get<IncidenciaResponse[]>(`${this.url}/severidad/${severidad}`); }
  getById(id: number): Observable<IncidenciaResponse>                                { return this.http.get<IncidenciaResponse>(`${this.url}/${id}`); }
  create(data: IncidenciaRequest): Observable<IncidenciaResponse>                    { return this.http.post<IncidenciaResponse>(this.url, data); }
  update(id: number, data: IncidenciaRequest): Observable<IncidenciaResponse>        { return this.http.put<IncidenciaResponse>(`${this.url}/${id}`, data); }
  cerrar(id: number): Observable<IncidenciaResponse>                                 { return this.http.patch<IncidenciaResponse>(`${this.url}/${id}/cerrar`, {}); }
  reabrir(id: number): Observable<IncidenciaResponse>                                { return this.http.patch<IncidenciaResponse>(`${this.url}/${id}/reabrir`, {}); }
  delete(id: number): Observable<void>                                               { return this.http.delete<void>(`${this.url}/${id}`); }
}
