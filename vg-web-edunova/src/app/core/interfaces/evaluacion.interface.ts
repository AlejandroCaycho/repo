// ============================================
// CALIFICACIONES
// ============================================
export interface CalificacionRequest {
  estudianteId: number;
  claseId: number;
  periodoAcademicoId: number;
  tipoCalificacion: string;
  calificacion: number;
  observaciones?: string;
}

export interface CalificacionResponse {
  id: number;
  estudianteId: number;
  claseId: number;
  periodoAcademicoId: number;
  tipoCalificacion: string;
  calificacion: number;
  observaciones?: string;
  fechaRegistro: string;
}

// ============================================
// EXÁMENES
// ============================================
export interface ExamenRequest {
  claseId: number;
  criterioId?: number;
  titulo: string;
  descripcion?: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  duracionMinutos?: number;
  puntajeTotal: number;
  puntajeAprobatorio: number;
  intentosPermitidos?: number;
  aleatorizar?: boolean;
  mostrarResultados?: boolean;
  estado?: string;
}

export interface ExamenResponse {
  id: number;
  claseId: number;
  criterioId?: number;
  titulo: string;
  descripcion?: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  duracionMinutos?: number;
  puntajeTotal: number;
  puntajeAprobatorio: number;
  intentosPermitidos?: number;
  aleatorizar?: boolean;
  mostrarResultados?: boolean;
  estado?: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface ExamenPreguntaRequest {
  examenId: number;
  bancoPreguntaId: number;
  orden: number;
  puntaje: number;
}

export interface ExamenPreguntaResponse {
  id: number;
  examenId: number;
  bancoPreguntaId: number;
  orden: number;
  puntaje: number;
}

export interface ExamenRespuestaRequest {
  examenResultadoId: number;
  examenPreguntaId: number;
  respuestaSeleccionada: string;
  esCorrecta: boolean;
  puntajeObtenido: number;
}

export interface ExamenRespuestaResponse {
  id: number;
  examenResultadoId: number;
  examenPreguntaId: number;
  respuestaSeleccionada: string;
  esCorrecta: boolean;
  puntajeObtenido: number;
}

export interface ExamenResultadoRequest {
  examenId: number;
  estudianteId: number;
  fechaInicio: string;
  fechaFin?: string;
  puntajeObtenido: number;
  puntajeTotal: number;
  porcentaje: number;
  aprobado: boolean;
  intentoNumero: number;
}

export interface ExamenResultadoResponse {
  id: number;
  examenId: number;
  estudianteId: number;
  fechaInicio: string;
  fechaFin?: string;
  puntajeObtenido: number;
  puntajeTotal: number;
  porcentaje: number;
  aprobado: boolean;
  intentoNumero: number;
}

// ============================================
// PROMEDIOS
// ============================================
export interface PromedioPeriodoRequest {
  estudianteId: number;
  claseId: number;
  periodoAcademicoId: number;
  promedio: number;
  aprobado: boolean;
}

export interface PromedioPeriodoResponse {
  id: number;
  estudianteId: number;
  claseId: number;
  periodoAcademicoId: number;
  promedio: number;
  aprobado: boolean;
  fechaCalculo: string;
}

// ============================================
// BANCO DE PREGUNTAS
// ============================================
export interface BancoPreguntaRequest {
  materiaId: number;
  profesorId: number;
  tipo: string;
  dificultad: string;
  enunciado: string;
  opciones?: string;
  respuestaClave: string;
  explicacion?: string;
  tags?: string;
}

export interface BancoPreguntaResponse {
  id: number;
  materiaId: number;
  profesorId: number;
  nombreMateria?: string;
  nombreProfesor?: string;
  tipo: string;
  dificultad: string;
  enunciado: string;
  opciones?: string;
  respuestaClave: string;
  explicacion?: string;
  tags?: string;
  createdAt: string;
}

// ============================================
// MATERIA (para selects)
// ============================================
export interface MateriaDto {
  id: number;
  nombre: string;
  codigo?: string;
}

// ============================================
// PROFESOR (para selects)
// ============================================
export interface ProfesorDto {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto?: string;
  personId?: number;
}
