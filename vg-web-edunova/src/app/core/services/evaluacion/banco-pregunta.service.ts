import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BancoPreguntaRequest, BancoPreguntaResponse } from '../../interfaces/evaluacion.interface';

@Injectable({
  providedIn: 'root'
})
export class BancoPreguntaService {
  private readonly baseUrl = `${environment.gradingUrl}/api/v1/grading/banco-preguntas`;

  constructor(private http: HttpClient) {}

  /**
   * Crear una nueva pregunta
   */
  crear(request: BancoPreguntaRequest): Observable<BancoPreguntaResponse> {
    return this.http.post<BancoPreguntaResponse>(this.baseUrl, request);
  }

  /**
   * Obtener pregunta por ID
   */
  obtenerPorId(id: number): Observable<BancoPreguntaResponse> {
    return this.http.get<BancoPreguntaResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Actualizar pregunta
   */
  actualizar(id: number, request: BancoPreguntaRequest): Observable<BancoPreguntaResponse> {
    return this.http.put<BancoPreguntaResponse>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Eliminar pregunta
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Listar todas las preguntas
   */
  listarTodas(): Observable<BancoPreguntaResponse[]> {
    return this.http.get<BancoPreguntaResponse[]>(this.baseUrl);
  }

  /**
   * Listar preguntas por materia
   */
  listarPorMateria(materiaId: number): Observable<BancoPreguntaResponse[]> {
    return this.http.get<BancoPreguntaResponse[]>(`${this.baseUrl}/materia/${materiaId}`);
  }

  /**
   * Listar preguntas por profesor
   */
  listarPorProfesor(profesorId: number): Observable<BancoPreguntaResponse[]> {
    return this.http.get<BancoPreguntaResponse[]>(`${this.baseUrl}/profesor/${profesorId}`);
  }

  /**
   * Listar preguntas por dificultad
   */
  listarPorDificultad(dificultad: string): Observable<BancoPreguntaResponse[]> {
    return this.http.get<BancoPreguntaResponse[]>(`${this.baseUrl}/dificultad/${dificultad}`);
  }

  /**
   * Listar preguntas por tipo
   */
  listarPorTipo(tipo: string): Observable<BancoPreguntaResponse[]> {
    return this.http.get<BancoPreguntaResponse[]>(`${this.baseUrl}/tipo/${tipo}`);
  }

  /**
   * Listar preguntas por materia y tipo
   */
  listarPorMateriaTipo(materiaId: number, tipo: string): Observable<BancoPreguntaResponse[]> {
    return this.http.get<BancoPreguntaResponse[]>(`${this.baseUrl}/materia/${materiaId}/tipo/${tipo}`);
  }

  /**
   * Listar preguntas por materia y dificultad
   */
  listarPorMateriaDificultad(materiaId: number, dificultad: string): Observable<BancoPreguntaResponse[]> {
    return this.http.get<BancoPreguntaResponse[]>(`${this.baseUrl}/materia/${materiaId}/dificultad/${dificultad}`);
  }

  /**
   * Listar preguntas por tema
   */
  listarPorTema(tema: string): Observable<BancoPreguntaResponse[]> {
    return this.http.get<BancoPreguntaResponse[]>(`${this.baseUrl}/tema/${tema}`);
  }

  /**
   * Activar/Desactivar pregunta
   */
  cambiarEstado(id: number, activo: boolean): Observable<BancoPreguntaResponse> {
    return this.http.patch<BancoPreguntaResponse>(`${this.baseUrl}/${id}/estado`, { activo });
  }
}
