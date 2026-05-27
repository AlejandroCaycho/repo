export interface Grupo {
  id: number;
  nombre: string;
  descripcion: string;
  institucionId: number;
  creadorId: number;
  esOficial: boolean;
  archivado: boolean;
  fotoGrupoUrl: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface GrupoUpdateRequest {
  nombre?: string;
  descripcion?: string;
  fotoGrupoUrl?: string;
  archivado?: boolean;
}

export interface GrupoMiembroResponse {
  grupoId: number;
  usuarioId: number;
  rol: string;
  silenciado: boolean;
  joinedAt: string;
}

export interface Mensaje {
  id: number;
  grupoId: number;
  remitenteId: number;
  destinatarioId: number | null;
  mensajePadreId: number | null;
  asunto: string;
  contenido: string;
  esImportante: boolean;
  eliminadoRemitente: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StatsResponse {
  mensajesNuevos: number;
  gruposActivos: number;
  archivos: number;
  recordatorios: number;
}

export interface AdjuntoMensaje {
  id: number;
  mensajeId: number;
  tipo: string;
  nombre: string;
  url: string;
  tamanoKb: number;
  createdAt: string;
}

export interface NotificacionItem {
  id: number;
  usuarioId: number;
  titulo: string;
  contenido: string;
  tipo: string;
  referenciaId?: number | null;
  referenciaTabla?: string | null;
  leida: boolean;
  leidaEn?: string | null;
  enviadaPush?: boolean;
  enviadaEmail?: boolean;
  createdAt: string;
}

export interface NotificacionRequest {
  usuarioId: number;
  titulo: string;
  contenido: string;
  tipo: string;
  referenciaId?: number;
  referenciaTabla?: string;
}

export interface PlantillaNotificacionRequest {
  nombre: string;
  tipo: string;
  institucionId?: number;
  asuntoEmail?: string;
  cuerpoEmail?: string;
  cuerpoPush?: string;
  activa?: boolean;
}
