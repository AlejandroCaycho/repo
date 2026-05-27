import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LucideAngularModule, Users, Search, LayoutGrid, List, Edit, Power, Trash, Eye, X, Layers, CheckCircle, XCircle, AlertCircle, ChevronDown, Plus, Minus, TrendingUp, FileText } from 'lucide-angular';
import { EvaluationCriteriaService } from '../../core/services/evaluation-criteria.service';
import { GradingScaleService } from '../../core/services/grading-scale.service';
import { EvaluationCriteria, EvaluationCriteriaRequest, ScaleOption } from '../../core/interfaces/evaluation-criteria.interface';
import { SelectOption } from '../../core/services/common.service';
import Swal from 'sweetalert2';

type VistaMode = 'lista' | 'grilla';
type TipoFiltro = 'todos' | 'competence' | 'capacity' | 'performance';

// Validadores personalizados
const validName = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const isValid = /^[a-zA-ZáéíóúñÑüÜ0-9\s]+$/.test(value);
  return isValid ? null : { invalidName: true };
};

const validWeight = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const num = Number(value);
  if (isNaN(num)) return { invalidNumber: true };
  if (num < 0 || num > 100) return { outOfRange: true };
  return null;
};

@Component({
  selector: 'app-evaluation-criteria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './evaluation-criteria.html',
  styleUrl: './evaluation-criteria.scss'
})
export class EvaluationCriteriaComponent implements OnInit {
  private readonly evaluationCriteriaService = inject(EvaluationCriteriaService);
  private readonly gradingScaleService = inject(GradingScaleService);
  private readonly fb = inject(FormBuilder);

  readonly criteria = signal<EvaluationCriteria[]>([]);
  readonly scales = signal<SelectOption[]>([]);
  readonly parentOptions = signal<EvaluationCriteria[]>([]);

  readonly cargando = signal(false);
  readonly cargandoSelects = signal(false);
  readonly mostrarModal = signal(false);
  readonly modalCargando = signal(false);
  readonly mostrarDetalle = signal(false);
  readonly detalleCargando = signal(false);
  readonly detalle = signal<any>(null);
  readonly editando = signal<EvaluationCriteria | null>(null);
  readonly busqueda = signal('');
  readonly tipoFiltro = signal<TipoFiltro>('todos');
  readonly estadoFiltro = signal<'todas' | 'activas' | 'inactivas'>('todas');
  readonly vistaMode = signal<VistaMode>('lista');
  readonly dropdownAbierto = signal(false);
  readonly tipoDropdownAbierto = signal(false);

  readonly paginaActual = signal(1);
  readonly itemsPorPagina = signal(10);

  // Computed para el tipo de criterio seleccionado
  readonly isCompetence = computed(() => this.form.get('type')?.value === 'competence');
  readonly isCapacity = computed(() => this.form.get('type')?.value === 'capacity');
  readonly isPerformance = computed(() => this.form.get('type')?.value === 'performance');

  readonly form = this.fb.group({
    institutionId: [1, Validators.required],
    name: ['', [Validators.required, Validators.minLength(3), validName]],
    description: ['', [Validators.maxLength(300)]],
    type: ['competence', Validators.required],
    scaleId: [null as number | null, Validators.required],
    parentId: [null as number | null],
    weight: [100, [validWeight]],
    subjectId: [null as number | null],
    academicPeriodId: [null as number | null]
  });

