import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentoTutoriaResponse } from '../interfaces/welfare.interfaces';

@Injectable({ providedIn: 'root' })
export class DocumentoTutoriaService {
  private url = `${environment.welfareUrl}/documentos-tutoria`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<DocumentoTutoriaResponse[]>              { return this.http.get<DocumentoTutoriaResponse[]>(this.url); }
  getById(id: number): Observable<DocumentoTutoriaResponse>     { return this.http.get<DocumentoTutoriaResponse>(`${this.url}/${id}`); }
  delete(id: number): Observable<void>                          { return this.http.delete<void>(`${this.url}/${id}`); }
}
