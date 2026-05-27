export interface Institucion {
  id: number;
  uuid: string;
  nombre: string;
  nombreCorto?: string;
  email?: string;
  emailSecundario?: string;
  telefono?: string;
  telefonoSecundario?: string;
  sitioWeb?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  codigoPostal?: string;
  logoUrl?: string;
  tipoInstitucion?: string;
  codigoModular?: string;
  resolucionCreacion?: string;
  estado?: string;
  activa?: boolean;
  eliminadoAt?: string | null;
}

export interface InstitucionRequest {
  nombre: string;
  nombreCorto?: string;
  email?: string;
  emailSecundario?: string;
  telefono?: string;
  telefonoSecundario?: string;
  sitioWeb?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  codigoPostal?: string;
  logoUrl?: string;
  tipoInstitucion?: string;
  codigoModular?: string;
  resolucionCreacion?: string;
}

export interface ConfiguracionInstitucion {
  institucionId: number;
  escalaCalificacionId?: number;
  temaColorPrimario?: string;
  temaColorSecundario?: string;
  logoUrl?: string;
  mantenerRegistrosAnos?: number;
  permitirRegistroPadres?: boolean;
  padresVenCalificaciones?: boolean;
  padresVenAsistencia?: boolean;
  padresVenTareas?: boolean;
  notificacionInasistencia?: boolean;
  notificacionCalificacionBaja?: boolean;
  umbralCalificacionBaja?: number;
  horarioInicioClases?: string;
  horarioFinClases?: string;
  diasLaborables?: string;
  idiomaPrincipal?: string;
  zonaHoraria?: string;
  moneda?: string;
}

export interface ConfiguracionInstitucionRequest {
  institucionId: number;
  escalaCalificacionId?: number;
  temaColorPrimario?: string;
  temaColorSecundario?: string;
  logoUrl?: string;
  mantenerRegistrosAnos?: number;
  permitirRegistroPadres?: boolean;
  padresVenCalificaciones?: boolean;
  padresVenAsistencia?: boolean;
  padresVenTareas?: boolean;
  notificacionInasistencia?: boolean;
  notificacionCalificacionBaja?: boolean;
  umbralCalificacionBaja?: number;
  horarioInicioClases?: string;
  horarioFinClases?: string;
  diasLaborables?: string;
  idiomaPrincipal?: string;
  zonaHoraria?: string;
  moneda?: string;
}

export interface AuditLog {
  id: number;
  usuarioId?: number | null;
  tabla: string;
  registroId?: number | null;
  accion: string;
  datosAnteriores?: string | null;
  datosNuevos?: string | null;
  ipOrigen?: string;
  userAgent?: string;
  createdAt?: string;
}

export interface Permiso {
  id: number;
  modulo: string;
  accion: string;
  descripcion?: string;
  estado?: string;
}

export interface PermisoRequest {
  modulo: string;
  accion: string;
  descripcion?: string;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  esSistema: boolean;
}

export interface RolRequest {
  nombre: string;
  descripcion?: string;
  esSistema?: boolean;
}

export interface Usuario {
  id: number;
  uuid: string;
  institucionId: number;
  nombre: string;
  email: string;
  contrasena?: string;
  telefono?: string;
  fotoUrl?: string;
  estado?: string;
  ultimoAcceso?: string;
  requiereCambioPwd?: boolean;
  intentosFallidos?: number;
  bloqueadoHasta?: string;
  createdAt?: string;
  updatedAt?: string;
  eliminadoAt?: string | null;
}

export interface UsuarioRequest {
  institucionId: number;
  nombre: string;
  email: string;
  contrasena?: string;
  telefono?: string;
  fotoUrl?: string;
}
