import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin, takeUntil, catchError, of } from 'rxjs';
import {
  LucideAngularModule,
  BookOpen, GraduationCap, UserCheck, ClipboardList, Layers,
  ShieldAlert, FileText, UserPlus, RefreshCw, AlertCircle,
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Save,
  ChevronRight, ArrowLeft, Clock
} from 'lucide-angular';
import Swal from 'sweetalert2';

import {
  ProgramaTutoriaResponse, ProgramaTutoriaRequest,
  TutorGradoResponse, TutorGradoRequest,
  TutorEstudianteResponse, TutorEstudianteRequest,
  SesionTutoriaResponse, SesionTutoriaRequest,
  IncidenciaResponse, SeguimientoIncidenciaResponse,
  EventoParticipanteResponse, DocumentoTutoriaResponse,
} from '../../../../core/interfaces/welfare.interfaces';

import { ProgramaTutoriaService }        from '../../../../core/services/programa-tutoria.service';
import { TutorGradoService }             from '../../../../core/services/tutor-grado.service';
import { TutorEstudianteService }        from '../../../../core/services/tutor-estudiante.service';
import { SesionTutoriaService }          from '../../../../core/services/sesion-tutoria.service';
import { IncidenciaService }             from '../../../../core/services/incidencia.service';
import { SeguimientoIncidenciaService }  from '../../../../core/services/seguimiento-incidencia.service';
import { EventoParticipanteService }     from '../../../../core/services/evento-participante.service';
import { DocumentoTutoriaService }       from '../../../../core/services/documento-tutoria.service';
import { DocenteService }                from '../../../../core/services/academic/docente.service';
import { GradoService }                  from '../../../../core/services/academic/grado.service';
import { AnoAcademicoService }           from '../../../../core/services/academic/ano-academico.service';

type ModalType = 'programa' | 'tutorGrado' | 'tutorEstudiante' | 'sesion' | null;
type SeccionTutoria =
  | 'menu' | 'programas' | 'tutoresGrado' | 'tutoresEstudiante'
  | 'sesiones' | 'incidencias' | 'seguimientoIncidencias'
  | 'documentos' | 'participantesEventos' | null;
type FiltroActivo = 'todos' | 'activos' | 'inactivos';
type FiltroEst    = 'todos' | 'activa' | 'inactiva';

@Component({
  selector: 'app-tutorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './tutorias.component.html',
  styleUrl: './tutorias.component.scss',
})
export class TutoriasComponent implements OnInit, OnDestroy {
  readonly BookOpen = BookOpen; readonly GraduationCap = GraduationCap;
  readonly UserCheck = UserCheck; readonly ClipboardList = ClipboardList;
  readonly Layers = Layers; readonly ShieldAlert = ShieldAlert;
  readonly FileText = FileText; readonly UserPlus = UserPlus;
  readonly RefreshCw = RefreshCw; readonly AlertCircle = AlertCircle;
  readonly Plus = Plus; readonly Pencil = Pencil; readonly Trash2 = Trash2;
  readonly ToggleLeft = ToggleLeft; readonly ToggleRight = ToggleRight;
  readonly X = X; readonly Save = Save;
  readonly ChevronRight = ChevronRight; readonly ArrowLeft = ArrowLeft;
  readonly Clock = Clock;

  private destroy$ = new Subject<void>();

  seccionActiva = signal<SeccionTutoria>('menu');
  modalType     = signal<ModalType>(null);
  modalMode     = signal<'create' | 'edit'>('create');
  modalSaving   = signal(false);
  editingId     = signal<number | null>(null);
  loading       = signal(false);
  error         = signal<string | null>(null);

  // ===== DATA SIGNALS =====
  private _programas         = signal<ProgramaTutoriaResponse[]>([]);
  private _tutoresGrado      = signal<TutorGradoResponse[]>([]);
  private _tutoresEstudiante = signal<TutorEstudianteResponse[]>([]);
  sesiones      = signal<SesionTutoriaResponse[]>([]);
  incidencias   = signal<IncidenciaResponse[]>([]);
  seguimientos  = signal<SeguimientoIncidenciaResponse[]>([]);
  participantes = signal<EventoParticipanteResponse[]>([]);
  documentos    = signal<DocumentoTutoriaResponse[]>([]);

