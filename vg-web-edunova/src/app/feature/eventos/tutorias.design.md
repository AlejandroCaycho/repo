# Diseño: Módulo Tutorías
> Documento de referencia para reimplementar `TutoriasComponent` de forma independiente.
> Autor: compañero de equipo — área tutorías.

---

## 1. Ubicación final en el proyecto

```
feature/eventos/
├── eventos.ts          ← shell (solo tabs)
├── tutorias/
│   ├── tutorias.component.ts       ← este componente
│   ├── tutorias.component.html
│   ├── tutorias.component.scss
│   └── _shared.scss                ← tokens y clases reutilizables (copiar de utils/)
```

**Selector:** `<app-tutorias />`  
**Standalone:** sí  
**Recibe del shell:** nada (autónomo)  
**Expone al shell:** nada (autónomo)

---

## 2. Servicios que usa (todos en `core/services/`)

| Servicio | Import path | Métodos usados |
|---|---|---|
| `ProgramaTutoriaService` | `../../core/services/programa-tutoria.service` | `getAll()`, `create(p)`, `update(id,p)`, `delete(id)`, `activar(id)`, `desactivar(id)` |
| `TutorGradoService` | `../../core/services/tutor-grado.service` | `getAll()`, `create(p)`, `update(id,p)`, `delete(id)`, `activar(id)`, `desactivar(id)` |
| `TutorEstudianteService` | `../../core/services/tutor-estudiante.service` | `getAll()`, `create(p)`, `update(id,p)`, `delete(id)`, `activar(id)`, `desactivar(id)` |
| `SesionTutoriaService` | `../../core/services/sesion-tutoria.service` | `getAll()`, `create(p)`, `update(id,p)`, `delete(id)` |
| `IncidenciaService` | `../../core/services/incidencia.service` | `getAll()` |
| `SeguimientoIncidenciaService` | `../../core/services/seguimiento-incidencia.service` | `getAll()` |
| `EventoParticipanteService` | `../../core/services/evento-participante.service` | `getAll()` |
| `DocumentoTutoriaService` | `../../core/services/documento-tutoria.service` | `getAll()`, `delete(id)` |

---

## 3. Interfaces que usa (de `core/interfaces/welfare.interfaces`)

```typescript
// Responses (lectura)
ProgramaTutoriaResponse     // { id, institucionId, anoAcademicoId, nombre, tipo, descripcion?, objetivos?, activo }
TutorGradoResponse          // { id, programaTutoriaId, profesorId, gradoId, fechaInicio?, fechaFin?, activo }
TutorEstudianteResponse     // { id, profesorId, estudianteId, tipo, programaTutoriaId?, motivo?, objetivos?, fechaInicio?, fechaFin?, derivadoPor?, estado }
SesionTutoriaResponse       // { id, fechaSesion, horaInicio, horaFin?, tipo, modalidad, tutorGradoId?, tutorEstudianteId?, temasTratados?, acuerdos?, compromisosAlumno?, compromisosTutor?, proximaSesion?, firmadoPorAlumno, firmadoPorPadre, observaciones? }
IncidenciaResponse          // { id, estudianteId, tipo, severidad, descripcion, fechaIncidencia, estado }
SeguimientoIncidenciaResponse // { id, incidenciaId, usuarioId, accion, resultado?, fechaAccion }
EventoParticipanteResponse  // { eventoId, usuarioId, confirmacion, asistio, notas?, createdAt }
DocumentoTutoriaResponse    // { id, nombreArchivo, urlArchivo, entidadTipo, entidadId, extension, tamanoKb, descripcion?, subidoPor, createdAt }

// Requests (escritura)
ProgramaTutoriaRequest      // { institucionId, anoAcademicoId, nombre, tipo, descripcion?, objetivos? }
TutorGradoRequest           // { programaTutoriaId, profesorId, gradoId, fechaInicio?, fechaFin? }
TutorEstudianteRequest      // { profesorId, estudianteId, tipo, programaTutoriaId?, motivo?, objetivos?, fechaInicio?, fechaFin?, derivadoPor? }
SesionTutoriaRequest        // { fechaSesion, horaInicio, horaFin?, tipo, modalidad?, tutorGradoId?, tutorEstudianteId?, temasTratados?, acuerdos?, compromisosAlumno?, compromisosTutor?, proximaSesion?, firmadoPorAlumno, firmadoPorPadre, observaciones? }
```

---

## 4. Estado interno (signals)

