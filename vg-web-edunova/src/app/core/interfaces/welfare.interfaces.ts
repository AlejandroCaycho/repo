// ============================================================
// Interfaces — vg-ms-welfare (puerto 8086)
// Autor backend: Salvador Quispe Cardenas
// ============================================================

// ── Error ────────────────────────────────────────────────────
export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}

// ── Módulo 0: Programas de Tutoría (MAESTRO) ─────────────────
export interface ProgramaTutoriaRequest {
  institucionId:   number;  // vg-ms-auth
  anoAcademicoId:  number;  // vg-ms-academic
  nombre:          string;
  tipo:            'GRUPAL' | 'INDIVIDUAL' | 'MIXTO';
  descripcion?:    string;
  objetivos?:      string;
}

export interface ProgramaTutoriaResponse {
  id:             number;
  institucionId:  number;
  anoAcademicoId: number;
  nombre:         string;
  tipo:           string;
  descripcion:    string | null;
  objetivos:      string | null;
  activo:         boolean;
  createdAt:      string;
  updatedAt:      string;
}

// ── Módulo 1: Tutores de Grado ────────────────────────────────
export interface TutorGradoRequest {
  programaTutoriaId: number;  // programas-tutoria (este servicio)
  profesorId:        number;  // vg-ms-student
  gradoId:           number;  // vg-ms-academic
  fechaInicio?:      string;  // YYYY-MM-DD
  fechaFin?:         string;  // YYYY-MM-DD
}

export interface TutorGradoResponse {
  id:                number;
  programaTutoriaId: number;
  profesorId:        number;
  gradoId:           number;
  fechaInicio:       string;
  fechaFin:          string | null;
  activo:            boolean;
  createdAt:         string;
  updatedAt:         string;
}

// ── Módulo 2: Tutores de Estudiante ──────────────────────────
export interface TutorEstudianteRequest {
  programaTutoriaId?: number;  // opcional
  profesorId:         number;  // vg-ms-student
  estudianteId:       number;  // vg-ms-student
  tipo:               'ACADEMICA' | 'PERSONAL' | 'VOCACIONAL' | 'DISCIPLINARIA' | 'EMOCIONAL';
  motivo?:            string;
  objetivos?:         string;
  fechaInicio?:       string;  // YYYY-MM-DD
  fechaFin?:          string;  // YYYY-MM-DD
  derivadoPor?:       number;  // vg-ms-auth
}

export interface TutorEstudianteResponse {
  id:                number;
  programaTutoriaId: number | null;
  profesorId:        number;
  estudianteId:      number;
  tipo:              string;
  motivo:            string | null;
  objetivos:         string | null;
  fechaInicio:       string;
  fechaFin:          string | null;
  estado:            'activa' | 'finalizada' | 'cancelada' | 'suspendida';
  derivadoPor:       number | null;
  createdAt:         string;
  updatedAt:         string;
}

// ── Módulo 3: Sesiones de Tutoría ────────────────────────────
export interface SesionTutoriaRequest {
  tutorEstudianteId?: number;
  tutorGradoId?:      number;
  fechaSesion:        string;  // YYYY-MM-DD
  horaInicio:         string;  // HH:mm
  horaFin?:           string;  // HH:mm — debe ser > horaInicio
  tipo:               'individual' | 'grupal' | 'familiar' | 'seguimiento';
  modalidad?:         'presencial' | 'virtual' | 'hibrida';
  temasTratados?:     string;
  acuerdos?:          string;
  compromisosAlumno?: string;
  compromisosTutor?:  string;
  proximaSesion?:     string;  // YYYY-MM-DD
  firmadoPorAlumno?:  boolean;
  firmadoPorPadre?:   boolean;
  observaciones?:     string;
}

export interface SesionTutoriaResponse {
  id:                 number;
  tutorEstudianteId:  number | null;
  tutorGradoId:       number | null;
  fechaSesion:        string;
  horaInicio:         string;  // HH:mm:ss
  horaFin:            string | null;
  tipo:               string;
  modalidad:          string;
  temasTratados:      string | null;
  acuerdos:           string | null;
  compromisosAlumno:  string | null;
  compromisosTutor:   string | null;
  proximaSesion:      string | null;
  firmadoPorAlumno:   boolean;
  firmadoPorPadre:    boolean;
  observaciones:      string | null;
  createdAt:          string;
}