  // ===== LOOKUP SIGNALS — se cargan desde APIs reales, fallback a vacío =====
  profesoresLookup  = signal<Array<{id: number, nombre: string}>>([]);
  gradosLookup      = signal<Array<{id: number, nombre: string}>>([]);
  anosAcademicos    = signal<Array<{id: number, nombre: string}>>([]);
  estudiantesLookup = signal<Array<{id: number, nombre: string}>>([]);  // reservado para futura API

  hasProfesores  = computed(() => this.profesoresLookup().length > 0);
  hasGrados      = computed(() => this.gradosLookup().length > 0);
  hasAnos        = computed(() => this.anosAcademicos().length > 0);
  // estudiantes no tienen servicio de lookup disponible aún — siempre input manual
  hasEstudiantes = computed(() => false);

  // ===== FILTROS =====
  filtroProg  = signal<FiltroActivo>('activos');
  filtroGrado = signal<FiltroActivo>('activos');
  filtroEst   = signal<FiltroEst>('todos');

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
  countProg  = computed(() => ({ todos: this._programas().length, activos: this._programas().filter(p => p.activo).length, inactivos: this._programas().filter(p => !p.activo).length }));
  countGrado = computed(() => ({ todos: this._tutoresGrado().length, activos: this._tutoresGrado().filter(t => t.activo).length, inactivos: this._tutoresGrado().filter(t => !t.activo).length }));
  countEst   = computed(() => ({ todos: this._tutoresEstudiante().length, activa: this._tutoresEstudiante().filter(t => t.estado === 'activa').length, inactiva: this._tutoresEstudiante().filter(t => t.estado !== 'activa').length }));

