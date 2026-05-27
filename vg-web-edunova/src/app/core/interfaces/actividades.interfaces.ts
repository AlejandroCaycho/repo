// ============================================================
// Interfaces — vg-ms-welfare (puerto 8086) — Módulo Actividades
// ============================================================

// ── Tipos compartidos ─────────────────────────────────────────
export type CategoriaTaller          = 'deportivo' | 'artistico' | 'musical' | 'academico' | 'cultural';
export type DiaSemana                = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
export type EstadoTallerEst          = 'activo' | 'retirado' | 'finalizado' | 'suspendido';
export type TipoProgRecuperacion     = 'recuperacion' | 'vacacional';
export type EstadoProgRecupEst       = 'activo' | 'retirado' | 'aprobado' | 'desaprobado';
export type TipoEventoInstitucional  =
  | 'aniversario' | 'cultural' | 'deportivo' | 'academico'
  | 'civico' | 'reunion' | 'olimpiadas' | 'desfile' | 'paseo';

// ── Módulo 1: Talleres ────────────────────────────────────────
export interface TallerRequest {
  institucionId:          number;   // vg-ms-auth
  nombre:                 string;
  descripcion?:           string;   // max 100
  categoria:              CategoriaTaller;
  profesorResponsableId?: number;   // vg-ms-student
  aulaId?:                number;   // vg-ms-academic
  diaSemana?:             DiaSemana;
  horaInicio?:            string;   // HH:mm
  horaFin?:               string;   // HH:mm — debe ser > horaInicio
  cupoMaximo?:            number;
  requiereAutorizacion?:  boolean;
}

export interface TallerResponse {
  id:                     number;
  institucionId:          number;
  nombre:                 string;
  descripcion:            string | null;
  categoria:              CategoriaTaller;
  profesorResponsableId:  number | null;
  aulaId:                 number | null;
  diaSemana:              DiaSemana | null;
  horaInicio:             string | null;   // HH:mm:ss
  horaFin:                string | null;   // HH:mm:ss
  cupoMaximo:             number | null;
  requiereAutorizacion:   boolean;
  isActive:               boolean;
  createdAt:              string;
  updatedAt:              string;
}

// ── Módulo 2: Taller Estudiante ───────────────────────────────
export interface TallerEstudianteRequest {
  tallerId:          number;
  estudianteId:      number;   // vg-ms-student
  fechaInscripcion?: string;   // YYYY-MM-DD
  estado?:           EstadoTallerEst;
  observaciones?:    string;   // max 100
}

export interface TallerEstudianteResponse {
  id:               number;
  tallerId:         number;
  estudianteId:     number;
  fechaInscripcion: string | null;
  estado:           EstadoTallerEst;
  observaciones:    string | null;
  isActive:         boolean;
  createdAt:        string;
  updatedAt:        string;
}

// ── Módulo 3: Programa de Recuperación ───────────────────────
export interface ProgramaRecuperacionRequest {
  institucionId: number;   // vg-ms-auth
  materiaId?:    number;   // vg-ms-academic
  aulaId?:       number;   // vg-ms-academic
  profesorId?:   number;   // vg-ms-student
  nombre:        string;
  descripcion?:  string;   // max 100
  tipo:          TipoProgRecuperacion;
  fechaInicio:   string;   // YYYY-MM-DD
  fechaFin:      string;   // YYYY-MM-DD — debe ser >= fechaInicio
  horaInicio?:   string;   // HH:mm
  horaFin?:      string;   // HH:mm — debe ser > horaInicio
  capacidadMax?: number;
}

export interface ProgramaRecuperacionResponse {
  id:            number;
  institucionId: number;
  materiaId:     number | null;
  aulaId:        number | null;
  profesorId:    number | null;
  nombre:        string;
  descripcion:   string | null;
  tipo:          TipoProgRecuperacion;
  fechaInicio:   string;
  fechaFin:      string;
  horaInicio:    string | null;   // HH:mm:ss
  horaFin:       string | null;   // HH:mm:ss
  capacidadMax:  number | null;
  isActive:      boolean;
  createdAt:     string;
  updatedAt:     string;
}

// ── Módulo 4: Programa Recuperación Estudiante ───────────────
export interface ProgramaRecuperacionEstudianteRequest {
  programaId:        number;
  estudianteId:      number;   // vg-ms-student
  fechaInscripcion?: string;   // YYYY-MM-DD
  estado?:           EstadoProgRecupEst;
  promedioFinal?:    number;   // NUMERIC(5,2) — min 0 max 20
  observaciones?:    string;   // max 100
}

export interface ProgramaRecuperacionEstudianteResponse {
  id:               number;
  programaId:       number;
  estudianteId:     number;
  fechaInscripcion: string | null;
  estado:           EstadoProgRecupEst;
  promedioFinal:    number | null;
  observaciones:    string | null;
  isActive:         boolean;
  createdAt:        string;
  updatedAt:        string;
}

// ── Módulo 5: Evento Institucional ────────────────────────────
export interface EventoInstitucionalRequest {
  institucionId:     number;   // vg-ms-auth
  responsableId?:    number;   // vg-ms-auth
  nombre:            string;
  descripcion?:      string;   // max 100
  tipoEvento:        TipoEventoInstitucional;
  fechaEvento:       string;   // YYYY-MM-DD
  lugar?:            string;
  requiereCuota?:    boolean;
  montoReferencial?: number;   // NUMERIC(10,2)
  descripcionCuota?: string;   // max 100
}

export interface EventoInstitucionalResponse {
  id:                number;
  institucionId:     number;
  responsableId:     number | null;
  nombre:            string;
  descripcion:       string | null;
  tipoEvento:        TipoEventoInstitucional;
  fechaEvento:       string;
  lugar:             string | null;
  requiereCuota:     boolean;
  montoReferencial:  number | null;
  descripcionCuota:  string | null;
  isActive:          boolean;
  createdAt:         string;
  updatedAt:         string;
}

// ── Módulo 6: Participación Estudiantil ──────────────────────
export interface ParticipacionEstudiantilRequest {
  institucionId:          number;   // vg-ms-auth
  estudianteId:           number;   // vg-ms-student
  profesorResponsableId?: number;   // vg-ms-student
  nombreEvento:           string;
  tipo?:                  string;
  organizador?:           string;
  lugar?:                 string;
  fechaEvento?:           string;   // YYYY-MM-DD
  resultado?:             string;
  observaciones?:         string;   // max 100
}

export interface ParticipacionEstudiantilResponse {
  id:                     number;
  institucionId:          number;
  estudianteId:           number;
  profesorResponsableId:  number | null;
  nombreEvento:           string;
  tipo:                   string | null;
  organizador:            string | null;
  lugar:                  string | null;
  fechaEvento:            string | null;
  resultado:              string | null;
  observaciones:          string | null;
  isActive:               boolean;
  createdAt:              string;
}