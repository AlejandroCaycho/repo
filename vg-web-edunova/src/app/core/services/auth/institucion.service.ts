import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Institucion, InstitucionRequest } from '../../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class InstitucionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.api.auth}/instituciones`;

  listar(): Observable<Institucion[]> {
    return this.http.get<Institucion[]>(this.baseUrl);
  }

  listarTodas(): Observable<Institucion[]> {
    return this.http.get<Institucion[]>(`${this.baseUrl}/todas`);
  }

  listarPorEstado(estado: string): Observable<Institucion[]> {
    return this.http.get<Institucion[]>(`${this.baseUrl}/estado/${estado}`);
  }

  obtenerPorUuid(uuid: string): Observable<Institucion> {
    return this.http.get<Institucion>(`${this.baseUrl}/${uuid}`);
  }

  crear(data: InstitucionRequest): Observable<Institucion> {
    return this.http.post<Institucion>(this.baseUrl, data);
  }

  actualizar(uuid: string, data: InstitucionRequest): Observable<Institucion> {
    return this.http.put<Institucion>(`${this.baseUrl}/${uuid}`, data);
  }

  activar(uuid: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${uuid}/activar`, {});
  }

  desactivar(uuid: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${uuid}/desactivar`, {});
  }

  eliminar(uuid: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${uuid}`);
  }
}