  formPrograma!: FormGroup;
  formTutorGrado!: FormGroup;
  formTutorEstudiante!: FormGroup;
  formSesion!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private programaSvc: ProgramaTutoriaService,
    private tutorGradoSvc: TutorGradoService,
    private tutorEstSvc: TutorEstudianteService,
    private sesionSvc: SesionTutoriaService,
    private incidenciaSvc: IncidenciaService,
    private seguimientoSvc: SeguimientoIncidenciaService,
    private participanteSvc: EventoParticipanteService,
    private documentoSvc: DocumentoTutoriaService,
    private docenteSvc: DocenteService,
    private gradoSvc: GradoService,
    private anoSvc: AnoAcademicoService,
  ) { this.initForms(); }

  ngOnInit(): void {
    this.loadTutorias();
    this.loadResumenTutorias();
    this.loadLookupData();
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private initForms(): void {
    this.formPrograma = this.fb.group({
      institucionId:  [null, Validators.required],
      anoAcademicoId: [null, Validators.required],
      nombre:         ['',   Validators.required],
      tipo:           ['GRUPAL', Validators.required],
      descripcion:    [''],
      objetivos:      [''],
    });
    this.formTutorGrado = this.fb.group({
      programaTutoriaId: [null, Validators.required],
      profesorId:        [null, Validators.required],
      gradoId:           [null, Validators.required],
      fechaInicio:       [''],
      fechaFin:          [''],
    });
    this.formTutorEstudiante = this.fb.group({
      profesorId:        [null, Validators.required],
      estudianteId:      [null, Validators.required],
      tipo:              ['ACADEMICA', Validators.required],
      programaTutoriaId: [null],
      motivo:            [''],
      objetivos:         [''],
      fechaInicio:       [''],
      fechaFin:          [''],
      derivadoPor:       [null],
    });
    this.formSesion = this.fb.group({
      fechaSesion:       ['', Validators.required],
      horaInicio:        ['', Validators.required],
      horaFin:           [''],
      tipo:              ['individual', Validators.required],
      modalidad:         ['presencial'],
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
    });
  }

  // ===== NAVIGATION =====
  irSeccion(s: SeccionTutoria): void {
    this.seccionActiva.set(s);
    this.error.set(null);
    if (s === 'programas' || s === 'tutoresGrado' || s === 'tutoresEstudiante' || s === 'sesiones') this.loadTutorias();
    if (s === 'incidencias')            this.loadIncidencias();
    if (s === 'seguimientoIncidencias') this.loadSeguimientos();
    if (s === 'participantesEventos')   this.loadParticipantes();
    if (s === 'documentos')             this.loadDocumentos();
  }
  volverMenu(): void { this.seccionActiva.set('menu'); }

  // ===== CARGA =====
  loadTutorias(): void {
    this.loading.set(true);
    forkJoin({
      programas:  this.programaSvc.getAll().pipe(catchError(() => of([]))),
      grado:      this.tutorGradoSvc.getAll().pipe(catchError(() => of([]))),
      estudiante: this.tutorEstSvc.getAll().pipe(catchError(() => of([]))),
      sesiones:   this.sesionSvc.getAll().pipe(catchError(() => of([]))),
    }).pipe(takeUntil(this.destroy$)).subscribe(r => {
      this._programas.set(this.dedup(r.programas));
      this._tutoresGrado.set(this.dedup(r.grado));
      this._tutoresEstudiante.set(this.dedup(r.estudiante));
      this.sesiones.set(this.dedup(r.sesiones));
      this.loading.set(false);
    });
  }

  // Carga lookup desde APIs reales; si falla, queda vacío (el form muestra input manual)
  loadLookupData(): void {
    this.docenteSvc.listar().pipe(catchError(() => of([])), takeUntil(this.destroy$))
      .subscribe(d => this.profesoresLookup.set(
        d.map((p: any) => ({ id: p.id, nombre: `${p.nombres} ${p.apellidos}` }))
      ));
    this.gradoSvc.listar().pipe(catchError(() => of([])), takeUntil(this.destroy$))
      .subscribe(d => this.gradosLookup.set(
        d.map((g: any) => ({ id: g.id, nombre: g.nombre }))
      ));
    this.anoSvc.listar().pipe(catchError(() => of([])), takeUntil(this.destroy$))
      .subscribe(d => this.anosAcademicos.set(
        d.map((a: any) => ({ id: a.id, nombre: a.nombre }))
      ));
  }

  loadResumenTutorias(): void {
    this.incidenciaSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => of([]))).subscribe(d => this.incidencias.set(this.dedup(d)));
    this.documentoSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => of([]))).subscribe(d => this.documentos.set(this.dedup(d)));
  }
  loadIncidencias(): void {
    this.loading.set(true); this.incidencias.set([]);
    this.incidenciaSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => { this.error.set('Error al cargar incidencias'); return of([]); }))
      .subscribe(d => { this.incidencias.set(this.dedup(d)); this.loading.set(false); });
  }
  loadSeguimientos(): void {
    this.loading.set(true); this.seguimientos.set([]);
    this.seguimientoSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => { this.error.set('Error al cargar seguimientos'); return of([]); }))
      .subscribe(d => { this.seguimientos.set(this.dedup(d)); this.loading.set(false); });
  }
  loadParticipantes(): void {
    this.loading.set(true); this.participantes.set([]);
    this.participanteSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => { this.error.set('Error al cargar participantes'); return of([]); }))
      .subscribe(d => {
        const seen = new Set<string>();
        this.participantes.set(d.filter(p => { const k = `${p.eventoId}-${p.usuarioId}`; if (seen.has(k)) return false; seen.add(k); return true; }));
        this.loading.set(false);
      });
  }
  loadDocumentos(): void {
    this.loading.set(true); this.documentos.set([]);
    this.documentoSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => { this.error.set('Error al cargar documentos'); return of([]); }))
      .subscribe(d => { this.documentos.set(this.dedup(d)); this.loading.set(false); });
  }

  closeModal(): void { this.modalType.set(null); this.modalSaving.set(false); }

  // ===== PROGRAMAS CRUD =====
  openCreatePrograma(): void {
    this.formPrograma.reset({ tipo: 'GRUPAL' });
    this.modalMode.set('create'); this.editingId.set(null); this.modalType.set('programa');
  }
  openEditPrograma(p: ProgramaTutoriaResponse): void {
    this.formPrograma.patchValue(p);
    this.modalMode.set('edit'); this.editingId.set(p.id); this.modalType.set('programa');
  }
  savePrograma(): void {
    if (this.formPrograma.invalid) { this.formPrograma.markAllAsTouched(); return; }
    this.modalSaving.set(true);
    const isEdit = this.modalMode() === 'edit', id = this.editingId();
    const req$ = isEdit && id ? this.programaSvc.update(id, this.formPrograma.value) : this.programaSvc.create(this.formPrograma.value);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        isEdit && id ? this._programas.update(l => l.map(x => x.id === id ? r : x)) : this._programas.update(l => [...l, r]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: `Programa ${isEdit ? 'actualizado' : 'creado'}`, timer: 1500, showConfirmButton: false });
      },
      error: e => { this.modalSaving.set(false); Swal.fire('Error', e.error?.message ?? 'Error al guardar', 'error'); }
    });
  }
  // FIX: eliminación lógica — desactiva en lugar de borrar físicamente
  deletePrograma(p: ProgramaTutoriaResponse): void {
    Swal.fire({ title: `¿${p.activo ? 'Desactivar' : 'Eliminar'} programa?`, text: p.activo ? 'El programa quedará inactivo.' : 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, confirmButtonText: `Sí, ${p.activo ? 'desactivar' : 'eliminar'}`, confirmButtonColor: p.activo ? '#f59e0b' : '#dc2626', cancelButtonText: 'Cancelar' })
      .then((r: { isConfirmed: boolean }) => {
        if (!r.isConfirmed) return;
        if (p.activo) {
          this.programaSvc.desactivar(p.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this._programas.update(l => l.map(x => x.id === p.id ? { ...x, activo: false } : x)),
            error: (e: any) => Swal.fire('Error', e.error?.message ?? 'Error al desactivar', 'error')
          });
        } else {
          this.programaSvc.delete(p.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this._programas.update(l => l.filter(x => x.id !== p.id)),
            error: (e: any) => Swal.fire('Error', e.error?.message ?? 'Error al eliminar', 'error')
          });
        }
      });
  }
  togglePrograma(p: ProgramaTutoriaResponse): void {
    const req$ = p.activo ? this.programaSvc.desactivar(p.id) : this.programaSvc.activar(p.id);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => this._programas.update(l => l.map(x => x.id === p.id ? r : x)),
      error: e => Swal.fire('Error', e.error?.message ?? 'Error', 'error')
    });
  }

  // ===== TUTORES GRADO CRUD =====
  openCreateTutorGrado(): void {
    this.formTutorGrado.reset();
    this.modalMode.set('create'); this.editingId.set(null); this.modalType.set('tutorGrado');
  }
  openEditTutorGrado(t: TutorGradoResponse): void {
    this.formTutorGrado.patchValue(t);
    this.modalMode.set('edit'); this.editingId.set(t.id); this.modalType.set('tutorGrado');
  }
  saveTutorGrado(): void {
    if (this.formTutorGrado.invalid) { this.formTutorGrado.markAllAsTouched(); return; }
    this.modalSaving.set(true);
    const isEdit = this.modalMode() === 'edit', id = this.editingId();
    const req$ = isEdit && id ? this.tutorGradoSvc.update(id, this.formTutorGrado.value) : this.tutorGradoSvc.create(this.formTutorGrado.value);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        isEdit && id ? this._tutoresGrado.update(l => l.map(x => x.id === id ? r : x)) : this._tutoresGrado.update(l => [...l, r]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: `Tutor de grado ${isEdit ? 'actualizado' : 'creado'}`, timer: 1500, showConfirmButton: false });
      },
      error: e => { this.modalSaving.set(false); Swal.fire('Error', e.error?.message ?? 'Error al guardar', 'error'); }
    });
  }
  // FIX: eliminación lógica
  deleteTutorGrado(t: TutorGradoResponse): void {
    Swal.fire({ title: `¿${t.activo ? 'Desactivar' : 'Eliminar'} tutor de grado?`, text: t.activo ? 'El tutor quedará inactivo.' : 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, confirmButtonText: `Sí, ${t.activo ? 'desactivar' : 'eliminar'}`, confirmButtonColor: t.activo ? '#f59e0b' : '#dc2626', cancelButtonText: 'Cancelar' })
      .then((r: { isConfirmed: boolean }) => {
        if (!r.isConfirmed) return;
        if (t.activo) {
          this.tutorGradoSvc.desactivar(t.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this._tutoresGrado.update(l => l.map(x => x.id === t.id ? { ...x, activo: false } : x)),
            error: (e: any) => Swal.fire('Error', e.error?.message ?? 'Error al desactivar', 'error')
          });
        } else {
          this.tutorGradoSvc.delete(t.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this._tutoresGrado.update(l => l.filter(x => x.id !== t.id)),
            error: (e: any) => Swal.fire('Error', e.error?.message ?? 'Error al eliminar', 'error')
          });
        }
      });
  }
  toggleTutorGrado(t: TutorGradoResponse): void {
    const req$ = t.activo ? this.tutorGradoSvc.desactivar(t.id) : this.tutorGradoSvc.activar(t.id);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => this._tutoresGrado.update(l => l.map(x => x.id === t.id ? r : x)),
      error: e => Swal.fire('Error', e.error?.message ?? 'Error', 'error')
    });
  }

  // ===== TUTORES ESTUDIANTE CRUD =====
  openCreateTutorEstudiante(): void {
    this.formTutorEstudiante.reset({ tipo: 'ACADEMICA' });
    this.modalMode.set('create'); this.editingId.set(null); this.modalType.set('tutorEstudiante');
  }
  openEditTutorEstudiante(t: TutorEstudianteResponse): void {
    this.formTutorEstudiante.patchValue(t);
    this.modalMode.set('edit'); this.editingId.set(t.id); this.modalType.set('tutorEstudiante');
  }
  saveTutorEstudiante(): void {
    if (this.formTutorEstudiante.invalid) { this.formTutorEstudiante.markAllAsTouched(); return; }
    this.modalSaving.set(true);
    const isEdit = this.modalMode() === 'edit', id = this.editingId();
    const req$ = isEdit && id ? this.tutorEstSvc.update(id, this.formTutorEstudiante.value) : this.tutorEstSvc.create(this.formTutorEstudiante.value);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        isEdit && id ? this._tutoresEstudiante.update(l => l.map(x => x.id === id ? r : x)) : this._tutoresEstudiante.update(l => [...l, r]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: `Tutoría ${isEdit ? 'actualizada' : 'creada'}`, timer: 1500, showConfirmButton: false });
      },
      error: e => { this.modalSaving.set(false); Swal.fire('Error', e.error?.message ?? 'Error al guardar', 'error'); }
    });
  }
  // FIX: eliminación lógica — desactiva si está activa, elimina si ya está inactiva
  deleteTutorEstudiante(t: TutorEstudianteResponse): void {
    const esActiva = t.estado === 'activa';
    Swal.fire({ title: `¿${esActiva ? 'Desactivar' : 'Eliminar'} tutoría?`, text: esActiva ? 'La tutoría quedará cancelada.' : 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, confirmButtonText: `Sí, ${esActiva ? 'desactivar' : 'eliminar'}`, confirmButtonColor: esActiva ? '#f59e0b' : '#dc2626', cancelButtonText: 'Cancelar' })
      .then((r: { isConfirmed: boolean }) => {
        if (!r.isConfirmed) return;
        if (esActiva) {
          this.tutorEstSvc.desactivar(t.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this._tutoresEstudiante.update(l => l.map(x => x.id === t.id ? { ...x, estado: 'cancelada' as const } : x)),
            error: (e: any) => Swal.fire('Error', e.error?.message ?? 'Error al desactivar', 'error')
          });
        } else {
          this.tutorEstSvc.delete(t.id).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this._tutoresEstudiante.update(l => l.filter(x => x.id !== t.id)),
            error: (e: any) => Swal.fire('Error', e.error?.message ?? 'Error al eliminar', 'error')
          });
        }
      });
  }
  // FIX: toggle correcto usando activar/desactivar
  toggleTutorEstudiante(t: TutorEstudianteResponse): void {
    const req$ = t.estado === 'activa' ? this.tutorEstSvc.desactivar(t.id) : this.tutorEstSvc.activar(t.id);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this._tutoresEstudiante.update(l => l.map(x => x.id === t.id ? { ...x, estado: t.estado === 'activa' ? 'cancelada' as const : 'activa' as const } : x)),
      error: (e: any) => Swal.fire('Error', e.error?.message ?? 'Error', 'error')
    });
  }

  // ===== SESIONES CRUD =====
  openCreateSesion(): void {
    this.formSesion.reset({ tipo: 'individual', modalidad: 'presencial', firmadoPorAlumno: false, firmadoPorPadre: false });
    this.modalMode.set('create'); this.editingId.set(null); this.modalType.set('sesion');
  }
  openEditSesion(s: SesionTutoriaResponse): void {
    this.formSesion.patchValue(s);
    this.modalMode.set('edit'); this.editingId.set(s.id); this.modalType.set('sesion');
  }
  saveSesion(): void {
    if (this.formSesion.invalid) { this.formSesion.markAllAsTouched(); return; }
    this.modalSaving.set(true);
    const isEdit = this.modalMode() === 'edit', id = this.editingId();
    const req$ = isEdit && id ? this.sesionSvc.update(id, this.formSesion.value) : this.sesionSvc.create(this.formSesion.value);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        isEdit && id ? this.sesiones.update(l => l.map(x => x.id === id ? r : x)) : this.sesiones.update(l => [...l, r]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: `Sesión ${isEdit ? 'actualizada' : 'creada'}`, timer: 1500, showConfirmButton: false });
      },
      error: e => { this.modalSaving.set(false); Swal.fire('Error', e.error?.message ?? 'Error al guardar', 'error'); }
    });
  }
  deleteSesion(id: number): void {
    Swal.fire({ title: '¿Eliminar sesión?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#dc2626', cancelButtonText: 'Cancelar' })
      .then((r: { isConfirmed: boolean }) => {
        if (!r.isConfirmed) return;
        this.sesionSvc.delete(id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => this.sesiones.update(l => l.filter(x => x.id !== id)),
          error: e => Swal.fire('Error', e.error?.message ?? 'Error al eliminar', 'error')
        });
      });
  }

  // ===== DOCUMENTOS =====
  deleteDocumento(id: number): void {
    Swal.fire({ title: '¿Eliminar documento?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#dc2626', cancelButtonText: 'Cancelar' })
      .then((r: { isConfirmed: boolean }) => {
        if (!r.isConfirmed) return;
        this.documentoSvc.delete(id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => this.documentos.update(l => l.filter(x => x.id !== id)),
          error: e => Swal.fire('Error', e.error?.message ?? 'Error al eliminar', 'error')
        });
      });
  }

  // ===== HELPERS =====
  formatFecha(f: string | null | undefined): string {
    if (!f) return '-';
    const [y, m, d] = f.split('-');
    return `${d}/${m}/${y}`;
  }
  formatHora(h: string | null | undefined): string {
    if (!h) return '-';
    return h.substring(0, 5);
  }
  formatTamano(kb: number): string {
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
  }
  hasError(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!(c && c.invalid && c.touched);
  }

  // Lookup helpers — muestran nombre si existe en lookup, si no muestran "ID: X"
  getProfesorNombre(id: number | null | undefined): string {
    if (!id) return '-';
    const p = this.profesoresLookup().find(x => x.id === id);
    return p ? p.nombre : `ID: ${id}`;
  }
  getGradoNombre(id: number | null | undefined): string {
    if (!id) return '-';
    const g = this.gradosLookup().find(x => x.id === id);
    return g ? g.nombre : `ID: ${id}`;
  }
  getEstudianteNombre(id: number | null | undefined): string {
    if (!id) return '-';
    return `ID: ${id}`; // estudiantes no tienen servicio de lookup disponible aún
  }
  getProgramaNombre(id: number | null | undefined): string {
    if (!id) return '-';
    const p = this._programas().find(x => x.id === id);
    return p ? p.nombre : `ID: ${id}`;
  }
  getAnoNombre(id: number | null | undefined): string {
    if (!id) return '-';
    const a = this.anosAcademicos().find(x => x.id === id);
    return a ? a.nombre : `ID: ${id}`;
  }

  get tiposProg(): string[]         { return ['GRUPAL', 'INDIVIDUAL', 'MIXTO']; }
  get tiposTutorEst(): string[]     { return ['ACADEMICA', 'PERSONAL', 'VOCACIONAL', 'DISCIPLINARIA', 'EMOCIONAL']; }
  get tiposSesion(): string[]       { return ['individual', 'grupal', 'familiar', 'seguimiento']; }
  get modalidadesSesion(): string[] { return ['presencial', 'virtual', 'hibrida']; }

  private dedup<T extends { id: number }>(list: T[]): T[] {
    const seen = new Set<number>();
    return list.filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
  }
}
