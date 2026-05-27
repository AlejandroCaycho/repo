import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  soloTextoValidator,
  horaFinMayorValidator,
  fechaFinMayorIgualValidator,
  fechaFuturaValidator,
  montoReferencialValidator,
} from '../validators/activity.validators';
import { Subject, forkJoin, debounceTime, distinctUntilChanged, takeUntil, catchError, of } from 'rxjs';
import {
  LucideAngularModule,
  Dumbbell, BookMarked, CalendarDays, Award, UserPlus, RotateCcw,
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Save,
  ChevronRight, ArrowLeft, Eye, RefreshCw
} from 'lucide-angular';
import Swal from 'sweetalert2';

import {
  TallerResponse, TallerEstudianteResponse,
  ProgramaRecuperacionResponse, ProgramaRecuperacionEstudianteResponse,
  EventoInstitucionalResponse, ParticipacionEstudiantilResponse,
  CategoriaTaller, DiaSemana, EstadoTallerEst,
  TipoProgRecuperacion, EstadoProgRecupEst, TipoEventoInstitucional,
} from '../../../../core/interfaces/actividades.interfaces';

import {
  TallerService, TallerEstudianteService, ProgramaRecuperacionService,
  ProgramaRecuperacionEstudianteService, EventoInstitucionalService,
  ParticipacionEstudiantilService
} from '../../../../core/services/actividades.service';

import { LookupService, EstudianteLookup, TallerLookup, ProgramaRecupLookup } from '../../../../core/services/actividades.service';
import {
  LookupService as FeatureLookupService,
  InstitucionLookup, PersonaLookup, AulaLookup, MateriaLookup, ProfesorLookup,
} from '../services/lookup.service';

// ── Interfaces de detalle enriquecido ─────────────────────────
interface DetalleTaller {
  registro:           TallerResponse;
  nombreInstitucion:  string;
  nombreProfesor:     string;
  nombreAula:         string;
}
interface DetalleTallerEst {
  registro:           TallerEstudianteResponse;
  nombreTaller:       string;
  nombreEstudiante:   string;
}
interface DetalleProgRecup {
  registro:           ProgramaRecuperacionResponse;
  nombreInstitucion:  string;
  nombreMateria:      string;
  nombreAula:         string;
  nombreProfesor:     string;
}
interface DetalleProgRecupEst {
  registro:           ProgramaRecuperacionEstudianteResponse;
  nombrePrograma:     string;
  nombreEstudiante:   string;
}
interface DetalleEventoInst {
  registro:           EventoInstitucionalResponse;
  nombreInstitucion:  string;
  nombreResponsable:  string;
}
interface DetalleParticipacion {
  registro:           ParticipacionEstudiantilResponse;
  nombreInstitucion:  string;
  nombreEstudiante:   string;
  nombreProfesor:     string;
}

type SeccionActividad = 'menu' | 'talleres' | 'talleresEst' | 'programasRecup' | 'programasRecupEst' | 'eventosInst' | 'participaciones' | null;
type ModalType = 'taller' | 'tallerEst' | 'programaRecup' | 'programaRecupEst' | 'eventoInst' | 'participacion' | null;
type FiltroEstado = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './actividades.component.html',
  styleUrl: './actividades.component.scss',
})
export class ActividadesComponent implements OnInit, OnDestroy {
  // Icons
  readonly Dumbbell = Dumbbell;
  readonly BookMarked = BookMarked;
  readonly CalendarDays = CalendarDays;
  readonly Award = Award;
  readonly UserPlus = UserPlus;
  readonly RotateCcw = RotateCcw;
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly ToggleLeft = ToggleLeft;
  readonly ToggleRight = ToggleRight;
  readonly X = X;
  readonly Save = Save;
  readonly ChevronRight = ChevronRight;
  readonly ArrowLeft = ArrowLeft;
  readonly Eye = Eye;
  readonly RefreshCw = RefreshCw;

  private destroy$ = new Subject<void>();

  // Navigation
  seccionActividad = signal<SeccionActividad>('menu');

  // Modal state
  modalType   = signal<ModalType>(null);
  modalMode   = signal<'create' | 'edit'>('create');
  modalSaving = signal(false);
  editingId   = signal<number | null>(null);

  // Loading / error
  loadingAct = signal(false);
  errorAct   = signal<string | null>(null);

  // Detalle (lookup)
  detalleTaller       = signal<DetalleTaller | null>(null);
  detalleTallerEst    = signal<DetalleTallerEst | null>(null);
  detalleProgRecup    = signal<DetalleProgRecup | null>(null);
  detalleProgRecupEst = signal<DetalleProgRecupEst | null>(null);
  detalleEventoInst   = signal<DetalleEventoInst | null>(null);
  detalleParticipacion = signal<DetalleParticipacion | null>(null);
  cargandoDetalle     = signal(false);

  // Hints lookup en formularios
  hintTallerEstTaller     = signal('');
  hintTallerEstEst        = signal('');
  hintProgRecupEstProg    = signal('');
  hintProgRecupEstEst     = signal('');
  hintParticipacionEst    = signal('');

