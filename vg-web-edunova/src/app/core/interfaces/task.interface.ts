export interface Task {
  id: number;
  titulo: string;
  descripcion: string;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  fechaVencimiento: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  usuarioAsignadoId: number;
  usuarioAsignadoNombre?: string;
  usuarioCreadorId: number;
  usuarioCreadorNombre?: string;
  categoriaId?: number;
  categoriaNombre?: string;
  completada: boolean;
  porcentajeCompletado: number;
  adjuntos?: TaskAdjunto[];
  comentarios?: TaskComentario[];
}

export interface TaskAdjunto {
  id: number;
  taskId: number;
  nombre: string;
  url: string;
  tipo: string;
  tamanoKb: number;
}

export interface TaskComentario {
  id: number;
  taskId: number;
  usuarioId: number;
  usuarioNombre: string;
  comentario: string;
  fecha: string;
}

export interface CreateTaskDTO {
  titulo: string;
  descripcion: string;
  prioridad: string;
  fechaVencimiento: string;
  usuarioAsignadoId: number;
  categoriaId?: number;
}

export interface UpdateTaskDTO {
  titulo?: string;
  descripcion?: string;
  estado?: string;
  prioridad?: string;
  fechaVencimiento?: string;
  usuarioAsignadoId?: number;
  porcentajeCompletado?: number;
}
