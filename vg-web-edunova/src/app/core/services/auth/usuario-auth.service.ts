import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Usuario, UsuarioRequest } from '../../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class UsuarioAuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.api.auth}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl);
  }

  listarPorEstado(estado: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/estado/${estado}`);
  }

  listarPorInstitucion(institucionId: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/institucion/${institucionId}`);
  }

  listarPorInstitucionYEstado(institucionId: number, estado: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/institucion/${institucionId}/estado/${estado}`);
  }

  crear(data: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.baseUrl, data);
  }

  actualizar(uuid: string, data: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${uuid}`, data);
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

  subirFoto(uuid: string, file: File): Observable<Usuario> {
    const fd = new FormData();
    fd.append('foto', file, file.name);
    return this.http.post<Usuario>(`${this.baseUrl}/${uuid}/foto`, fd);
  }

  obtenerFoto(uuid: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${uuid}/foto`, { responseType: 'blob' });
  }
}