```typescript
// Datos crudos (privados, se filtran con computed)
private _programas         = signal<ProgramaTutoriaResponse[]>([]);
private _tutoresGrado      = signal<TutorGradoResponse[]>([]);
private _tutoresEstudiante = signal<TutorEstudianteResponse[]>([]);

// Datos directos
sesiones      = signal<SesionTutoriaResponse[]>([]);
incidencias   = signal<IncidenciaResponse[]>([]);
seguimientos  = signal<SeguimientoIncidenciaResponse[]>([]);
participantes = signal<EventoParticipanteResponse[]>([]);
documentos    = signal<DocumentoTutoriaResponse[]>([]);

// UI
loading = signal(false);
error   = signal<string | null>(null);

// Filtros
filtroProg  = signal<'todos'|'activos'|'inactivos'>('activos');
filtroGrado = signal<'todos'|'activos'|'inactivos'>('activos');
filtroEst   = signal<'todos'|'activa'|'inactiva'>('todos');

// Navegación interna
seccionActiva = signal<SeccionTutoria>('menu');

// Modal
modalType   = signal<ModalType>(null);
modalMode   = signal<'create'|'edit'>('create');
modalSaving = signal(false);
editingId   = signal<number | null>(null);
```

### Tipos locales

```typescript
type ModalType = 'programa' | 'tutorGrado' | 'tutorEstudiante' | 'sesion' | null;

type SeccionTutoria =
  | 'menu'
  | 'programas'
  | 'tutoresGrado'
  | 'tutoresEstudiante'
  | 'sesiones'
  | 'incidencias'
  | 'seguimientoIncidencias'
  | 'documentos'
  | 'participantesEventos'
  | null;
```

---

## 5. Computed (filtros + contadores)

```typescript
programas = computed(() => {
  const f = this.filtroProg(), all = this._programas();
  if (f === 'activos')   return all.filter(p => p.activo);
  if (f === 'inactivos') return all.filter(p => !p.activo);
  return all;
});

tutoresGrado = computed(() => {
  const f = this.filtroGrado(), all = this._tutoresGrado();
  if (f === 'activos')   return all.filter(t => t.activo);
  if (f === 'inactivos') return all.filter(t => !t.activo);
  return all;
});

tutoresEstudiante = computed(() => {
  const f = this.filtroEst(), all = this._tutoresEstudiante();
  if (f === 'activa')   return all.filter(t => t.estado === 'activa');
  if (f === 'inactiva') return all.filter(t => t.estado !== 'activa');
  return all;
});

// Contadores para los filter-pills
countProg  = computed(() => ({ todos, activos, inactivos }));
countGrado = computed(() => ({ todos, activos, inactivos }));
countEst   = computed(() => ({ todos, activa, inactiva }));
```

---

## 6. Formularios (ReactiveFormsModule)

### formPrograma
```typescript
{
  institucionId:  [null, required],
  anoAcademicoId: [null, required],
  nombre:         ['',   required],
  tipo:           ['GRUPAL', required],  // GRUPAL | INDIVIDUAL | MIXTO
  descripcion:    [''],
  objetivos:      [''],
}
```

### formTutorGrado
```typescript
{
  programaTutoriaId: [null, required],
  profesorId:        [null, required],
  gradoId:           [null, required],
  fechaInicio:       [''],
  fechaFin:          [''],
}
```

### formTutorEstudiante
```typescript
{
  profesorId:        [null, required],
  estudianteId:      [null, required],
  tipo:              ['ACADEMICA', required],  // ACADEMICA | PERSONAL | VOCACIONAL | DISCIPLINARIA | EMOCIONAL
  programaTutoriaId: [null],
  motivo:            [''],
  objetivos:         [''],
  fechaInicio:       [''],
  fechaFin:          [''],
  derivadoPor:       [null],
}
```

### formSesion
```typescript
{
  fechaSesion:       ['', required],
  horaInicio:        ['', required],
  horaFin:           [''],
  tipo:              ['individual', required],  // individual | grupal | seguimiento
  modalidad:         ['presencial'],            // presencial | virtual | hibrido
  tutorGradoId:      [null],
  tutorEstudianteId: [null],
  temasTratados:     [''],
  acuerdos:          [''],
  compromisosAlumno: [''],
  compromisosTutor:  [''],
  proximaSesion:     [''],
  firmadoPorAlumno:  [false],
  firmadoPorPadre:   [false],
  observaciones:     [''],
}
```

---

## 7. Métodos del componente

