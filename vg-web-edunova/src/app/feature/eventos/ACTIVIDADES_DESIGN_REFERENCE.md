# ACTIVIDADES — Referencia de Diseño
> Extraído de `src/app/feature/eventos` para adaptar a una nueva estructura.

---

## 1. Contexto general

El módulo **Eventos** tiene dos tabs principales:
- **Tutorías** — programas, tutores, sesiones, incidencias, documentos
- **Actividades** — talleres, programas de recuperación, eventos institucionales, participaciones estudiantiles

Este documento cubre únicamente la parte de **Actividades** (tab `actividades`).

---

## 2. Secciones de Actividades

| Sección | Tipo de dato | Descripción |
|---|---|---|
| `talleres` | `TallerResponse` | Talleres deportivos, artísticos, etc. |
| `talleresEst` | `TallerEstudianteResponse` | Inscripciones de estudiantes a talleres |
| `programasRecup` | `ProgramaRecuperacionResponse` | Programas de recuperación/vacacional |
| `programasRecupEst` | `ProgramaRecuperacionEstudianteResponse` | Inscripciones a programas de recuperación |
| `eventosInst` | `EventoInstitucionalResponse` | Eventos institucionales (aniversario, desfile, etc.) |
| `participaciones` | `ParticipacionEstudiantilResponse` | Participaciones estudiantiles en eventos externos |

---

## 3. Interfaces de datos (`activity.interfaces.ts`)

### 3.1 Taller
```typescript
// Tipos
type CategoriaTaller = 'deportivo' | 'artistico' | 'musical' | 'academico' | 'cultural';
type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

interface TallerRequest {
  institucionId:          number;           // requerido
  nombre:                 string;           // requerido, solo texto
  descripcion?:           string;           // max 100
  categoria:              CategoriaTaller;  // requerido
  profesorResponsableId?: number;
  aulaId?:                number;
  diaSemana?:             DiaSemana;
  horaInicio?:            string;           // HH:mm
  horaFin?:               string;           // HH:mm, debe ser > horaInicio
  cupoMaximo?:            number;
  requiereAutorizacion?:  boolean;
}

interface TallerResponse {
  id, institucionId, nombre, descripcion, categoria,
  profesorResponsableId, aulaId, diaSemana,
  horaInicio, horaFin,   // HH:mm:ss
  cupoMaximo, requiereAutorizacion,
  isActive, createdAt, updatedAt
}
```

### 3.2 Taller Estudiante
```typescript
type EstadoTallerEstudiante = 'activo' | 'retirado' | 'finalizado' | 'suspendido';

interface TallerEstudianteRequest {
  tallerId:          number;   // requerido
  estudianteId:      number;   // requerido
  fechaInscripcion?: string;   // YYYY-MM-DD, validación fechaFutura
  estado?:           EstadoTallerEstudiante;
  observaciones?:    string;   // max 100
}

interface TallerEstudianteResponse {
  id, tallerId, estudianteId, fechaInscripcion,
  estado, isActive, observaciones, createdAt, updatedAt
}
```

### 3.3 Programa de Recuperación
```typescript
type TipoProgRecuperacion = 'recuperacion' | 'vacacional';

interface ProgramaRecuperacionRequest {
  institucionId: number;                 // requerido
  materiaId?:    number;
  aulaId?:       number;
  profesorId?:   number;
  nombre:        string;                 // requerido, solo texto
  descripcion?:  string;                 // max 100
  tipo:          TipoProgRecuperacion;   // requerido
  fechaInicio:   string;                 // YYYY-MM-DD, requerido
  fechaFin:      string;                 // YYYY-MM-DD, >= fechaInicio
  horaInicio?:   string;                 // HH:mm
  horaFin?:      string;                 // HH:mm, > horaInicio
  capacidadMax?: number;
}

interface ProgramaRecuperacionResponse {
  id, institucionId, materiaId, aulaId, profesorId,
  nombre, descripcion, tipo,
  fechaInicio, fechaFin, horaInicio, horaFin,
  capacidadMax, isActive, createdAt, updatedAt
}
```

