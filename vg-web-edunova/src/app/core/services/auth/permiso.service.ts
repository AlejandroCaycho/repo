import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Permiso, PermisoRequest } from '../../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class PermisoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.api.auth}/permisos`;

  listar(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(this.baseUrl);
  }

  crear(data: PermisoRequest): Observable<Permiso> {
    return this.http.post<Permiso>(this.baseUrl, data);
  }

  actualizar(id: number, data: PermisoRequest): Observable<Permiso> {
    return this.http.put<Permiso>(`${this.baseUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  cambiarEstado(id: number, estado: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/estado`, { estado });
  }
}
