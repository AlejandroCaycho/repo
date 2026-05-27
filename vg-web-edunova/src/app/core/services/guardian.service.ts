import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Guardian, GuardianRequest } from '../interfaces/guardian.interface';

@Injectable({ providedIn: 'root' })
export class GuardianService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8083/api/guardians';

  listarTodas(): Observable<Guardian[]> {
    return this.http.get<Guardian[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Guardian> {
    return this.http.get<Guardian>(`${this.baseUrl}/${id}`);
  }

  crear(data: GuardianRequest): Observable<Guardian> {
    return this.http.post<Guardian>(this.baseUrl, data);
  }

  actualizar(id: number, data: GuardianRequest): Observable<Guardian> {
    return this.http.put<Guardian>(`${this.baseUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  softDelete(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/soft-delete`, {});
  }

  activar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/activate`, {});
  }

  buscarPorPersona(personId: number): Observable<Guardian> {
    return this.http.get<Guardian>(`${this.baseUrl}/person/${personId}`);
  }

  buscarPorOcupacion(occupation: string): Observable<Guardian[]> {
    return this.http.get<Guardian[]>(`${this.baseUrl}/occupation/${occupation}`);
  }
}