### 3.4 Programa Recuperación Estudiante
```typescript
type EstadoProgRecupEstudiante = 'activo' | 'retirado' | 'aprobado' | 'desaprobado';

interface ProgramaRecuperacionEstudianteRequest {
  programaId:        number;   // requerido
  estudianteId:      number;   // requerido
  fechaInscripcion?: string;   // YYYY-MM-DD, validación fechaFutura
  estado?:           EstadoProgRecupEstudiante;
  promedioFinal?:    number;   // NUMERIC(5,2), min 0 max 20
  observaciones?:    string;   // max 100
}

interface ProgramaRecuperacionEstudianteResponse {
  id, programaId, estudianteId, fechaInscripcion,
  estado, isActive, promedioFinal, observaciones, createdAt, updatedAt
}
```

### 3.5 Evento Institucional
```typescript
type TipoEventoInstitucional =
  'aniversario' | 'cultural' | 'deportivo' | 'academico' |
  'civico' | 'reunion' | 'olimpiadas' | 'desfile' | 'paseo';

interface EventoInstitucionalRequest {
  institucionId:      number;                    // requerido
  responsableId?:     number;
  nombre:             string;                    // requerido, solo texto
  descripcion?:       string;                    // max 100
  tipoEvento:         TipoEventoInstitucional;   // requerido
  fechaEvento:        string;                    // YYYY-MM-DD, requerido, fechaFutura
  lugar?:             string;                    // soloTexto
  requiereCuota?:     boolean;
  montoReferencial?:  number;                    // NUMERIC(10,2)
  descripcionCuota?:  string;                    // max 100
}

interface EventoInstitucionalResponse {
  id, institucionId, responsableId, nombre, descripcion,
  tipoEvento, fechaEvento, lugar,
  requiereCuota, montoReferencial, descripcionCuota,
  isActive, createdAt, updatedAt
}
```

### 3.6 Participación Estudiantil
```typescript
interface ParticipacionEstudiantilRequest {
  institucionId:          number;   // requerido
  estudianteId:           number;   // requerido
  profesorResponsableId?: number;
  nombreEvento:           string;   // requerido, soloTexto
  tipo?:                  string;   // soloTexto
  organizador?:           string;   // soloTexto
  lugar?:                 string;   // soloTexto
  fechaEvento?:           string;   // YYYY-MM-DD, fechaFutura
  resultado?:             string;   // soloTexto
  observaciones?:         string;   // max 100
}

interface ParticipacionEstudiantilResponse {
  id, institucionId, estudianteId, profesorResponsableId,
  nombreEvento, tipo, organizador, lugar,
  fechaEvento, resultado, observaciones,
  isActive, createdAt
}
```

---

## 4. Validadores de formulario usados

Todos vienen de `src/app/core/validators/activity.validators.ts`:

| Validador | Aplica a | Descripción |
|---|---|---|
| `soloTextoValidator` | nombre, lugar, tipo, organizador, resultado | Solo letras, espacios y caracteres básicos |
| `horaFinMayorValidator` | formularios con horaInicio/horaFin | horaFin debe ser > horaInicio |
| `fechaFinMayorIgualValidator` | formularios con fechaInicio/fechaFin | fechaFin >= fechaInicio |
| `fechaFuturaValidator` | fechaEvento, fechaInscripcion | La fecha no puede ser pasada |
| `montoReferencialValidator` | montoReferencial | Solo activo si requiereCuota = true |

---

## 5. Servicios API

Cada entidad tiene su propio servicio en `src/app/core/services/`:

| Servicio | Archivo | Métodos principales |
|---|---|---|
| `TallerService` | `taller.service.ts` | `getAll()`, `create()`, `update()`, `toggle()`, `delete()` |
| `TallerEstudianteService` | `taller-estudiante.service.ts` | `getAll()`, `create()`, `update()`, `eliminar()`, `restaurar()` |
| `ProgramaRecuperacionService` | `programa-recuperacion.service.ts` | `getAll()`, `create()`, `update()`, `toggle()`, `delete()` |
| `ProgramaRecuperacionEstudianteService` | `programa-recuperacion-estudiante.service.ts` | `getAll()`, `create()`, `update()`, `eliminar()`, `restaurar()` |
| `EventoInstitucionalService` | `evento-institucional.service.ts` | `getAll()`, `create()`, `update()`, `toggle()`, `delete()` |
| `ParticipacionEstudiantilService` | `participacion-estudiantil.service.ts` | `getAll()`, `create()`, `update()`, `eliminar()`, `restaurar()` |
| `LookupService` | `lookup.service.ts` | `getInstitucionById()`, `getPersona()`, `getEstudiante()`, `getTaller()`, `getProgramaRecuperacion()`, `getAula()`, `getMateria()`, `getProfesor()` |

