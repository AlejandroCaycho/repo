export interface Institucion {
  id: number;
  nombre: string;
  activa: boolean;
}

export interface Tutor {
  id: number;
  personaId: number;
  nombres: string;
  apellidos: string;
  activo: boolean;
}

export interface Profesor {
  id: number;
  personaId: number;
  nombres: string;
  apellidos: string;
  especialidad: string;
  activo: boolean;
}

export interface Nivel {
  id?: number;
  institucionId: number;
  nombre: string;
  tipo: string;
  orden: number;
  descripcion?: string;
}

export interface Aula {
  id?: number;
  institucionId: number;
  nombre: string;
  codigo?: string;
  capacidad?: number;
  tipo?: string;
  piso?: string;
  bloque?: string;
  equipamiento?: string;
  disponible: boolean;
}

export interface Grado {
  id?: number;
  institucionId: number;
  nivelId?: number;
  aulaId?: number;
  tutorId?: number;
  nombre: string;
  seccion?: string;
  turno?: string;
  capacidadMax?: number;
  activo: boolean;
  createdAt?: string;
  institucion?: Institucion;
  tutor?: Tutor;
}

export interface Materia {
  id?: number;
  institucionId: number;
  nivelId?: number;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  horasSemana?: number;
  color?: string;
  esObligatoria: boolean;
  activa: boolean;
  createdAt?: string;
}

export interface AnoAcademico {
  id?: number;
  institucionId: number;
  nombre: string;
  fechaInicio: string; // ISO date YYYY-MM-DD
  fechaFin: string; // ISO date YYYY-MM-DD
  activo: boolean;
  createdAt?: string;
}

export interface PeriodoAcademico {
  id?: number;
  anoAcademicoId: number;
  nombre: string;
  tipo?: string;
  orden: number;
  fechaInicio: string; // ISO date YYYY-MM-DD
  fechaFin: string; // ISO date YYYY-MM-DD
  activo: boolean;
}

export interface Clase {
  id?: number;
  profesorId: number;
  gradoId: number;
  materiaId: number;
  aulaId?: number;
  anoAcademicoId: number;
  modalidad: string;
  enlaceVirtual?: string;
  descripcion?: string;
  activa: boolean;
  createdAt?: string;
  institucion?: Institucion;
  profesor?: Profesor;
}

export interface HorarioClase {
  id?: number;
  claseId: number;
  tipoHorario: string;
  diaSemana: string;
  horaInicio: string; // time string HH:MM:SS
  horaFin: string; // time string HH:MM:SS
}
