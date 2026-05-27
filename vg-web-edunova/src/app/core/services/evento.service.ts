import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EventoRequest, EventoResponse } from '../interfaces/welfare.interfaces';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private url = `${environment.welfareUrl}/eventos`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<EventoResponse[]>                                       { return this.http.get<EventoResponse[]>(this.url); }
  getActivos(): Observable<EventoResponse[]>                                   { return this.http.get<EventoResponse[]>(`${this.url}/activos`); }
  getCancelados(): Observable<EventoResponse[]>                                { return this.http.get<EventoResponse[]>(`${this.url}/cancelados`); }
  getByInstitucion(id: number): Observable<EventoResponse[]>                   { return this.http.get<EventoResponse[]>(`${this.url}/institucion/${id}`); }
  getByTipo(tipo: string): Observable<EventoResponse[]>                        { return this.http.get<EventoResponse[]>(`${this.url}/tipo/${tipo}`); }
  getByEstado(estado: string): Observable<EventoResponse[]>                    { return this.http.get<EventoResponse[]>(`${this.url}/estado/${estado}`); }
  getById(id: number): Observable<EventoResponse>                              { return this.http.get<EventoResponse>(`${this.url}/${id}`); }
  create(data: EventoRequest): Observable<EventoResponse>                      { return this.http.post<EventoResponse>(this.url, data); }
  update(id: number, data: EventoRequest): Observable<EventoResponse>          { return this.http.put<EventoResponse>(`${this.url}/${id}`, data); }
  activar(id: number): Observable<EventoResponse>                              { return this.http.patch<EventoResponse>(`${this.url}/${id}/activar`, {}); }
  cancelar(id: number): Observable<EventoResponse>                             { return this.http.patch<EventoResponse>(`${this.url}/${id}/cancelar`, {}); }
  delete(id: number): Observable<void>                                         { return this.http.delete<void>(`${this.url}/${id}`); }
}