  // ===== SIGNALS + COMPUTED =====
  private _talleres         = signal<TallerResponse[]>([]);
  private _talleresEst      = signal<TallerEstudianteResponse[]>([]);
  private _programasRecup   = signal<ProgramaRecuperacionResponse[]>([]);
  private _programasRecupEst = signal<ProgramaRecuperacionEstudianteResponse[]>([]);
  private _eventosInst      = signal<EventoInstitucionalResponse[]>([]);
  private _participaciones  = signal<ParticipacionEstudiantilResponse[]>([]);

  filtroTaller         = signal<FiltroEstado>('todos');
  filtroTallerEst      = signal<FiltroEstado>('todos');
  filtroProgramaRecup  = signal<FiltroEstado>('todos');
  filtroProgramaRecupEst = signal<FiltroEstado>('todos');
  filtroEventoInst     = signal<FiltroEstado>('todos');
  filtroParticipacion  = signal<FiltroEstado>('todos');

  talleres = computed(() => this.applyFilter(this._talleres(), this.filtroTaller()));
  talleresEst = computed(() => this.applyFilter(this._talleresEst(), this.filtroTallerEst()));
  programasRecup = computed(() => this.applyFilter(this._programasRecup(), this.filtroProgramaRecup()));
  programasRecupEst = computed(() => this.applyFilter(this._programasRecupEst(), this.filtroProgramaRecupEst()));
  eventosInst = computed(() => this.applyFilter(this._eventosInst(), this.filtroEventoInst()));
  participaciones = computed(() => this.applyFilter(this._participaciones(), this.filtroParticipacion()));

  countTaller         = computed(() => this.buildCount(this._talleres()));
  countTallerEst      = computed(() => this.buildCount(this._talleresEst()));
  countProgramaRecup  = computed(() => this.buildCount(this._programasRecup()));
  countProgramaRecupEst = computed(() => this.buildCount(this._programasRecupEst()));
  countEventoInst     = computed(() => this.buildCount(this._eventosInst()));
  countParticipacion  = computed(() => this.buildCount(this._participaciones()));

  private applyFilter<T extends { isActive: boolean }>(list: T[], f: FiltroEstado): T[] {
    if (f === 'activos')   return list.filter(x => x.isActive);
    if (f === 'inactivos') return list.filter(x => !x.isActive);
    return list;
  }

  private buildCount<T extends { isActive: boolean }>(list: T[]) {
    return {
      todos:     list.length,
      activos:   list.filter(x => x.isActive).length,
      inactivos: list.filter(x => !x.isActive).length,
    };
  }