  constructor() {
    effect(() => {
      const name = this.form.get('name');
      if (name?.touched && name.invalid) {
        name.markAsDirty();
      }
      
      // Cuando el tipo cambia, ajustar validaciones
      const type = this.form.get('type')?.value;
      if (type === 'competence') {
        this.form.get('parentId')?.clearValidators();
        this.form.get('weight')?.setValidators([validWeight]);
      } else if (type === 'capacity') {
        this.form.get('parentId')?.setValidators([Validators.required]);
        this.form.get('weight')?.setValidators([validWeight]);
      } else if (type === 'performance') {
        this.form.get('parentId')?.setValidators([Validators.required]);
        this.form.get('weight')?.clearValidators();
        this.form.get('weight')?.setValue(null);
      }
      this.form.get('parentId')?.updateValueAndValidity();
      this.form.get('weight')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.cargarSelects();
    this.cargar();
  }

  cargarSelects(): void {
    this.cargandoSelects.set(true);

    // Cargar escalas de calificación
    this.gradingScaleService.listarTodas().subscribe({
      next: (scales) => {
        this.scales.set(scales.filter(s => s.isActive).map(s => ({
          id: s.id!,
          name: `${s.name} (${s.minScore}-${s.maxScore})`,
          type: s.type
        })));
        this.cargandoSelects.set(false);
      },
      error: (err) => {
        console.error('Error al cargar escalas:', err);
        this.cargandoSelects.set(false);
        Swal.fire('Error', 'No se pudieron cargar las escalas de calificación', 'error');
      }
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.evaluationCriteriaService.listarTodas().subscribe({
      next: (data) => {
        // Enriquecer datos
        const enriched = data.map(c => ({
          ...c,
          scaleName: this.scales().find(s => s.id === c.scaleId)?.name,
          childrenCount: data.filter(child => child.parentId === c.id).length
        }));
        this.criteria.set(enriched);
        
        // Actualizar opciones de padres
        this.parentOptions.set(enriched.filter(c => c.type === 'competence' && c.isActive));
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar:', err);
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudieron cargar los criterios de evaluación', 'error');
      }
    });
  }

  // Getters para validaciones
  get nameInvalid() {
    const control = this.form.get('name');
    return control?.invalid && (control?.touched || control?.dirty);
  }

  get nameError() {
    const control = this.form.get('name');
    if (control?.hasError('required')) return 'El nombre es obligatorio';
    if (control?.hasError('minlength')) return 'Mínimo 3 caracteres';
    if (control?.hasError('invalidName')) return 'Solo letras, números y espacios';
    return '';
  }

  get scaleIdInvalid() {
    const control = this.form.get('scaleId');
    return control?.invalid && (control?.touched || control?.dirty);
  }

  get parentIdInvalid() {
    const control = this.form.get('parentId');
    if (this.isCapacity() || this.isPerformance()) {
      return control?.invalid && (control?.touched || control?.dirty);
    }
    return false;
  }

  get weightInvalid() {
    const control = this.form.get('weight');
    if (this.isCompetence() || this.isCapacity()) {
      return control?.invalid && (control?.touched || control?.dirty);
    }
    return false;
  }

  get weightError() {
    const control = this.form.get('weight');
    if (control?.hasError('invalidNumber')) return 'Debe ser un número válido';
    if (control?.hasError('outOfRange')) return 'El peso debe estar entre 0 y 100';
    return '';
  }

  readonly filtradas = computed(() => {
    let filtered = this.criteria();

    const q = this.busqueda().toLowerCase();
    if (q) {
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q) ||
        c.scaleName?.toLowerCase().includes(q)
      );
    }

    if (this.tipoFiltro() !== 'todos') {
      filtered = filtered.filter(c => c.type === this.tipoFiltro());
    }

    if (this.estadoFiltro() === 'activas') {
      filtered = filtered.filter(c => c.isActive === true);
    } else if (this.estadoFiltro() === 'inactivas') {
      filtered = filtered.filter(c => c.isActive === false);
    }

    return filtered;
  });

  readonly filtradasPaginadas = computed(() => {
    const list = this.filtradas();
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
    return list.slice(inicio, inicio + this.itemsPorPagina());
  });

  readonly totalPaginas = computed(() => {
    return Math.max(1, Math.ceil(this.filtradas().length / this.itemsPorPagina()));
  });

  readonly totalActivos = computed(() => {
    return this.criteria().filter(c => c.isActive === true).length;
  });

  readonly totalInactivos = computed(() => {
    return this.criteria().filter(c => c.isActive === false).length;
  });

  readonly totalCompetencias = computed(() => {
    return this.criteria().filter(c => c.type === 'competence').length;
  });

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) {
      this.paginaActual.set(nueva);
    }
  }

