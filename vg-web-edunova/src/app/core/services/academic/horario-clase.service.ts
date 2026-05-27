import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HorarioClase } from '../../interfaces/academic.interface';

@Injectable({ providedIn: 'root' })
export class HorarioClaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.academicApiUrl}/horarios-clase`;

  listar(): Observable<HorarioClase[]> {
    return this.http.get<HorarioClase[]>(this.baseUrl);
  }

  crear(horario: HorarioClase): Observable<HorarioClase> {
    return this.http.post<HorarioClase>(this.baseUrl, horario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarPorClase(claseId: number): Observable<HorarioClase[]> {
    return this.http.get<HorarioClase[]>(`${this.baseUrl}/clase/${claseId}`);
  }
}