### Navegación
```typescript
irSeccion(s: SeccionTutoria): void
// Cambia seccionActiva y dispara la carga correspondiente:
// 'programas' | 'tutoresGrado' | 'tutoresEstudiante' | 'sesiones' → loadTutorias()
// 'incidencias'            → loadIncidencias()
// 'seguimientoIncidencias' → loadSeguimientos()
// 'participantesEventos'   → loadParticipantes()
// 'documentos'             → loadDocumentos()

volverMenu(): void  // seccionActiva.set('menu')
```

### Carga de datos
```typescript
loadTutorias(): void
// Llama en paralelo: programaService.getAll(), tutorGradoService.getAll(),
// tutorEstudianteService.getAll(), sesionTutoriaService.getAll()

loadIncidencias(): void    // incidenciaService.getAll()
loadSeguimientos(): void   // seguimientoService.getAll()
loadParticipantes(): void  // participanteService.getAll()
loadDocumentos(): void     // documentoService.getAll()

loadResumenTutorias(): void
// Carga silenciosa al entrar al menú: incidencias + documentos (para mostrar contadores)
```

### Modales — abrir
```typescript
openCreatePrograma(): void
openEditPrograma(p: ProgramaTutoriaResponse): void

openCreateTutorGrado(): void
openEditTutorGrado(t: TutorGradoResponse): void

openCreateTutorEstudiante(): void
openEditTutorEstudiante(t: TutorEstudianteResponse): void

openCreateSesion(): void
openEditSesion(s: SesionTutoriaResponse): void

closeModal(): void
```

### Guardar
```typescript
savePrograma(): void        // create o update según modalMode()
saveTutorGrado(): void
saveTutorEstudiante(): void
saveSesion(): void
```

### Eliminar
```typescript
deletePrograma(id: number): void        // confirm + programaService.delete(id)
deleteTutorGrado(id: number): void
deleteTutorEstudiante(id: number): void
deleteSesion(id: number): void
deleteDocumento(id: number): void       // documentoService.delete(id)
```

### Toggle activo/inactivo
```typescript
togglePrograma(p: ProgramaTutoriaResponse): void
// p.activo → programaService.desactivar(p.id) : programaService.activar(p.id)

toggleTutorGrado(t: TutorGradoResponse): void
toggleTutorEstudiante(t: TutorEstudianteResponse): void
// t.estado === 'activa' → desactivar : activar
```

### Helpers / formatters
```typescript
formatFecha(f: string | null | undefined): string  // 'YYYY-MM-DD' → 'DD/MM/YYYY'
formatHora(h: string | null | undefined): string   // 'HH:MM:SS' → 'HH:MM'
formatTamano(kb: number): string                   // 1024 → '1.0 MB'
getTipoLabel(t: string): string                    // 'GRUPAL' → 'Grupal', etc.
getEstadoTutoriaLabel(e: string): { label, css }   // 'activa' → { label:'Activa', css:'badge--on' }
getModalidadLabel(m: string): string               // 'presencial' → 'Presencial'
hasError(form: FormGroup, field: string): boolean  // form.get(field).invalid && touched
```

---

## 8. Estructura visual (HTML)

### Menú principal (seccionActiva === 'menu')
Grid de 8 cards de navegación:

| Card | Color | Sección destino | Icono |
|---|---|---|---|
| Programas de Tutoría | `sec-card--blue` | `programas` | `Layers` |
| Tutores de Grado | `sec-card--indigo` | `tutoresGrado` | `GraduationCap` |
| Tutores de Estudiante | `sec-card--purple` | `tutoresEstudiante` | `UserCheck` |
| Sesiones de Tutoría | `sec-card--green` | `sesiones` | `ClipboardList` |
| Incidencias | `sec-card--red` | `incidencias` | `ShieldAlert` |
| Seguimiento de Incidencias | `sec-card--amber` | `seguimientoIncidencias` | `RefreshCw` |
| Participantes de Eventos | `sec-card--teal` | `participantesEventos` | `UserPlus` |
| Documentos de Tutoría | `sec-card--slate` | `documentos` | `FileText` |

### Estructura de cada sección
```
sec-view
  └── sec-view__topbar
        ├── btn btn--ghost btn--sm  → volverMenu()
        └── sec-view__breadcrumb   → "Tutorías > [Nombre sección]"
  └── [loading/error state]
  └── card-section
        ├── cs-head
        │     ├── cs-head__left  → cs-icon + título + subtítulo
        │     └── cs-head__right → filter-pills + btn Nuevo
        └── tbl-wrap > table.tbl
```

