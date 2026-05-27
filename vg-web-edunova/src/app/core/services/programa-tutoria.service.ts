import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProgramaTutoriaRequest, ProgramaTutoriaResponse } from '../interfaces/welfare.interfaces';

@Injectable({ providedIn: 'root' })
export class ProgramaTutoriaService {
  private url = `${environment.welfareUrl}/programas-tutoria`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ProgramaTutoriaResponse[]>                                          { return this.http.get<ProgramaTutoriaResponse[]>(this.url); }
  getActivos(): Observable<ProgramaTutoriaResponse[]>                                      { return this.http.get<ProgramaTutoriaResponse[]>(`${this.url}/activos`); }
  getInactivos(): Observable<ProgramaTutoriaResponse[]>                                    { return this.http.get<ProgramaTutoriaResponse[]>(`${this.url}/inactivos`); }
  getByInstitucion(id: number): Observable<ProgramaTutoriaResponse[]>                      { return this.http.get<ProgramaTutoriaResponse[]>(`${this.url}/institucion/${id}`); }
  getByAnoAcademico(id: number): Observable<ProgramaTutoriaResponse[]>                     { return this.http.get<ProgramaTutoriaResponse[]>(`${this.url}/ano-academico/${id}`); }
  getByTipo(tipo: string): Observable<ProgramaTutoriaResponse[]>                           { return this.http.get<ProgramaTutoriaResponse[]>(`${this.url}/tipo/${tipo}`); }
  getById(id: number): Observable<ProgramaTutoriaResponse>                                 { return this.http.get<ProgramaTutoriaResponse>(`${this.url}/${id}`); }
  create(data: ProgramaTutoriaRequest): Observable<ProgramaTutoriaResponse>                { return this.http.post<ProgramaTutoriaResponse>(this.url, data); }
  update(id: number, data: ProgramaTutoriaRequest): Observable<ProgramaTutoriaResponse>    { return this.http.put<ProgramaTutoriaResponse>(`${this.url}/${id}`, data); }
  activar(id: number): Observable<ProgramaTutoriaResponse>                                 { return this.http.patch<ProgramaTutoriaResponse>(`${this.url}/${id}/activar`, {}); }
  desactivar(id: number): Observable<ProgramaTutoriaResponse>                              { return this.http.patch<ProgramaTutoriaResponse>(`${this.url}/${id}/desactivar`, {}); }
  delete(id: number): Observable<void>                                                     { return this.http.delete<void>(`${this.url}/${id}`); }
}