  toggleDropdown(): void {
    this.dropdownAbierto.update(v => !v);
  }

  toggleTipoDropdown(): void {
    this.tipoDropdownAbierto.update(v => !v);
  }

  seleccionarFiltro(estado: 'todas' | 'activas' | 'inactivas'): void {
    this.estadoFiltro.set(estado);
    this.paginaActual.set(1);
    this.dropdownAbierto.set(false);
  }

  seleccionarTipoFiltro(tipo: TipoFiltro): void {
    this.tipoFiltro.set(tipo);
    this.paginaActual.set(1);
    this.tipoDropdownAbierto.set(false);
  }

  readonly textoFiltro = computed(() => {
    const map: Record<string, string> = {
      'todas': 'Todos los criterios',
      'activas': 'Solo activos',
      'inactivas': 'Solo inactivos'
    };
    return map[this.estadoFiltro()] || 'Filtros';
  });

  readonly textoTipoFiltro = computed(() => {
    const map: Record<string, string> = {
      'todos': 'Todos los tipos',
      'competence': 'Competencias',
      'capacity': 'Capacidades',
      'performance': 'Desempeños'
    };
    return map[this.tipoFiltro()] || 'Tipo';
  });

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'competence': 'Competencia',
      'capacity': 'Capacidad',
      'performance': 'Desempeño'
    };
    return map[type] || type;
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      'competence': '#10b981',
      'capacity': '#3b82f6',
      'performance': '#f59e0b'
    };
    return map[type] || '#10b981';
  }

  getParentOptions(): EvaluationCriteria[] {
    return this.parentOptions();
  }

  setVista(v: VistaMode): void {
    this.vistaMode.set(v);
  }

  setBusqueda(e: Event): void {
    this.busqueda.set((e.target as HTMLInputElement).value);
    this.paginaActual.set(1);
  }

  abrirModal(criterio?: EvaluationCriteria): void {
    if (criterio) {
      this.modalCargando.set(true);
      this.evaluationCriteriaService.obtenerPorId(criterio.id!).subscribe({
        next: (full) => {
          this.editando.set(full);
          this.form.patchValue({
            institutionId: 1,
            name: full.name,
            description: full.description || '',
            type: full.type,
            scaleId: full.scaleId,
            parentId: full.parentId || null,
            weight: full.weight || 100,
            subjectId: full.subjectId || null,
            academicPeriodId: full.academicPeriodId || null
          });
          this.modalCargando.set(false);
          this.mostrarModal.set(true);
        },
        error: (err) => {
          console.error('Error al obtener detalle:', err);
          this.modalCargando.set(false);
          Swal.fire('Error', 'No se pudo cargar el criterio', 'error');
        }
      });
    } else {
      this.editando.set(null);
      this.form.reset({
        institutionId: 1,
        name: '',
        description: '',
        type: 'competence',
        scaleId: null,
        parentId: null,
        weight: 100,
        subjectId: null,
        academicPeriodId: null
      });
      this.mostrarModal.set(true);
    }
  }

  verDetalle(criterio: EvaluationCriteria): void {
    this.detalleCargando.set(true);
    this.evaluationCriteriaService.obtenerPorId(criterio.id!).subscribe({
      next: (full) => {
        this.detalle.set({
          ...full,
          scaleName: this.scales().find(s => s.id === full.scaleId)?.name,
          parentName: this.criteria().find(c => c.id === full.parentId)?.name,
          childrenCount: this.criteria().filter(c => c.parentId === full.id).length
        });
        this.detalleCargando.set(false);
        this.mostrarDetalle.set(true);
      },
      error: (err) => {
        console.error('Error al obtener detalle:', err);
        this.detalleCargando.set(false);
        Swal.fire('Error', 'No se pudo cargar el detalle', 'error');
      }
    });
  }

  cerrarDetalle(): void {
    this.mostrarDetalle.set(false);
    this.detalle.set(null);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsTouched();
        control?.markAsDirty();
      });

      if (this.form.get('name')?.hasError('required')) {
        Swal.fire('Campo requerido', 'El nombre es obligatorio', 'warning');
      } else if (this.form.get('scaleId')?.hasError('required')) {
        Swal.fire('Campo requerido', 'Debes seleccionar una escala de calificación', 'warning');
      } else if (this.form.get('parentId')?.hasError('required')) {
        Swal.fire('Campo requerido', 'Debes seleccionar una competencia padre', 'warning');
      } else {
        Swal.fire('Campos incompletos', 'Por favor completa todos los campos obligatorios', 'warning');
      }
      return;
    }

    const datos = {
      institutionId: 1,
      name: this.form.value.name,
      description: this.form.value.description || null,
      type: this.form.value.type,
      scaleId: Number(this.form.value.scaleId),
      parentId: this.form.value.parentId ? Number(this.form.value.parentId) : null,
      weight: this.form.value.weight ? Number(this.form.value.weight) : null,
      subjectId: this.form.value.subjectId ? Number(this.form.value.subjectId) : null,
      academicPeriodId: this.form.value.academicPeriodId ? Number(this.form.value.academicPeriodId) : null
    } as EvaluationCriteriaRequest;

    console.log('📤 Enviando:', JSON.stringify(datos, null, 2));

    const editando = this.editando();
    const obs$ = editando
      ? this.evaluationCriteriaService.actualizar(editando.id!, datos)
      : this.evaluationCriteriaService.crear(datos);

    obs$.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargar();
        Swal.fire({
          title: '¡Guardado!',
          text: `El criterio ha sido ${editando ? 'actualizado' : 'registrado'} exitosamente.`,
          icon: 'success',
          confirmButtonColor: '#165EF0',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        let errorMsg = 'No se pudo guardar el criterio';
        if (err.error?.message?.includes('duplicate') || err.error?.message?.includes('ya existe')) {
          errorMsg = 'Ya existe un criterio con ese nombre';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  toggleEstado(criterio: EvaluationCriteria): void {
    const activo = criterio.isActive;

    Swal.fire({
      title: '¿Estás seguro?',
      text: activo ? '¿Deseas desactivar este criterio?' : '¿Deseas activar este criterio?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#165EF0',
      cancelButtonColor: '#475569',
      confirmButtonText: activo ? 'Sí, desactivar' : 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const obs$ = activo
          ? this.evaluationCriteriaService.softDelete(criterio.id!)
          : this.evaluationCriteriaService.activar(criterio.id!);

        obs$.subscribe({
          next: () => {
            this.cargar();
            Swal.fire({
              title: '¡Actualizado!',
              text: `El criterio fue ${activo ? 'desactivado' : 'activado'}.`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Error al cambiar estado:', err);
            Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
          }
        });
      }
    });
  }

  eliminar(id: number): void {
    Swal.fire({
      title: '¿Estás completamente seguro?',
      text: "¡No podrás revertir esta acción! El criterio será eliminado permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.evaluationCriteriaService.eliminar(id).subscribe({
          next: () => {
            this.cargar();
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El criterio ha sido eliminado.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Error al eliminar:', err);
            Swal.fire('Error', 'No se pudo eliminar el criterio', 'error');
          }
        });
      }
    });
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const date = new Date(fecha);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
  }

  getScaleDisplay(scale: SelectOption): string {
    return scale.name;
  }

  getParentDisplay(parent: EvaluationCriteria): string {
    return parent.name;
  }
}
