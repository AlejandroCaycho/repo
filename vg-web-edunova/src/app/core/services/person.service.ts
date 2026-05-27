import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Person, PersonRequest } from '../interfaces/person.interface';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8083/api/people';

  listarTodas(): Observable<Person[]> {
    return this.http.get<Person[]>(this.baseUrl);
  }

  // Nuevo método para obtener opciones para select
  listarParaSelect(): Observable<Person[]> {
    return this.http.get<Person[]>(`${this.baseUrl}?isActive=true`);
  }

  obtenerPorId(id: number): Observable<Person> {
    return this.http.get<Person>(`${this.baseUrl}/${id}`);
  }

  crear(data: PersonRequest): Observable<Person> {
    return this.http.post<Person>(this.baseUrl, data);
  }

  actualizar(id: number, data: PersonRequest): Observable<Person> {
    return this.http.put<Person>(`${this.baseUrl}/${id}`, data);
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
}