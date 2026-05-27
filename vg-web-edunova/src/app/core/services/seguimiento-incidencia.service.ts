import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SeguimientoIncidenciaRequest, SeguimientoIncidenciaResponse } from '../interfaces/welfare.interfaces';

@Injectable({ providedIn: 'root' })
export class SeguimientoIncidenciaService {
  private url = `${environment.welfareUrl}/seguimiento-incidencias`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SeguimientoIncidenciaResponse[]>                                                       { return this.http.get<SeguimientoIncidenciaResponse[]>(this.url); }
  getByIncidencia(id: number): Observable<SeguimientoIncidenciaResponse[]>                                    { return this.http.get<SeguimientoIncidenciaResponse[]>(`${this.url}/incidencia/${id}`); }
  getByUsuario(id: number): Observable<SeguimientoIncidenciaResponse[]>                                       { return this.http.get<SeguimientoIncidenciaResponse[]>(`${this.url}/usuario/${id}`); }
  getById(id: number): Observable<SeguimientoIncidenciaResponse>                                              { return this.http.get<SeguimientoIncidenciaResponse>(`${this.url}/${id}`); }
  create(data: SeguimientoIncidenciaRequest): Observable<SeguimientoIncidenciaResponse>                       { return this.http.post<SeguimientoIncidenciaResponse>(this.url, data); }
  update(id: number, data: SeguimientoIncidenciaRequest): Observable<SeguimientoIncidenciaResponse>           { return this.http.put<SeguimientoIncidenciaResponse>(`${this.url}/${id}`, data); }
  delete(id: number): Observable<void>                                                                        { return this.http.delete<void>(`${this.url}/${id}`); }
}
