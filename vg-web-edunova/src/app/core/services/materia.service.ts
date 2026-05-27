import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Materia {
  id: number;
  institucionId: number;
  nivelId: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  creditos: number;
  horasSemana: number;
  color: string | null;
  esObligatoria: boolean;
  activa: boolean;
  createdAt: string;
}

export interface Clase {
  id: number;
  profesorId: number;
  gradoId: number;
  materiaId: number;
  aulaId: number | null;
  anoAcademicoId: number;
  modalidad: string;
  enlaceVirtual: string | null;
  descripcion: string | null;
  activa: boolean;
  createdAt: string;
}


@Injectable({ providedIn: 'root' })
export class MateriaService {
  private apiUrl = 'http://localhost:8082/api';
  

  constructor(private http: HttpClient) {}

  getMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(`${this.apiUrl}/materias`);
  }

  getClases(): Observable<Clase[]> {
    return this.http.get<Clase[]>(`${this.apiUrl}/clases`);
  }

  getClasesByProfesor(profesorId: number): Observable<Clase[]> {
    return this.http.get<Clase[]>(`${this.apiUrl}/clases?profesorId=${profesorId}`);
  }
}
