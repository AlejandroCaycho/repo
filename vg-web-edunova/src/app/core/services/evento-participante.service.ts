import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EventoParticipanteRequest, EventoParticipanteResponse } from '../interfaces/welfare.interfaces';

@Injectable({ providedIn: 'root' })
export class EventoParticipanteService {
  private url = `${environment.welfareUrl}/evento-participantes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<EventoParticipanteResponse[]>                                                                   { return this.http.get<EventoParticipanteResponse[]>(this.url); }
  getByEvento(eventoId: number): Observable<EventoParticipanteResponse[]>                                              { return this.http.get<EventoParticipanteResponse[]>(`${this.url}/evento/${eventoId}`); }
  getByUsuario(usuarioId: number): Observable<EventoParticipanteResponse[]>                                            { return this.http.get<EventoParticipanteResponse[]>(`${this.url}/usuario/${usuarioId}`); }
  getOne(eventoId: number, usuarioId: number): Observable<EventoParticipanteResponse>                                  { return this.http.get<EventoParticipanteResponse>(`${this.url}/evento/${eventoId}/usuario/${usuarioId}`); }
  create(data: EventoParticipanteRequest): Observable<EventoParticipanteResponse>                                      { return this.http.post<EventoParticipanteResponse>(this.url, data); }
  update(eId: number, uId: number, data: EventoParticipanteRequest): Observable<EventoParticipanteResponse>            { return this.http.put<EventoParticipanteResponse>(`${this.url}/evento/${eId}/usuario/${uId}`, data); }
  delete(eventoId: number, usuarioId: number): Observable<void>                                                        { return this.http.delete<void>(`${this.url}/evento/${eventoId}/usuario/${usuarioId}`); }
}