  // Forms
  formTaller!: FormGroup;
  formTallerEst!: FormGroup;
  formProgramaRecup!: FormGroup;
  formProgramaRecupEst!: FormGroup;
  formEventoInst!: FormGroup;
  formParticipacion!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private tallerSvc: TallerService,
    private tallerEstSvc: TallerEstudianteService,
    private programaRecupSvc: ProgramaRecuperacionService,
    private programaRecupEstSvc: ProgramaRecuperacionEstudianteService,
    private eventoInstSvc: EventoInstitucionalService,
    private participacionSvc: ParticipacionEstudiantilService,
    private lookupSvc: LookupService,
    private featureLookup: FeatureLookupService,
  ) { this.initForms(); }

  ngOnInit(): void { this.setupLookupListeners(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== INIT FORMS =====
  private initForms(): void {
    this.formTaller = this.fb.group(
      {
        institucionId:         [1, Validators.required],
        nombre:                ['', [Validators.required, soloTextoValidator]],
        descripcion:           ['', Validators.maxLength(100)],
        categoria:             ['deportivo', Validators.required],
        profesorResponsableId: [''],
        aulaId:                [''],
        diaSemana:             [''],
        horaInicio:            [''],
        horaFin:               [''],
        cupoMaximo:            [''],
        requiereAutorizacion:  [false],
      },
      { validators: horaFinMayorValidator }
    );

    this.formTallerEst = this.fb.group({
      tallerId:         ['', Validators.required],
      estudianteId:     ['', Validators.required],
      fechaInscripcion: ['', fechaFuturaValidator],
      estado:           ['activo'],
      observaciones:    ['', Validators.maxLength(100)],
    });

    this.formProgramaRecup = this.fb.group(
      {
        institucionId: [1, Validators.required],
        materiaId:     [''],
        aulaId:        [''],
        profesorId:    [''],
        nombre:        ['', [Validators.required, soloTextoValidator]],
        descripcion:   ['', Validators.maxLength(100)],
        tipo:          ['recuperacion', Validators.required],
        fechaInicio:   ['', Validators.required],
        fechaFin:      ['', Validators.required],
        horaInicio:    [''],
        horaFin:       [''],
        capacidadMax:  [''],
      },
      { validators: [horaFinMayorValidator, fechaFinMayorIgualValidator] }
    );

    this.formProgramaRecupEst = this.fb.group({
      programaId:       ['', Validators.required],
      estudianteId:     ['', Validators.required],
      fechaInscripcion: ['', fechaFuturaValidator],
      estado:           ['activo'],
      promedioFinal:    ['', [Validators.min(0), Validators.max(20)]],
      observaciones:    ['', Validators.maxLength(100)],
    });

    this.formEventoInst = this.fb.group({
      institucionId:    [1, Validators.required],
      responsableId:    [''],
      nombre:           ['', [Validators.required, soloTextoValidator]],
      descripcion:      ['', Validators.maxLength(100)],
      tipoEvento:       ['cultural', Validators.required],
      fechaEvento:      ['', [Validators.required, fechaFuturaValidator]],
      lugar:            ['', soloTextoValidator],
      requiereCuota:    [false],
      montoReferencial: ['', montoReferencialValidator],
      descripcionCuota: [''],
    });

    this.formParticipacion = this.fb.group({
      institucionId:          [1, Validators.required],
      estudianteId:           ['', Validators.required],
      profesorResponsableId:  [''],
      nombreEvento:           ['', [Validators.required, soloTextoValidator]],
      tipo:                   ['', soloTextoValidator],
      organizador:            ['', soloTextoValidator],
      lugar:                  ['', soloTextoValidator],
      fechaEvento:            ['', fechaFuturaValidator],
      resultado:              ['', soloTextoValidator],
      observaciones:          ['', Validators.maxLength(100)],
    });
  }

  // ===== LOOKUP LISTENERS =====
  private setupLookupListeners(): void {
    // tallerId hint
    this.formTallerEst.get('tallerId')!.valueChanges.pipe(
      debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(v => {
      const id = Number(v);
      if (!v || isNaN(id) || id <= 0) { this.hintTallerEstTaller.set(''); return; }
      this.lookupSvc.getTaller(id).subscribe({
        next: (r: TallerLookup) => this.hintTallerEstTaller.set(`✓ ${r.nombre}`),
        error: () => this.hintTallerEstTaller.set('✗ No encontrado'),
      });
    });

    // estudianteId hint (tallerEst)
    this.formTallerEst.get('estudianteId')!.valueChanges.pipe(
      debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(v => {
      const id = Number(v);
      if (!v || isNaN(id) || id <= 0) { this.hintTallerEstEst.set(''); return; }
      this.lookupSvc.getEstudiante(id).subscribe({
        next: (r: EstudianteLookup) => this.hintTallerEstEst.set(`✓ ${r.nombre} ${r.apellido}`),
        error: () => this.hintTallerEstEst.set('✗ No encontrado'),
      });
    });

    // programaId hint
    this.formProgramaRecupEst.get('programaId')!.valueChanges.pipe(
      debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(v => {
      const id = Number(v);
      if (!v || isNaN(id) || id <= 0) { this.hintProgRecupEstProg.set(''); return; }
      this.lookupSvc.getProgramaRecuperacion(id).subscribe({
        next: (r: ProgramaRecupLookup) => this.hintProgRecupEstProg.set(`✓ ${r.nombre}`),
        error: () => this.hintProgRecupEstProg.set('✗ No encontrado'),
      });
    });

    // estudianteId hint (progRecupEst)
    this.formProgramaRecupEst.get('estudianteId')!.valueChanges.pipe(
      debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(v => {
      const id = Number(v);
      if (!v || isNaN(id) || id <= 0) { this.hintProgRecupEstEst.set(''); return; }
      this.lookupSvc.getEstudiante(id).subscribe({
        next: (r: EstudianteLookup) => this.hintProgRecupEstEst.set(`✓ ${r.nombre} ${r.apellido}`),
        error: () => this.hintProgRecupEstEst.set('✗ No encontrado'),
      });
    });

    // estudianteId hint (participacion)
    this.formParticipacion.get('estudianteId')!.valueChanges.pipe(
      debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(v => {
      const id = Number(v);
      if (!v || isNaN(id) || id <= 0) { this.hintParticipacionEst.set(''); return; }
      this.lookupSvc.getEstudiante(id).subscribe({
        next: (r: EstudianteLookup) => this.hintParticipacionEst.set(`✓ ${r.nombre} ${r.apellido}`),
        error: () => this.hintParticipacionEst.set('✗ No encontrado'),
      });
    });
  }

  // ===== NAVIGATION =====
  irSeccionActividad(s: SeccionActividad): void {
    this.seccionActividad.set(s);
    this.errorAct.set(null);
    if (s === 'talleres')         this.loadTalleres();
    if (s === 'talleresEst')      this.loadTalleresEst();
    if (s === 'programasRecup')   this.loadProgramasRecup();
    if (s === 'programasRecupEst') this.loadProgramasRecupEst();
    if (s === 'eventosInst')      this.loadEventosInst();
    if (s === 'participaciones')  this.loadParticipaciones();
  }

  volverMenuActividad(): void {
    this.seccionActividad.set('menu');
    this.detalleTaller.set(null);
    this.detalleTallerEst.set(null);
    this.detalleProgRecup.set(null);
    this.detalleProgRecupEst.set(null);
    this.detalleEventoInst.set(null);
    this.detalleParticipacion.set(null);
  }

  // ===== MODAL =====
  closeModal(): void { this.modalType.set(null); this.modalSaving.set(false); }

  // ===== TALLERES CRUD =====
  private loadTalleres(): void {
    this.loadingAct.set(true);
    this._talleres.set([]);
    this.tallerSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => { this.errorAct.set('Error al cargar talleres'); return of([]); }))
      .subscribe(d => { this._talleres.set(this.dedup(d)); this.loadingAct.set(false); });
  }

  openCreateTaller(): void {
    this.formTaller.reset({ institucionId: 1, categoria: 'deportivo', requiereAutorizacion: false });
    this.modalMode.set('create'); this.editingId.set(null); this.modalType.set('taller');
  }

  openEditTaller(t: TallerResponse): void {
    this.formTaller.patchValue(t);
    this.modalMode.set('edit'); this.editingId.set(t.id); this.modalType.set('taller');
  }

  saveTaller(): void {
    if (this.formTaller.invalid) { this.formTaller.markAllAsTouched(); return; }
    this.modalSaving.set(true);
    const isEdit = this.modalMode() === 'edit', id = this.editingId();
    const req$ = isEdit && id ? this.tallerSvc.update(id, this.formTaller.value) : this.tallerSvc.create(this.formTaller.value);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        isEdit && id ? this._talleres.update(l => l.map(x => x.id === id ? r : x)) : this._talleres.update(l => [...l, r]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: `Taller ${isEdit ? 'actualizado' : 'creado'}`, timer: 1500, showConfirmButton: false });
      },
      error: e => { this.modalSaving.set(false); Swal.fire('Error', e.error?.message ?? 'Error al guardar', 'error'); }
    });
  }

  toggleTaller(t: TallerResponse): void {
    const accion = t.isActive ? 'desactivar' : 'activar';
    Swal.fire({
      title: `¿${t.isActive ? 'Desactivar' : 'Activar'} taller?`,
      text: `El taller "${t.nombre}" quedará ${t.isActive ? 'inactivo' : 'activo'}.`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`, cancelButtonText: 'Cancelar',
      confirmButtonColor: t.isActive ? '#f59e0b' : '#059669',
    }).then(res => {
      if (!res.isConfirmed) return;
      this.tallerSvc.toggleEstado(t.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (r: TallerResponse) => {
          this._talleres.update(l => l.map(x => x.id === t.id ? r : x));
          Swal.fire({ icon: 'success', title: `Taller ${r.isActive ? 'activado' : 'desactivado'}`, timer: 1200, showConfirmButton: false });
        },
        error: (e: any) => Swal.fire('Error', e.error?.message ?? 'Error al cambiar estado', 'error')
      });
    });
  }

  verDetalleTaller(t: TallerResponse): void {
    // Mostrar inmediatamente con los datos disponibles (IDs como fallback)
    this.detalleTaller.set({
      registro:          t,
      nombreInstitucion: `Institución #${t.institucionId}`,
      nombreProfesor:    t.profesorResponsableId ? `Profesor #${t.profesorResponsableId}` : '—',
      nombreAula:        t.aulaId ? `Aula #${t.aulaId}` : '—',
    });
    // Intentar resolver nombres en segundo plano (sin bloquear)
    if (t.institucionId) {
      this.featureLookup.getInstitucionById(t.institucionId).subscribe({
        next: r => this.detalleTaller.update(d => d ? { ...d, nombreInstitucion: r.nombre } : d),
        error: () => {}
      });
    }
    if (t.profesorResponsableId) {
      this.featureLookup.getPersona(t.profesorResponsableId).subscribe({
        next: r => this.detalleTaller.update(d => d ? { ...d, nombreProfesor: `${r.nombre} ${r.apellido}`.trim() } : d),
        error: () => {}
      });
    }
    if (t.aulaId) {
      this.featureLookup.getAula(t.aulaId).subscribe({
        next: r => this.detalleTaller.update(d => d ? { ...d, nombreAula: r.nombre } : d),
        error: () => {}
      });
    }
  }

  // ===== TALLER ESTUDIANTE CRUD =====
  private loadTalleresEst(): void {
    this.loadingAct.set(true);
    this._talleresEst.set([]);
    this.tallerEstSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => { this.errorAct.set('Error al cargar inscripciones'); return of([]); }))
      .subscribe(d => { this._talleresEst.set(this.dedup(d)); this.loadingAct.set(false); });
  }

  openCreateTallerEst(): void {
    this.formTallerEst.reset({ estado: 'activo' });
    this.hintTallerEstTaller.set(''); this.hintTallerEstEst.set('');
    this.modalMode.set('create'); this.editingId.set(null); this.modalType.set('tallerEst');
  }

  openEditTallerEst(t: TallerEstudianteResponse): void {
    this.formTallerEst.patchValue(t);
    this.modalMode.set('edit'); this.editingId.set(t.id); this.modalType.set('tallerEst');
  }

  saveTallerEst(): void {
    if (this.formTallerEst.invalid) { this.formTallerEst.markAllAsTouched(); return; }
    this.modalSaving.set(true);
    const isEdit = this.modalMode() === 'edit', id = this.editingId();
    const req$ = isEdit && id ? this.tallerEstSvc.update(id, this.formTallerEst.value) : this.tallerEstSvc.create(this.formTallerEst.value);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        isEdit && id ? this._talleresEst.update(l => l.map(x => x.id === id ? r : x)) : this._talleresEst.update(l => [...l, r]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: `Inscripción ${isEdit ? 'actualizada' : 'creada'}`, timer: 1500, showConfirmButton: false });
      },
      error: e => { this.modalSaving.set(false); Swal.fire('Error', e.error?.message ?? 'Error al guardar', 'error'); }
    });
  }

  softDeleteTallerEst(t: TallerEstudianteResponse): void {
    Swal.fire({
      title: '¿Eliminar inscripción?',
      text: 'El registro quedará inactivo pero podrá restaurarse.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#f59e0b', cancelButtonText: 'Cancelar'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.tallerEstSvc.eliminar(t.id).subscribe({
        next: () => {
          this._talleresEst.update(l => l.map(x => x.id === t.id ? { ...x, isActive: false } : x));
          Swal.fire({ icon: 'success', title: 'Inscripción eliminada', timer: 1200, showConfirmButton: false });
        },
        error: e => Swal.fire('Error', e.error?.message ?? 'Error al eliminar', 'error')
      });
    });
  }

  restaurarTallerEst(t: TallerEstudianteResponse): void {
    this.tallerEstSvc.restaurar(t.id).subscribe({
      next: () => {
        this._talleresEst.update(l => l.map(x => x.id === t.id ? { ...x, isActive: true } : x));
        Swal.fire({ icon: 'success', title: 'Inscripción restaurada', timer: 1200, showConfirmButton: false });
      },
      error: e => Swal.fire('Error', e.error?.message ?? 'Error al restaurar', 'error')
    });
  }

  verDetalleTallerEst(t: TallerEstudianteResponse): void {
    this.detalleTallerEst.set({
      registro:         t,
      nombreTaller:     `Taller #${t.tallerId}`,
      nombreEstudiante: `Estudiante #${t.estudianteId}`,
    });
    this.lookupSvc.getTaller(t.tallerId).subscribe({
      next: r => this.detalleTallerEst.update(d => d ? { ...d, nombreTaller: r.nombre } : d),
      error: () => {}
    });
    this.lookupSvc.getEstudiante(t.estudianteId).subscribe({
      next: r => this.detalleTallerEst.update(d => d ? { ...d, nombreEstudiante: `${r.nombre} ${r.apellido}`.trim() } : d),
      error: () => {}
    });
  }

  // ===== PROGRAMAS RECUPERACIÓN CRUD =====
  private loadProgramasRecup(): void {
    this.loadingAct.set(true);
    this._programasRecup.set([]);
    this.programaRecupSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => { this.errorAct.set('Error al cargar programas'); return of([]); }))
      .subscribe(d => { this._programasRecup.set(this.dedup(d)); this.loadingAct.set(false); });
  }

  openCreateProgramaRecup(): void {
    this.formProgramaRecup.reset({ institucionId: 1, tipo: 'recuperacion' });
    this.modalMode.set('create'); this.editingId.set(null); this.modalType.set('programaRecup');
  }

  openEditProgramaRecup(p: ProgramaRecuperacionResponse): void {
    this.formProgramaRecup.patchValue(p);
    this.modalMode.set('edit'); this.editingId.set(p.id); this.modalType.set('programaRecup');
  }

  saveProgramaRecup(): void {
    if (this.formProgramaRecup.invalid) { this.formProgramaRecup.markAllAsTouched(); return; }
    this.modalSaving.set(true);
    const isEdit = this.modalMode() === 'edit', id = this.editingId();
    const req$ = isEdit && id ? this.programaRecupSvc.update(id, this.formProgramaRecup.value) : this.programaRecupSvc.create(this.formProgramaRecup.value);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        isEdit && id ? this._programasRecup.update(l => l.map(x => x.id === id ? r : x)) : this._programasRecup.update(l => [...l, r]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: `Programa ${isEdit ? 'actualizado' : 'creado'}`, timer: 1500, showConfirmButton: false });
      },
      error: e => { this.modalSaving.set(false); Swal.fire('Error', e.error?.message ?? 'Error al guardar', 'error'); }
    });
  }

  toggleProgramaRecup(p: ProgramaRecuperacionResponse): void {
    const accion = p.isActive ? 'desactivar' : 'activar';
    Swal.fire({
      title: `¿${p.isActive ? 'Desactivar' : 'Activar'} programa?`,
      text: `El programa "${p.nombre}" quedará ${p.isActive ? 'inactivo' : 'activo'}.`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`, cancelButtonText: 'Cancelar',
      confirmButtonColor: p.isActive ? '#f59e0b' : '#059669',
    }).then(res => {
      if (!res.isConfirmed) return;
      this.programaRecupSvc.toggleEstado(p.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (r: ProgramaRecuperacionResponse) => {
          this._programasRecup.update(l => l.map(x => x.id === p.id ? r : x));
          Swal.fire({ icon: 'success', title: `Programa ${r.isActive ? 'activado' : 'desactivado'}`, timer: 1200, showConfirmButton: false });
        },
        error: (e: any) => Swal.fire('Error', e.error?.message ?? 'Error al cambiar estado', 'error')
      });
    });
  }

  verDetalleProgRecup(p: ProgramaRecuperacionResponse): void {
    this.detalleProgRecup.set({
      registro:          p,
      nombreInstitucion: `Institución #${p.institucionId}`,
      nombreMateria:     p.materiaId  ? `Materia #${p.materiaId}`   : '—',
      nombreAula:        p.aulaId     ? `Aula #${p.aulaId}`         : '—',
      nombreProfesor:    p.profesorId ? `Profesor #${p.profesorId}` : '—',
    });
    this.featureLookup.getInstitucionById(p.institucionId).subscribe({
      next: r => this.detalleProgRecup.update(d => d ? { ...d, nombreInstitucion: r.nombre } : d),
      error: () => {}
    });
    if (p.materiaId) this.featureLookup.getMateria(p.materiaId).subscribe({
      next: r => this.detalleProgRecup.update(d => d ? { ...d, nombreMateria: r.nombre } : d),
      error: () => {}
    });
    if (p.aulaId) this.featureLookup.getAula(p.aulaId).subscribe({
      next: r => this.detalleProgRecup.update(d => d ? { ...d, nombreAula: r.nombre } : d),
      error: () => {}
    });
    if (p.profesorId) this.featureLookup.getProfesor(p.profesorId).subscribe({
      next: r => this.detalleProgRecup.update(d => d ? { ...d, nombreProfesor: `${r.nombre} ${r.apellido}`.trim() } : d),
      error: () => {}
    });
  }

  // ===== PROGRAMA RECUPERACIÓN ESTUDIANTE CRUD =====
  private loadProgramasRecupEst(): void {
    this.loadingAct.set(true);
    this._programasRecupEst.set([]);
    this.programaRecupEstSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => { this.errorAct.set('Error al cargar inscripciones'); return of([]); }))
      .subscribe(d => { this._programasRecupEst.set(this.dedup(d)); this.loadingAct.set(false); });
  }

  openCreateProgramaRecupEst(): void {
    this.formProgramaRecupEst.reset({ estado: 'activo' });
    this.hintProgRecupEstProg.set(''); this.hintProgRecupEstEst.set('');
    this.modalMode.set('create'); this.editingId.set(null); this.modalType.set('programaRecupEst');
  }

  openEditProgramaRecupEst(p: ProgramaRecuperacionEstudianteResponse): void {
    this.formProgramaRecupEst.patchValue(p);
    this.modalMode.set('edit'); this.editingId.set(p.id); this.modalType.set('programaRecupEst');
  }

  saveProgramaRecupEst(): void {
    if (this.formProgramaRecupEst.invalid) { this.formProgramaRecupEst.markAllAsTouched(); return; }
    this.modalSaving.set(true);
    const isEdit = this.modalMode() === 'edit', id = this.editingId();
    const req$ = isEdit && id ? this.programaRecupEstSvc.update(id, this.formProgramaRecupEst.value) : this.programaRecupEstSvc.create(this.formProgramaRecupEst.value);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        isEdit && id ? this._programasRecupEst.update(l => l.map(x => x.id === id ? r : x)) : this._programasRecupEst.update(l => [...l, r]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: `Inscripción ${isEdit ? 'actualizada' : 'creada'}`, timer: 1500, showConfirmButton: false });
      },
      error: e => { this.modalSaving.set(false); Swal.fire('Error', e.error?.message ?? 'Error al guardar', 'error'); }
    });
  }

  softDeleteProgramaRecupEst(p: ProgramaRecuperacionEstudianteResponse): void {
    Swal.fire({
      title: '¿Eliminar inscripción?',
      text: 'El registro quedará inactivo pero podrá restaurarse.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#f59e0b', cancelButtonText: 'Cancelar'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.programaRecupEstSvc.eliminar(p.id).subscribe({
        next: () => {
          this._programasRecupEst.update(l => l.map(x => x.id === p.id ? { ...x, isActive: false } : x));
          Swal.fire({ icon: 'success', title: 'Inscripción eliminada', timer: 1200, showConfirmButton: false });
        },
        error: e => Swal.fire('Error', e.error?.message ?? 'Error al eliminar', 'error')
      });
    });
  }

  restaurarProgramaRecupEst(p: ProgramaRecuperacionEstudianteResponse): void {
    this.programaRecupEstSvc.restaurar(p.id).subscribe({
      next: () => {
        this._programasRecupEst.update(l => l.map(x => x.id === p.id ? { ...x, isActive: true } : x));
        Swal.fire({ icon: 'success', title: 'Inscripción restaurada', timer: 1200, showConfirmButton: false });
      },
      error: e => Swal.fire('Error', e.error?.message ?? 'Error al restaurar', 'error')
    });
  }

  verDetalleProgRecupEst(p: ProgramaRecuperacionEstudianteResponse): void {
    this.detalleProgRecupEst.set({
      registro:         p,
      nombrePrograma:   `Programa #${p.programaId}`,
      nombreEstudiante: `Estudiante #${p.estudianteId}`,
    });
    this.lookupSvc.getProgramaRecuperacion(p.programaId).subscribe({
      next: r => this.detalleProgRecupEst.update(d => d ? { ...d, nombrePrograma: r.nombre } : d),
      error: () => {}
    });
    this.lookupSvc.getEstudiante(p.estudianteId).subscribe({
      next: r => this.detalleProgRecupEst.update(d => d ? { ...d, nombreEstudiante: `${r.nombre} ${r.apellido}`.trim() } : d),
      error: () => {}
    });
  }

  // ===== EVENTOS INSTITUCIONALES CRUD =====
  private loadEventosInst(): void {
    this.loadingAct.set(true);
    this._eventosInst.set([]);
    this.eventoInstSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => { this.errorAct.set('Error al cargar eventos'); return of([]); }))
      .subscribe(d => { this._eventosInst.set(this.dedup(d)); this.loadingAct.set(false); });
  }

  openCreateEventoInst(): void {
    this.formEventoInst.reset({ institucionId: 1, tipoEvento: 'cultural', requiereCuota: false });
    this.modalMode.set('create'); this.editingId.set(null); this.modalType.set('eventoInst');
  }

  openEditEventoInst(e: EventoInstitucionalResponse): void {
    this.formEventoInst.patchValue(e);
    this.modalMode.set('edit'); this.editingId.set(e.id); this.modalType.set('eventoInst');
  }

  saveEventoInst(): void {
    if (this.formEventoInst.invalid) { this.formEventoInst.markAllAsTouched(); return; }
    this.modalSaving.set(true);
    const isEdit = this.modalMode() === 'edit', id = this.editingId();
    const req$ = isEdit && id ? this.eventoInstSvc.update(id, this.formEventoInst.value) : this.eventoInstSvc.create(this.formEventoInst.value);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        isEdit && id ? this._eventosInst.update(l => l.map(x => x.id === id ? r : x)) : this._eventosInst.update(l => [...l, r]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: `Evento ${isEdit ? 'actualizado' : 'creado'}`, timer: 1500, showConfirmButton: false });
      },
      error: e => { this.modalSaving.set(false); Swal.fire('Error', e.error?.message ?? 'Error al guardar', 'error'); }
    });
  }

  toggleEventoInst(e: EventoInstitucionalResponse): void {
    const accion = e.isActive ? 'desactivar' : 'activar';
    Swal.fire({
      title: `¿${e.isActive ? 'Desactivar' : 'Activar'} evento?`,
      text: `El evento "${e.nombre}" quedará ${e.isActive ? 'inactivo' : 'activo'}.`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`, cancelButtonText: 'Cancelar',
      confirmButtonColor: e.isActive ? '#f59e0b' : '#059669',
    }).then(res => {
      if (!res.isConfirmed) return;
      this.eventoInstSvc.toggleEstado(e.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (r: EventoInstitucionalResponse) => {
          this._eventosInst.update(l => l.map(x => x.id === e.id ? r : x));
          Swal.fire({ icon: 'success', title: `Evento ${r.isActive ? 'activado' : 'desactivado'}`, timer: 1200, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err.error?.message ?? 'Error al cambiar estado', 'error')
      });
    });
  }

  verDetalleEventoInst(e: EventoInstitucionalResponse): void {
    this.detalleEventoInst.set({
      registro:          e,
      nombreInstitucion: `Institución #${e.institucionId}`,
      nombreResponsable: e.responsableId ? `Responsable #${e.responsableId}` : '—',
    });
    this.featureLookup.getInstitucionById(e.institucionId).subscribe({
      next: r => this.detalleEventoInst.update(d => d ? { ...d, nombreInstitucion: r.nombre } : d),
      error: () => {}
    });
    if (e.responsableId) this.featureLookup.getPersona(e.responsableId).subscribe({
      next: r => this.detalleEventoInst.update(d => d ? { ...d, nombreResponsable: `${r.nombre} ${r.apellido}`.trim() } : d),
      error: () => {}
    });
  }

  // ===== PARTICIPACIONES ESTUDIANTILES CRUD =====
  private loadParticipaciones(): void {
    this.loadingAct.set(true);
    this._participaciones.set([]);
    this.participacionSvc.getAll().pipe(takeUntil(this.destroy$), catchError(() => { this.errorAct.set('Error al cargar participaciones'); return of([]); }))
      .subscribe(d => { this._participaciones.set(this.dedup(d)); this.loadingAct.set(false); });
  }

  openCreateParticipacion(): void {
    this.formParticipacion.reset({ institucionId: 1 });
    this.hintParticipacionEst.set('');
    this.modalMode.set('create'); this.editingId.set(null); this.modalType.set('participacion');
  }

  openEditParticipacion(p: ParticipacionEstudiantilResponse): void {
    this.formParticipacion.patchValue(p);
    this.modalMode.set('edit'); this.editingId.set(p.id); this.modalType.set('participacion');
  }

  saveParticipacion(): void {
    if (this.formParticipacion.invalid) { this.formParticipacion.markAllAsTouched(); return; }
    this.modalSaving.set(true);
    const isEdit = this.modalMode() === 'edit', id = this.editingId();
    const req$ = isEdit && id ? this.participacionSvc.update(id, this.formParticipacion.value) : this.participacionSvc.create(this.formParticipacion.value);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        isEdit && id ? this._participaciones.update(l => l.map(x => x.id === id ? r : x)) : this._participaciones.update(l => [...l, r]);
        this.closeModal();
        Swal.fire({ icon: 'success', title: `Participación ${isEdit ? 'actualizada' : 'creada'}`, timer: 1500, showConfirmButton: false });
      },
      error: e => { this.modalSaving.set(false); Swal.fire('Error', e.error?.message ?? 'Error al guardar', 'error'); }
    });
  }

  softDeleteParticipacion(p: ParticipacionEstudiantilResponse): void {
    Swal.fire({ title: '¿Eliminar participación?', text: 'El registro quedará inactivo pero podrá restaurarse.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', confirmButtonColor: '#f59e0b', cancelButtonText: 'Cancelar' })
      .then((r: { isConfirmed: boolean }) => {
        if (!r.isConfirmed) return;
        this.participacionSvc.eliminar(p.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => this._participaciones.update(l => l.map(x => x.id === p.id ? { ...x, isActive: false } : x)),
          error: e => Swal.fire('Error', e.error?.message ?? 'Error al eliminar', 'error')
        });
      });
  }

  restaurarParticipacion(p: ParticipacionEstudiantilResponse): void {
    this.participacionSvc.restaurar(p.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this._participaciones.update(l => l.map(x => x.id === p.id ? { ...x, isActive: true } : x)),
      error: e => Swal.fire('Error', e.error?.message ?? 'Error al restaurar', 'error')
    });
  }

  verDetalleParticipacion(p: ParticipacionEstudiantilResponse): void {
    this.detalleParticipacion.set(null);
    this.cargandoDetalle.set(true);
    forkJoin({
      institucion: this.featureLookup.getInstitucionById(p.institucionId).pipe(catchError(() => of({ id: p.institucionId, nombre: `ID ${p.institucionId}` }))),
      estudiante:  this.lookupSvc.getEstudiante(p.estudianteId).pipe(catchError(() => of({ id: p.estudianteId, nombre: `ID ${p.estudianteId}`, apellido: '' }))),
      profesor:    p.profesorResponsableId ? this.featureLookup.getPersona(p.profesorResponsableId).pipe(catchError(() => of(null))) : of(null),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.detalleParticipacion.set({
          registro:          p,
          nombreInstitucion: (res.institucion as any).nombre,
          nombreEstudiante:  `${(res.estudiante as any).nombre} ${(res.estudiante as any).apellido}`.trim(),
          nombreProfesor:    res.profesor ? `${(res.profesor as any).nombre} ${(res.profesor as any).apellido}` : '—',
        });
        this.cargandoDetalle.set(false);
      },
      error: () => { this.cargandoDetalle.set(false); Swal.fire('Error', 'No se pudieron cargar los datos del detalle', 'error'); }
    });
  }

  // ===== GETTERS =====
  get categoriasTaller(): CategoriaTaller[]           { return ['deportivo', 'artistico', 'musical', 'academico', 'cultural']; }
  get diasSemana(): DiaSemana[]                       { return ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']; }
  get estadosTallerEst(): EstadoTallerEst[]           { return ['activo', 'retirado', 'finalizado', 'suspendido']; }
  get tiposProgRecup(): TipoProgRecuperacion[]        { return ['recuperacion', 'vacacional']; }
  get estadosProgRecupEst(): EstadoProgRecupEst[]     { return ['activo', 'retirado', 'aprobado', 'desaprobado']; }
  get tiposEventoInst(): TipoEventoInstitucional[]    { return ['aniversario', 'cultural', 'deportivo', 'academico', 'civico', 'reunion', 'olimpiadas', 'desfile', 'paseo']; }

  // ===== DEDUP — elimina duplicados por id =====
  private dedup<T extends { id: number }>(list: T[]): T[] {
    const seen = new Set<number>();
    return list.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }
}