// ── Módulo 4: Incidencias ─────────────────────────────────────
export interface IncidenciaRequest {
  institucionId:           number;  // vg-ms-auth
  estudianteId:            number;  // vg-ms-student
  reportadorId:            number;  // vg-ms-auth
  tipo:                    'DISCIPLINARIA' | 'ACADEMICA' | 'CONVIVENCIA' | 'BULLYING' | 'VIOLENCIA' | 'OTRO';
  titulo:                  string;
  descripcion:             string;
  severidad?:              'leve' | 'moderada' | 'grave' | 'muy_grave';
  fechaIncidencia?:        string;  // YYYY-MM-DD
  lugar?:                  string;
  testigos?:               string;
  accionesInmediatas?:     string;
  seguimiento?:            string;
  cerradoPor?:             number;  // vg-ms-auth
  fechaCierre?:            string;  // YYYY-MM-DD
  notificadoPadre?:        boolean;
  fechaNotificacionPadre?: string;  // YYYY-MM-DD
}

export interface IncidenciaResponse {
  id:                      number;
  institucionId:           number;
  estudianteId:            number;
  reportadorId:            number;
  tipo:                    string;
  titulo:                  string;
  descripcion:             string;
  severidad:               string;
  fechaIncidencia:         string;
  lugar:                   string | null;
  testigos:                string | null;
  accionesInmediatas:      string | null;
  seguimiento:             string | null;
  estado:                  'abierta' | 'en_proceso' | 'cerrada' | 'derivada';
  cerradoPor:              number | null;
  fechaCierre:             string | null;
  notificadoPadre:         boolean;
  fechaNotificacionPadre:  string | null;
  createdAt:               string;
  updatedAt:               string;
}

// ── Módulo 5: Seguimiento de Incidencias ─────────────────────
export interface SeguimientoIncidenciaRequest {
  incidenciaId:  number;
  usuarioId:     number;  // vg-ms-auth
  accion:        string;
  resultado?:    string;
  fechaAccion?:  string;  // YYYY-MM-DD
}

export interface SeguimientoIncidenciaResponse {
  id:           number;
  incidenciaId: number;
  usuarioId:    number;
  accion:       string;
  resultado:    string | null;
  fechaAccion:  string;
  createdAt:    string;
}

// ── Módulo 6: Eventos ─────────────────────────────────────────
export interface EventoRequest {
  institucionId:      number;  // vg-ms-auth
  organizadorId:      number;  // vg-ms-auth
  titulo:             string;
  descripcion?:       string;
  tipo:               'REUNION' | 'CHARLA' | 'TALLER' | 'CAPACITACION' | 'CONVOCATORIA' | 'OTRO';
  fechaEvento:        string;  // YYYY-MM-DD
  horaInicio:         string;  // HH:mm
  horaFin?:           string;  // HH:mm — debe ser > horaInicio
  esTodoElDia?:       boolean;
  recurrente?:        boolean;
  patronRecurrencia?: string;
  ubicacion?:         string;
  enlaceVirtual?:     string;
  afectaATodos?:      boolean;
}

export interface EventoResponse {
  id:                number;
  institucionId:     number;
  organizadorId:     number;
  titulo:            string;
  descripcion:       string | null;
  tipo:              string;
  fechaEvento:       string;
  horaInicio:        string;  // HH:mm:ss
  horaFin:           string | null;
  esTodoElDia:       boolean;
  recurrente:        boolean;
  patronRecurrencia: string | null;
  ubicacion:         string | null;
  enlaceVirtual:     string | null;
  afectaATodos:      boolean;
  estado:            'programado' | 'en_curso' | 'finalizado' | 'cancelado' | 'reprogramado';
  createdAt:         string;
  updatedAt:         string;
}

// ── Módulo 8: Documentos de Tutoría ──────────────────────────
export interface DocumentoTutoriaResponse {
  id:            number;
  entidadTipo:   string;   // 'tutoria_individual' | 'incidencia' | 'sesion' | etc.
  entidadId:     number;
  nombreArchivo: string;
  urlArchivo:    string;
  extension:     string;
  tamanoKb:      number;
  subidoPor:     number;   // vg-ms-auth
  descripcion:   string | null;
  createdAt:     string;
}

// ── Módulo 7: Participantes de Eventos ───────────────────────
export interface EventoParticipanteRequest {
  eventoId:      number;
  usuarioId:     number;  // vg-ms-auth
  confirmacion?: 'pendiente' | 'confirmado' | 'rechazado' | 'tentativo';
  asistio?:      boolean;
  notas?:        string;
}

export interface EventoParticipanteResponse {
  eventoId:     number;
  usuarioId:    number;
  confirmacion: string;
  asistio:      boolean | null;
  notas:        string | null;
  createdAt:    string;
}
