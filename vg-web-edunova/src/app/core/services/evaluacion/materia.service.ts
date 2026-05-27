import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { MateriaDto } from '../../interfaces/evaluacion.interface';

interface MateriaResponse {
  id: number;
  institucionId: number;
  nivelId: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  creditos: number;
  horasSemana: number;
  color: string;
  esObligatoria: boolean;
  activa: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MateriaService {
  private readonly baseUrl = `${environment.academicUrl}/api/materias`;

  constructor(private http: HttpClient) {}

  /**
   * Listar todas las materias activas
   */
  listarTodas(): Observable<MateriaDto[]> {
    return this.http.get<MateriaResponse[]>(this.baseUrl).pipe(
      map(materias => materias
        .filter(m => m.activa)
        .map(m => ({
          id: m.id,
          nombre: m.nombre,
          codigo: m.codigo
        }))
      )
    );
  }

  /**
   * Obtener materia por ID
   */
  obtenerPorId(id: number): Observable<MateriaDto> {
    return this.http.get<MateriaResponse>(`${this.baseUrl}/${id}`).pipe(
      map(m => ({
        id: m.id,
        nombre: m.nombre,
        codigo: m.codigo
      }))
    );
  }
}
