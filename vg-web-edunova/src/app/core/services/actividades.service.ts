import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TallerRequest, TallerResponse,
  TallerEstudianteRequest, TallerEstudianteResponse,
  ProgramaRecuperacionRequest, ProgramaRecuperacionResponse,
  ProgramaRecuperacionEstudianteRequest, ProgramaRecuperacionEstudianteResponse,
  EventoInstitucionalRequest, EventoInstitucionalResponse,
  ParticipacionEstudiantilRequest, ParticipacionEstudiantilResponse,
} from '../interfaces/actividades.interfaces';

@Injectable({ providedIn: 'root' })
export class TallerService {
  private url = environment.activityUrl + '/talleres';
  constructor(private http: HttpClient) {}
  getAll(): Observable<TallerResponse[]>                    { return this.http.get<TallerResponse[]>(this.url); }
  getById(id: number): Observable<TallerResponse>           { return this.http.get<TallerResponse>(this.url + '/' + id); }
  create(data: TallerRequest): Observable<TallerResponse>   { return this.http.post<TallerResponse>(this.url, data); }
  update(id: number, data: TallerRequest): Observable<TallerResponse> { return this.http.put<TallerResponse>(this.url + '/' + id, data); }
  toggleEstado(id: number): Observable<TallerResponse>      { return this.http.patch<TallerResponse>(this.url + '/' + id + '/toggle', {}); }
  delete(id: number): Observable<void>                      { return this.http.delete<void>(this.url + '/' + id); }
}

@Injectable({ providedIn: 'root' })
export class TallerEstudianteService {
  private url = environment.activityUrl + '/talleres-estudiantes';
  constructor(private http: HttpClient) {}
  getAll(): Observable<TallerEstudianteResponse[]>                    { return this.http.get<TallerEstudianteResponse[]>(this.url); }
  getById(id: number): Observable<TallerEstudianteResponse>           { return this.http.get<TallerEstudianteResponse>(this.url + '/' + id); }
  create(data: TallerEstudianteRequest): Observable<TallerEstudianteResponse>   { return this.http.post<TallerEstudianteResponse>(this.url, data); }
  update(id: number, data: TallerEstudianteRequest): Observable<TallerEstudianteResponse> { return this.http.put<TallerEstudianteResponse>(this.url + '/' + id, data); }
  eliminar(id: number): Observable<TallerEstudianteResponse>          { return this.http.patch<TallerEstudianteResponse>(this.url + '/' + id + '/eliminar', {}); }
  restaurar(id: number): Observable<TallerEstudianteResponse>         { return this.http.patch<TallerEstudianteResponse>(this.url + '/' + id + '/restaurar', {}); }
  toggleEstado(id: number): Observable<TallerEstudianteResponse>      { return this.http.patch<TallerEstudianteResponse>(this.url + '/' + id + '/toggle', {}); }
  delete(id: number): Observable<void>                                 { return this.http.delete<void>(this.url + '/' + id); }
}

@Injectable({ providedIn: 'root' })
export class ProgramaRecuperacionService {
  private url = environment.activityUrl + '/programas-recuperacion';
  constructor(private http: HttpClient) {}
  getAll(): Observable<ProgramaRecuperacionResponse[]>                    { return this.http.get<ProgramaRecuperacionResponse[]>(this.url); }
  getById(id: number): Observable<ProgramaRecuperacionResponse>           { return this.http.get<ProgramaRecuperacionResponse>(this.url + '/' + id); }
  create(data: ProgramaRecuperacionRequest): Observable<ProgramaRecuperacionResponse>   { return this.http.post<ProgramaRecuperacionResponse>(this.url, data); }
  update(id: number, data: ProgramaRecuperacionRequest): Observable<ProgramaRecuperacionResponse> { return this.http.put<ProgramaRecuperacionResponse>(this.url + '/' + id, data); }
  toggleEstado(id: number): Observable<ProgramaRecuperacionResponse>      { return this.http.patch<ProgramaRecuperacionResponse>(this.url + '/' + id + '/toggle', {}); }
  delete(id: number): Observable<void>                                     { return this.http.delete<void>(this.url + '/' + id); }
}