---

## 6. Patrón de estado (Angular Signals)

```typescript
// Datos privados (raw)
private _talleres = signal<TallerResponse[]>([]);

// Filtro activo
filtroTaller = signal<'todos' | 'activos' | 'inactivos'>('activos');

// Computed con filtro aplicado (lo que se muestra en la tabla)
talleres = computed(() => {
  const f = this.filtroTaller(), all = this._talleres();
  if (f === 'activos')   return all.filter(t => t.isActive);
  if (f === 'inactivos') return all.filter(t => !t.isActive);
  return all;
});

// Contadores para los filter pills
countTaller = computed(() => ({
  todos:     this._talleres().length,
  activos:   this._talleres().filter(t => t.isActive).length,
  inactivos: this._talleres().filter(t => !t.isActive).length,
}));

// Estados de carga y error
loadingAct = signal(false);
errorAct   = signal<string | null>(null);
```

---

## 7. Patrón de navegación por secciones

El módulo usa un sistema de "menú de cards → sección detalle" en lugar de rutas:

```typescript
type SeccionActividad =
  | 'menu'           // pantalla inicial con cards
  | 'talleres'
  | 'talleresEst'
  | 'programasRecup'
  | 'programasRecupEst'
  | 'eventosInst'
  | 'participaciones'
  | null;

seccionActividad = signal<SeccionActividad>('menu');

// Navegar a sección
irSeccionActividad(s: SeccionActividad) { this.seccionActividad.set(s); }

// Volver al menú
volverMenuActividad() { this.seccionActividad.set('menu'); }
```

**Pantalla menú** — grid de cards, cada una con:
- Icono (lucide)
- Título y subtítulo
- Flecha `ChevronRight`
- Color de acento (clase CSS `sec-card--{color}`)

**Pantalla sección** — incluye:
- Topbar con botón "Volver" + breadcrumb
- `card-section` con `cs-head` (icono + título + filtros + botón Nuevo)
- Tabla `.tbl` dentro de `.tbl-wrap`
- Estado vacío `.cs-empty`
- Estado cargando `.sbox.sbox--load`

---

## 8. Patrón de modal CRUD

```typescript
modalType   = signal<ModalType>(null);  // qué formulario mostrar
modalMode   = signal<'create' | 'edit'>('create');
modalSaving = signal(false);
editingId   = signal<number | null>(null);

// Abrir crear
openCreateTaller() {
  this.formTaller.reset({ categoria: 'deportivo', requiereAutorizacion: false });
  this.modalMode.set('create');
  this.editingId.set(null);
  this.modalType.set('taller');
}

// Abrir editar
openEditTaller(t: TallerResponse) {
  this.formTaller.patchValue({ ...t });
  this.modalMode.set('edit');
  this.editingId.set(t.id);
  this.modalType.set('taller');
}

// Cerrar
closeModal() { this.modalType.set(null); }
```

**Estructura HTML del modal:**
```html
@if (modalType() === 'taller') {
  <div class="mbk" (click)="closeModal()">
    <div class="mdl" (click)="$event.stopPropagation()">
      <div class="mdl__hd">
        <div class="mdl__hd-icon mdl__hd-icon--blue"><!-- icono --></div>
        <h3>{{ modalMode() === 'create' ? 'Nuevo Taller' : 'Editar Taller' }}</h3>
        <button class="mdl__x" (click)="closeModal()"><!-- X --></button>
      </div>
      <div class="mdl__bd">
        <form [formGroup]="formTaller">
          <!-- campos con .fg > .fl + .fi -->
          <!-- .frow para grids de 2 columnas -->
          <!-- .fe para errores -->
        </form>
      </div>
      <div class="mdl__ft">
        <button class="btn btn--ghost" (click)="closeModal()">Cancelar</button>
        <button class="btn btn--primary" (click)="saveTaller()" [disabled]="modalSaving()">
          {{ modalSaving() ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
}
```

---

## 9. Patrón de vista detalle (resolución de IDs)

Para `TallerEstudiante`, `ProgRecupEstudiante` y `Participacion`, los IDs se resuelven con `LookupService` usando `forkJoin`:

```typescript
// Interface de detalle enriquecido
interface DetalleTallerEst {
  registro:         TallerEstudianteResponse;
  nombreTaller:     string;
  nombreEstudiante: string;
}

detalleTallerEst = signal<DetalleTallerEst | null>(null);
cargandoDetalle  = signal(false);

verDetalleTallerEst(t: TallerEstudianteResponse): void {
  this.cargandoDetalle.set(true);
  forkJoin({
    taller:     this.lookupSvc.getTaller(t.tallerId),
    estudiante: this.lookupSvc.getEstudiante(t.estudianteId),
  }).subscribe({
    next: res => {
      this.detalleTallerEst.set({
        registro: t,
        nombreTaller:     res.taller.nombre,
        nombreEstudiante: `${res.estudiante.nombre} ${res.estudiante.apellido}`,
      });
      this.cargandoDetalle.set(false);
    },
    error: () => {
      this.cargandoDetalle.set(false);
      Swal.fire('Error', 'No se pudieron cargar los datos del detalle', 'error');
    },
  });
}
```

---

## 10. Lookup en tiempo real (hints en formularios)

Los campos de ID muestran un hint con el nombre resuelto mientras el usuario escribe:

```typescript
// Signal para el hint
hintTallerEstTaller = signal<string>('');

// Setup en ngOnInit → setupLookupListeners()
formTallerEst.get('tallerId')!.valueChanges.pipe(
  debounceTime(500),
  distinctUntilChanged(),
  takeUntil(this.destroy$)
).subscribe(v => {
  const id = Number(v);
  if (!v || isNaN(id) || id <= 0) { this.hintTallerEstTaller.set(''); return; }
  this.lookupSvc.getTaller(id).subscribe({
    next: r => this.hintTallerEstTaller.set(`✓ ${r.nombre}`),
    error: () => this.hintTallerEstTaller.set(''),
  });
});
```

En el HTML, debajo del input:
```html
@if (hintTallerEstTaller()) {
  <span class="fe" style="color: #059669">{{ hintTallerEstTaller() }}</span>
}
```

---

## 11. Soft delete vs toggle

Hay dos patrones de eliminación según la entidad:

**Toggle (activar/desactivar) — Talleres, ProgRecup, EventosInst:**
```typescript
toggleTaller(t: TallerResponse): void {
  this.tallerSvc.toggle(t.id).subscribe({
    next: () => this._talleres.update(list =>
      list.map(x => x.id === t.id ? { ...x, isActive: !x.isActive } : x)
    ),
    error: e => Swal.fire('Error', e.error?.message ?? 'Error', 'error'),
  });
}
```

**Soft delete + restaurar — TallerEst, ProgRecupEst, Participaciones:**
```typescript
softDeleteTallerEst(t: TallerEstudianteResponse): void {
  Swal.fire({
    title: '¿Eliminar lógicamente?',
    text: 'El registro quedará inactivo pero podrá restaurarse.',
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#f59e0b'
  }).then(r => {
    if (!r.isConfirmed) return;
    this.tallerEstSvc.eliminar(t.id).subscribe({
      next: () => this._talleresEst.update(list =>
        list.map(x => x.id === t.id ? { ...x, isActive: false } : x)
      ),
      error: e => Swal.fire('Error', e.error?.message ?? 'Error al eliminar', 'error'),
    });
  });
}

restaurarTallerEst(t: TallerEstudianteResponse): void {
  this.tallerEstSvc.restaurar(t.id).subscribe({
    next: () => this._talleresEst.update(list =>
      list.map(x => x.id === t.id ? { ...x, isActive: true } : x)
    ),
    error: e => Swal.fire('Error', e.error?.message ?? 'Error al restaurar', 'error'),
  });
}
```

---

## 12. Sistema de diseño visual (tokens SCSS)

Definidos en `src/app/feature/eventos/utils/_shared.scss`:

```scss
// Colores principales
$blue:    #2563eb;   $blue-d:  #1d4ed8;   $blue-l:  #dbeafe;   $blue-xl: #eff6ff;
$purple:  #7c3aed;   $purple-l:#ede9fe;   $purple-xl:#f5f3ff;
$green:   #059669;   $green-l: #d1fae5;   $green-xl: #ecfdf5;
$red:     #dc2626;   $red-l:   #fee2e2;
$amber:   #d97706;   $amber-l: #fef3c7;

// Escala de grises (slate)
$slate-50 → $slate-900
```

