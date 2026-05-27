import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Grupo, Mensaje, StatsResponse, AdjuntoMensaje, NotificacionItem, GrupoUpdateRequest, GrupoMiembroResponse, NotificacionRequest, PlantillaNotificacionRequest } from '../interfaces/comms.interface';

@Injectable({
  providedIn: 'root'
})
export class CommsService {
  private apiUrl = '/api/comms';

  constructor(private http: HttpClient) {}

  // ──────────────────────────────────────────
  // GRUPOS (8 endpoints)
  // ──────────────────────────────────────────

  getGruposPorInstitucion(institucionId: number): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/grupos/institucion/${institucionId}`);
  }

  getGruposPorUsuario(usuarioId: number): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/grupos/usuario/${usuarioId}`);
  }

  getGrupoPorId(id: number): Observable<Grupo> {
    return this.http.get<Grupo>(`${this.apiUrl}/grupos/${id}`);
  }

  crearGrupo(nombre: string, descripcion: string, institucionId: number, creadorId: number, esOficial: boolean = true, fotoGrupoUrl?: string): Observable<Grupo> {
    const payload: any = { nombre, descripcion, institucionId, creadorId, esOficial };
    if (fotoGrupoUrl) payload.fotoGrupoUrl = fotoGrupoUrl;
    return this.http.post<Grupo>(`${this.apiUrl}/grupos`, payload);
  }

  actualizarGrupo(id: number, data: GrupoUpdateRequest): Observable<Grupo> {
    return this.http.patch<Grupo>(`${this.apiUrl}/grupos/${id}`, data);
  }

  getMiembrosGrupo(grupoId: number): Observable<GrupoMiembroResponse[]> {
    return this.http.get<GrupoMiembroResponse[]>(`${this.apiUrl}/grupos/${grupoId}/miembros`);
  }

  agregarMiembro(grupoId: number, usuarioId: number, rol: string = 'miembro'): Observable<GrupoMiembroResponse> {
    const payload = { grupoId, usuarioId, rol };
    return this.http.post<GrupoMiembroResponse>(`${this.apiUrl}/grupos/miembros`, payload);
  }

  abandonarGrupo(grupoId: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/grupos/${grupoId}/miembros/${usuarioId}`);
  }

  // ──────────────────────────────────────────
  // MENSAJES (10 endpoints)
  // ──────────────────────────────────────────

  enviarMensaje(grupoId: number, remitenteId: number, contenido: string, asunto?: string): Observable<Mensaje> {
    const payload: any = { grupoId, remitenteId, contenido, asunto: asunto || '' };
    return this.http.post<Mensaje>(`${this.apiUrl}/mensajes`, payload);
  }

  getMensajesPorGrupo(grupoId: number, usuarioId?: number): Observable<Mensaje[]> {
    const url = usuarioId
      ? `${this.apiUrl}/mensajes/grupo/${grupoId}?usuarioId=${usuarioId}`
      : `${this.apiUrl}/mensajes/grupo/${grupoId}`;
    return this.http.get<Mensaje[]>(url);
  }

  buscarMensajes(usuarioId: number, query: string): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/mensajes/buscar?usuarioId=${usuarioId}&query=${encodeURIComponent(query)}`);
  }

  getAdjuntosPorMensaje(mensajeId: number): Observable<AdjuntoMensaje[]> {
    return this.http.get<AdjuntoMensaje[]>(`${this.apiUrl}/mensajes/${mensajeId}/adjuntos`);
  }

  marcarMensajeLeido(mensajeId: number, usuarioId: number): Observable<void> {
    const payload = { mensajeId, usuarioId };
    return this.http.patch<void>(`${this.apiUrl}/mensajes/estado`, payload);
  }

  adjuntarArchivo(mensajeId: number, tipo: string, nombre: string, url: string, tamanoKb: number): Observable<any> {
    const payload = { mensajeId, tipo, nombre, url, tamanoKb };
    return this.http.post<any>(`${this.apiUrl}/mensajes/adjuntos`, payload);
  }

  eliminarMensajeParaTodos(mensajeId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/mensajes/${mensajeId}`);
  }

  restaurarMensajeParaTodos(mensajeId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/mensajes/${mensajeId}/restaurar`, {});
  }

  eliminarMensajeParaMi(mensajeId: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/mensajes/${mensajeId}/mi?usuarioId=${usuarioId}`);
  }

  restaurarMensajeParaMi(mensajeId: number, usuarioId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/mensajes/${mensajeId}/mi/restaurar?usuarioId=${usuarioId}`, {});
  }

  // ──────────────────────────────────────────
  // NOTIFICACIONES (5 endpoints)
  // ──────────────────────────────────────────

  crearNotificacion(data: NotificacionRequest): Observable<NotificacionItem> {
    return this.http.post<NotificacionItem>(`${this.apiUrl}/notificaciones`, data);
  }

  getNotificacionesPorUsuario(usuarioId: number): Observable<NotificacionItem[]> {
    return this.http.get<NotificacionItem[]>(`${this.apiUrl}/notificaciones/usuario/${usuarioId}`);
  }

  marcarNotificacionLeida(notificacionId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/notificaciones/${notificacionId}/leida`, {});
  }

  eliminarNotificacion(notificacionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notificaciones/${notificacionId}`);
  }

  crearPlantillaNotificacion(data: PlantillaNotificacionRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/notificaciones/plantillas`, data);
  }

  // ──────────────────────────────────────────
  // STATS (1 endpoint)
  // ──────────────────────────────────────────

  getStats(usuarioId: number): Observable<StatsResponse> {
    return this.http.get<StatsResponse>(`${this.apiUrl}/stats/${usuarioId}`);
  }
}
