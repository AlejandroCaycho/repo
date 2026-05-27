import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Rol, RolRequest, Permiso } from '../../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class RolService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.api.auth}/roles`;

  listar(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.baseUrl);
  }

  crear(data: RolRequest): Observable<Rol> {
    return this.http.post<Rol>(this.baseUrl, data);
  }

  actualizar(id: number, data: RolRequest): Observable<Rol> {
    return this.http.put<Rol>(`${this.baseUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  private readonly permisoUrl = `${environment.api.auth}/permisos`;

  listarPermisosPorRol(rolId: number): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.permisoUrl}/rol/${rolId}`);
  }

  asignarPermiso(data: { rolId: number; permisoId: number }): Observable<any> {
    return this.http.post(`${this.permisoUrl}/asignar`, data);
  }

  quitarPermiso(data: { rolId: number; permisoId: number }): Observable<any> {
    return this.http.delete(`${this.permisoUrl}/rol/${data.rolId}/permiso/${data.permisoId}`);
  }

  private readonly usuarioRolUrl = `${environment.api.auth}/usuario-roles`;

  listarRolesPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.usuarioRolUrl}/usuario/${usuarioId}`);
  }

  listarUsuariosPorRol(rolId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.usuarioRolUrl}/rol/${rolId}`);
  }

  asignarRolAUsuario(data: { usuarioId: number; rolId: number; asignadoPor?: number }): Observable<any> {
    return this.http.post(this.usuarioRolUrl, data);
  }

  quitarRolAUsuario(usuarioId: number, rolId: number): Observable<any> {
    return this.http.delete(`${this.usuarioRolUrl}/${usuarioId}/${rolId}`);
  }
}