**Clases de layout principales:**

| Clase | Uso |
|---|---|
| `.ep` | Wrapper raíz del módulo |
| `.ev-header` | Header con icono, título y stats |
| `.tabs` / `.tab` / `.tab--on` | Navegación por tabs |
| `.panel` | Contenedor del panel activo |
| `.sec-menu` / `.sec-grid` | Menú de cards de secciones |
| `.sec-card` / `.sec-card--{color}` | Card de sección (blue, indigo, purple, green, red, amber, teal, slate) |
| `.sec-view` | Vista de sección activa |
| `.card-section` | Contenedor blanco con borde y sombra |
| `.cs-head` / `.cs-head__left` / `.cs-head__right` | Header de sección |
| `.cs-icon` / `.cs-icon--{color}` | Icono cuadrado de sección |
| `.cs-title` / `.cs-sub` | Título y subtítulo de sección |
| `.cs-empty` | Estado vacío |
| `.tbl-wrap` / `.tbl` | Tabla responsive |
| `.td-id` / `.td-trunc` | Celdas especiales |
| `.badge` / `.badge--{estado}` | Badges de estado |
| `.bdot` | Punto de color en badge |
| `.acts` / `.ab` / `.ab--{tipo}` | Botones de acción en tabla |
| `.btn` / `.btn--primary` / `.btn--ghost` / `.btn--sm` | Botones generales |
| `.filter-pills` / `.fpill` / `.fpill--on` | Pills de filtro |
| `.count-chip` | Chip con contador |
| `.mbk` / `.mdl` | Modal backdrop y contenedor |
| `.mdl__hd` / `.mdl__bd` / `.mdl__ft` | Partes del modal |
| `.frow` / `.fg` / `.fl` / `.fi` / `.fe` | Formulario |
| `.fsec` | Separador de sección en formulario |
| `.fchk` | Checkbox con label |
| `.sbox` / `.sbox--load` / `.sbox--err` | Cajas de estado (loading/error) |
| `.spin` | Animación de rotación |
| `.tchip` | Chip de hora |
| `.ev-link` | Link estilizado |

---

## 13. Iconos usados (Lucide Angular)

```typescript
import {
  Calendar, BookOpen, Users, Clock, MapPin, Link,
  AlertCircle, RefreshCw, Plus, Pencil, Trash2,
  ToggleLeft, ToggleRight, X, Save, Filter,
  GraduationCap, UserCheck, ClipboardList, Layers,
  ShieldAlert, FileText, UserPlus, ChevronRight, ArrowLeft,
  Dumbbell, BookMarked, CalendarDays, Award, RotateCcw, Eye,
} from 'lucide-angular';
```

Iconos más relevantes para Actividades:
- `Dumbbell` → Talleres
- `BookMarked` → Programas de recuperación
- `CalendarDays` → Eventos institucionales
- `Award` → Participaciones estudiantiles
- `UserPlus` → Inscripciones
- `RotateCcw` → Restaurar registro

---

## 14. Dependencias externas

- **`sweetalert2`** — confirmaciones y alertas (`Swal.fire(...)`)
- **`lucide-angular`** — iconos SVG
- **Angular Signals** — estado reactivo (`signal`, `computed`)
- **Angular Reactive Forms** — formularios con validación
- **RxJS** — `forkJoin`, `debounceTime`, `distinctUntilChanged`, `takeUntil`, `catchError`

---

## 15. Notas para adaptar a nueva estructura

1. **Los servicios** (`TallerService`, etc.) son independientes y reutilizables tal cual.
2. **Las interfaces** en `activity.interfaces.ts` no cambian.
3. **Los validadores** en `activity.validators.ts` son reutilizables.
4. **El `_shared.scss`** puede importarse con `@use` o copiarse como base de tokens.
5. **El patrón signal + computed** es el estándar del proyecto — mantenerlo.
6. **`LookupService`** resuelve IDs a nombres — necesario para las vistas de detalle.
7. Si la nueva estructura usa **rutas** en lugar del patrón menú/sección, cada sección puede convertirse en un componente standalone con su propia ruta.
8. El **modal CRUD** puede extraerse como componente reutilizable si se repite en múltiples secciones.