### Secciones con tabla + CRUD completo
- **Programas**: columnas ID, Nombre, Tipo, Institución, Año, Estado, Acciones (editar/toggle/eliminar)
- **Tutores de Grado**: columnas ID, Programa, Profesor, Grado, Inicio, Fin, Estado, Acciones
- **Tutores de Estudiante**: columnas ID, Estudiante, Profesor, Tipo, Motivo, Inicio, Estado, Acciones
- **Sesiones**: columnas ID, Fecha, Hora (tchip), Tipo, Modalidad, Temas, Próxima, Acciones (editar/eliminar)

### Secciones de solo lectura (sin botón Nuevo)
- **Documentos**: columnas ID, Archivo (link), Entidad, Extensión, Tamaño, Descripción, Subido por, Fecha, Acciones (solo eliminar)
- **Incidencias**: columnas ID, Estudiante, Tipo, Severidad, Descripción, Fecha, Estado
- **Seguimiento**: columnas ID, Incidencia, Usuario, Acción, Observaciones, Fecha
- **Participantes**: columnas Evento, Usuario, Confirmación, Asistió, Notas, Fecha Registro

### Modales
Todos siguen el mismo patrón:
```
mbk (backdrop, click cierra)
  └── mdl [mdl--lg para sesión]
        ├── mdl__hd → icono + título + botón X
        ├── form.mdl__bd → campos del formulario
        └── mdl__ft → btn Cancelar + btn Guardar
```

---

## 9. Estadísticas en el header del shell

El shell `eventos.ts` necesita recibir estos 4 valores para mostrarlos en el header cuando el tab activo es "tutorías":

```typescript
// El componente tutorias debe exponer estos signals o emitirlos via @Output
countProg().activos    // número de programas activos
countEst().activa      // número de tutorías activas
sesiones().length      // total de sesiones
incidencias().length   // total de incidencias
```

**Opción recomendada:** el shell no muestra stats de tutorías — cada módulo es autónomo y muestra sus propias stats dentro de su panel. Simplificar el header del shell a solo título + tabs.

---

## 10. Estilos — clases CSS usadas

Todas las clases vienen de `_shared.scss` (tokens compartidos) o de `eventos.scss` (shell).
El componente tutorias debe copiar/importar `_shared.scss` y no depender de `eventos.scss`.

### Clases de layout
`.ep`, `.panel`, `.sec-menu`, `.sec-grid`, `.sec-view`, `.sec-view__topbar`, `.sec-view__breadcrumb`

### Clases de cards de menú
`.sec-card`, `.sec-card--blue/indigo/purple/green/red/amber/teal/slate`
`.sec-card__icon`, `.sec-card__body`, `.sec-card__title`, `.sec-card__sub`, `.sec-card__arrow`

### Clases de sección
`.card-section`, `.cs-head`, `.cs-head__left/right`, `.cs-icon`, `.cs-icon--blue/purple/green`
`.cs-title`, `.cs-sub`, `.cs-empty`

### Clases de tabla
`.tbl-wrap`, `.tbl`, `.td-id`, `.td-trunc`, `.tchip`

### Clases de badges
`.badge`, `.badge--on/off/tipo/allday/programado/en-curso/finalizado/cancelado/reprogramado`
`.bdot`

### Clases de filtros
`.filter-pills`, `.fpill`, `.fpill--on`, `.fpill--green`, `.fpill--gray`, `.fpill__n`
`.count-chip`

### Clases de botones
`.btn`, `.btn--primary`, `.btn--ghost`, `.btn--sm`
`.acts`, `.ab`, `.ab--edit`, `.ab--del`, `.ab--warn`, `.ab--ok`

### Clases de modal
`.mbk`, `.mdl`, `.mdl--lg`, `.mdl__hd`, `.mdl__hd-icon`, `.mdl__hd-icon--blue/purple/green`
`.mdl__x`, `.mdl__bd`, `.mdl__ft`

### Clases de formulario
`.fsec`, `.frow`, `.frow--3`, `.frow--checks`, `.fg`, `.fg--err`
`.fl`, `.fi`, `.fi--ta`, `.fe`, `.fchk`

### Clases de estado
`.sbox`, `.sbox--load`, `.sbox--err`, `.spin`

### Iconos Lucide usados
`BookOpen, GraduationCap, UserCheck, ClipboardList, Layers, ShieldAlert, FileText, UserPlus`
`RefreshCw, AlertCircle, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Save`
`ChevronRight, ArrowLeft, Clock`

---

## 11. ngOnInit

```typescript
ngOnInit(): void {
  this.loadTutorias();
  this.loadResumenTutorias();  // carga silenciosa de incidencias + documentos para el menú
}
```
