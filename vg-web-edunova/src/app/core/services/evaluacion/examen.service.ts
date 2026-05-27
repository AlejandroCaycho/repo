import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ExamenRequest,
  ExamenResponse,
  ExamenPreguntaRequest,
  ExamenPreguntaResponse,
  ExamenRespuestaRequest,
  ExamenRespuestaResponse,
  ExamenResultadoRequest,
  ExamenResultadoResponse
} from '../../interfaces/evaluacion.interface';

@Injectable({
  providedIn: 'root'
})
export class ExamenService {
  private readonly apiUrl = `${environment.gradingUrl}/api/v1/grading/examenes`;

  constructor(private http: HttpClient) {}

  // Exámenes
  crear(request: ExamenRequest): Observable<ExamenResponse> {
    return this.http.post<ExamenResponse>(this.apiUrl, request);
  }

  obtenerPorId(id: number): Observable<ExamenResponse> {
    return this.http.get<ExamenResponse>(`${this.apiUrl}/${id}`);
  }

  listarTodos(): Observable<ExamenResponse[]> {
    return this.http.get<ExamenResponse[]>(this.apiUrl);
  }

  listarPorClase(claseId: number): Observable<ExamenResponse[]> {
    return this.http.get<ExamenResponse[]>(`${this.apiUrl}/clase/${claseId}`);
  }

  listarActivos(claseId: number): Observable<ExamenResponse[]> {
    return this.http.get<ExamenResponse[]>(`${this.apiUrl}/clase/${claseId}/activos`);
  }

  publicar(id: number): Observable<ExamenResponse> {
    return this.http.patch<ExamenResponse>(`${this.apiUrl}/${id}/publicar`, {});
  }

  finalizar(id: number): Observable<ExamenResponse> {
    return this.http.patch<ExamenResponse>(`${this.apiUrl}/${id}/finalizar`, {});
  }

  // Preguntas del examen
  agregarPregunta(request: ExamenPreguntaRequest): Observable<ExamenPreguntaResponse> {
    return this.http.post<ExamenPreguntaResponse>(`${this.apiUrl}/preguntas`, request);
  }

  listarPreguntas(examenId: number): Observable<ExamenPreguntaResponse[]> {
    return this.http.get<ExamenPreguntaResponse[]>(`${this.apiUrl}/${examenId}/preguntas`);
  }

  // Respuestas y resultados
  registrarRespuesta(request: ExamenRespuestaRequest): Observable<ExamenRespuestaResponse> {
    return this.http.post<ExamenRespuestaResponse>(`${this.apiUrl}/respuestas`, request);
  }

  iniciarExamen(request: ExamenResultadoRequest): Observable<ExamenResultadoResponse> {
    return this.http.post<ExamenResultadoResponse>(`${this.apiUrl}/iniciar`, request);
  }

  finalizarIntento(examenId: number, estudianteId: number, intentoNumero: number): Observable<ExamenResultadoResponse> {
    return this.http.post<ExamenResultadoResponse>(
      `${this.apiUrl}/${examenId}/estudiante/${estudianteId}/intento/${intentoNumero}/finalizar`,
      {}
    );
  }

  listarResultados(examenId: number): Observable<ExamenResultadoResponse[]> {
    return this.http.get<ExamenResultadoResponse[]>(`${this.apiUrl}/${examenId}/resultados`);
  }

  obtenerResultadoEstudiante(examenId: number, estudianteId: number, intentoNumero: number): Observable<ExamenResultadoResponse> {
    return this.http.get<ExamenResultadoResponse>(
      `${this.apiUrl}/${examenId}/estudiante/${estudianteId}/intento/${intentoNumero}/resultado`
    );
  }
}