@Injectable({ providedIn: 'root' })
export class ProgramaRecuperacionEstudianteService {
  private url = environment.activityUrl + '/programas-recuperacion-estudiantes';
  constructor(private http: HttpClient) {}
  getAll(): Observable<ProgramaRecuperacionEstudianteResponse[]>                    { return this.http.get<ProgramaRecuperacionEstudianteResponse[]>(this.url); }
  getById(id: number): Observable<ProgramaRecuperacionEstudianteResponse>           { return this.http.get<ProgramaRecuperacionEstudianteResponse>(this.url + '/' + id); }
  create(data: ProgramaRecuperacionEstudianteRequest): Observable<ProgramaRecuperacionEstudianteResponse>   { return this.http.post<ProgramaRecuperacionEstudianteResponse>(this.url, data); }
  update(id: number, data: ProgramaRecuperacionEstudianteRequest): Observable<ProgramaRecuperacionEstudianteResponse> { return this.http.put<ProgramaRecuperacionEstudianteResponse>(this.url + '/' + id, data); }
  eliminar(id: number): Observable<ProgramaRecuperacionEstudianteResponse>          { return this.http.patch<ProgramaRecuperacionEstudianteResponse>(this.url + '/' + id + '/eliminar', {}); }
  restaurar(id: number): Observable<ProgramaRecuperacionEstudianteResponse>         { return this.http.patch<ProgramaRecuperacionEstudianteResponse>(this.url + '/' + id + '/restaurar', {}); }
  toggleEstado(id: number): Observable<ProgramaRecuperacionEstudianteResponse>      { return this.http.patch<ProgramaRecuperacionEstudianteResponse>(this.url + '/' + id + '/toggle', {}); }
  delete(id: number): Observable<void>                                               { return this.http.delete<void>(this.url + '/' + id); }
}

@Injectable({ providedIn: 'root' })
export class EventoInstitucionalService {
  private url = environment.activityUrl + '/eventos-institucionales';
  constructor(private http: HttpClient) {}
  getAll(): Observable<EventoInstitucionalResponse[]>                    { return this.http.get<EventoInstitucionalResponse[]>(this.url); }
  getById(id: number): Observable<EventoInstitucionalResponse>           { return this.http.get<EventoInstitucionalResponse>(this.url + '/' + id); }
  create(data: EventoInstitucionalRequest): Observable<EventoInstitucionalResponse>   { return this.http.post<EventoInstitucionalResponse>(this.url, data); }
  update(id: number, data: EventoInstitucionalRequest): Observable<EventoInstitucionalResponse> { return this.http.put<EventoInstitucionalResponse>(this.url + '/' + id, data); }
  toggleEstado(id: number): Observable<EventoInstitucionalResponse>      { return this.http.patch<EventoInstitucionalResponse>(this.url + '/' + id + '/toggle', {}); }
  delete(id: number): Observable<void>                                    { return this.http.delete<void>(this.url + '/' + id); }
}

@Injectable({ providedIn: 'root' })
export class ParticipacionEstudiantilService {
  private url = environment.activityUrl + '/participaciones-estudiantiles';
  constructor(private http: HttpClient) {}
  getAll(): Observable<ParticipacionEstudiantilResponse[]>                    { return this.http.get<ParticipacionEstudiantilResponse[]>(this.url); }
  getById(id: number): Observable<ParticipacionEstudiantilResponse>           { return this.http.get<ParticipacionEstudiantilResponse>(this.url + '/' + id); }
  create(data: ParticipacionEstudiantilRequest): Observable<ParticipacionEstudiantilResponse>   { return this.http.post<ParticipacionEstudiantilResponse>(this.url, data); }
  update(id: number, data: ParticipacionEstudiantilRequest): Observable<ParticipacionEstudiantilResponse> { return this.http.put<ParticipacionEstudiantilResponse>(this.url + '/' + id, data); }
  eliminar(id: number): Observable<void>                                     { return this.http.patch<void>(this.url + '/' + id + '/eliminar', {}); }
  restaurar(id: number): Observable<void>                                    { return this.http.patch<void>(this.url + '/' + id + '/restaurar', {}); }
  toggleEstado(id: number): Observable<ParticipacionEstudiantilResponse>     { return this.http.patch<ParticipacionEstudiantilResponse>(this.url + '/' + id + '/toggle', {}); }
  delete(id: number): Observable<void>                                        { return this.http.delete<void>(this.url + '/' + id); }
}

export interface EstudianteLookup    { id: number; nombre: string; apellido: string; }
export interface TallerLookup        { id: number; nombre: string; }
export interface ProgramaRecupLookup { id: number; nombre: string; }

@Injectable({ providedIn: 'root' })
export class LookupService {
  // Rutas relativas → pasan por el proxy de Angular (proxy.conf.json) → sin CORS
  // /student-api  → 8083  pathRewrite: /student-api → ""  → /api/students/{id}
  // /activity-api → 8087  pathRewrite: /activity-api → /api/v1

  constructor(private http: HttpClient) {}

  getEstudiante(id: number): Observable<EstudianteLookup> {
    return this.http.get<any>(`/student-api/api/students/${id}`).pipe(
      map((r: any) => ({
        id: r.id,
        nombre:   r.personName?.split(' ')[0] ?? r.firstName ?? `ID ${id}`,
        apellido: r.personName?.split(' ').slice(1).join(' ') ?? r.lastName ?? '',
      }))
    );
  }

  getTaller(id: number): Observable<TallerLookup> {
    return this.http.get<TallerLookup>(`/activity-api/talleres/${id}`);
  }

  getProgramaRecuperacion(id: number): Observable<ProgramaRecupLookup> {
    return this.http.get<ProgramaRecupLookup>(`/activity-api/programas-recuperacion/${id}`);
  }
}