import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LucideAngularModule, Users, Search, LayoutGrid, List, Edit, Power, Trash, Eye, X, Settings, CheckCircle, XCircle, Award, AlertCircle, ChevronDown, TrendingUp, TrendingDown, Percent, Hash } from 'lucide-angular';
import { GradingScaleService } from '../../core/services/grading-scale.service';
import { GradingScale, GradingScaleRequest } from '../../core/interfaces/grading-scale.interface';
import Swal from 'sweetalert2';

type VistaMode = 'lista' | 'grilla';

// ==================== VALIDADORES PERSONALIZADOS ====================

// Validador: nombre válido (letras, números, espacios, acentos)
const validName = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const isValid = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s]+$/.test(value);
  return isValid ? null : { invalidName: true };
};

// Validador: tipo válido
const validType = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const validTypes = ['numeric', 'literal', 'percentage'];
  return validTypes.includes(value) ? null : { invalidType: true };
};

@Component({
  selector: 'app-grading-scales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './grading-scales.html',
  styleUrl: './grading-scales.scss'
})
export class GradingScalesComponent implements OnInit {
  private readonly gradingScaleService = inject(GradingScaleService);
  private readonly fb = inject(FormBuilder);

  readonly gradingScales = signal<GradingScale[]>([]);

  readonly cargando = signal(false);
  readonly mostrarModal = signal(false);
  readonly modalCargando = signal(false);
  readonly mostrarDetalle = signal(false);
  readonly detalleCargando = signal(false);
  readonly detalle = signal<any>(null);
  readonly editando = signal<GradingScale | null>(null);
  readonly busqueda = signal('');
  readonly tipoFiltro = signal<'todos' | 'numeric' | 'literal' | 'percentage'>('todos');
  readonly estadoFiltro = signal<'todas' | 'activas' | 'inactivas'>('todas');
  readonly vistaMode = signal<VistaMode>('lista');
  readonly dropdownAbierto = signal(false);
  readonly tipoDropdownAbierto = signal(false);

  readonly paginaActual = signal(1);
  readonly itemsPorPagina = signal(10);

  // ==================== FORMULARIO CON VALIDACIONES COMPLETAS ====================
  readonly form = this.fb.group({
    institutionId: [1, Validators.required],
    name: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100),
      validName
    ]],
    description: ['', [Validators.maxLength(200)]],
    type: ['numeric', [
      Validators.required,
      validType
    ]],
    minScore: [0, [
      Validators.required,
      Validators.min(0),
      Validators.max(100)
    ]],
    maxScore: [20, [
      Validators.required,
      Validators.min(1),
      Validators.max(100)
    ]],
    passingScore: [11, [
      Validators.required
    ]],
    rounding: [true]
  });

  // Validador de rango (mínimo < máximo, y aprobatorio dentro del rango)
  private readonly rangeValidator = (control: AbstractControl): ValidationErrors | null => {
    const minScore = control.get('minScore')?.value;
    const maxScore = control.get('maxScore')?.value;
    const passingScore = control.get('passingScore')?.value;
    
    if (minScore !== null && maxScore !== null && minScore >= maxScore) {
      return { invalidRange: true };
    }
    if (passingScore !== null && minScore !== null && maxScore !== null && 
        (passingScore < minScore || passingScore > maxScore)) {
      return { invalidPassingScore: true };
    }
    return null;
  };

  constructor() {
    // Agregar validador de rango al formulario
    this.form.setValidators(this.rangeValidator);
    
    effect(() => {
      const name = this.form.get('name');
      if (name?.touched && name.invalid) {
        name.markAsDirty();
      }
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.gradingScaleService.listarTodas().subscribe({
      next: (data) => {
        this.gradingScales.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar:', err);
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudieron cargar las escalas de calificación', 'error');
      }
    });
  }

  // ==================== GETTERS PARA VALIDACIONES ====================

  get nameInvalid() {
    const control = this.form.get('name');
    return control?.invalid && (control?.touched || control?.dirty);
  }

  get nameError() {
    const control = this.form.get('name');
    if (control?.hasError('required')) return 'El nombre es obligatorio';
    if (control?.hasError('minlength')) return 'Mínimo 3 caracteres';
    if (control?.hasError('maxlength')) return 'Máximo 100 caracteres';
    if (control?.hasError('invalidName')) return 'Solo letras, números y espacios';
    return '';
  }

  get typeInvalid() {
    const control = this.form.get('type');
    return control?.invalid && (control?.touched || control?.dirty);
  }

  get typeError() {
    const control = this.form.get('type');
    if (control?.hasError('required')) return 'El tipo de escala es obligatorio';
    if (control?.hasError('invalidType')) return 'Selecciona un tipo válido';
    return '';
  }

  get minScoreInvalid() {
    const control = this.form.get('minScore');
    return control?.invalid && (control?.touched || control?.dirty);
  }

  get maxScoreInvalid() {
    const control = this.form.get('maxScore');
    return control?.invalid && (control?.touched || control?.dirty);
  }

  get passingScoreInvalid() {
    const control = this.form.get('passingScore');
    return control?.invalid && (control?.touched || control?.dirty);
  }

  get rangeError() {
    const errors = this.form.errors;
    if (errors?.['invalidRange']) return 'El valor mínimo debe ser menor que el máximo';
    if (errors?.['invalidPassingScore']) return 'La nota aprobatoria debe estar entre el mínimo y máximo';
    return null;
  }

  // ==================== COMPUTED ====================

  readonly filtradas = computed(() => {
    let filtered = this.gradingScales();

    const q = this.busqueda().toLowerCase();
    if (q) {
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.type?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }

    if (this.tipoFiltro() !== 'todos') {
      filtered = filtered.filter(s => s.type === this.tipoFiltro());
    }

    if (this.estadoFiltro() === 'activas') {
      filtered = filtered.filter(s => s.isActive === true);
    } else if (this.estadoFiltro() === 'inactivas') {
      filtered = filtered.filter(s => s.isActive === false);
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
    return this.gradingScales().filter(s => s.isActive === true).length;
  });

  readonly totalInactivos = computed(() => {
    return this.gradingScales().filter(s => s.isActive === false).length;
  });

  readonly totalNumeric = computed(() => {
    return this.gradingScales().filter(s => s.type === 'numeric').length;
  });

  // ==================== CONTROLES DE UI ====================

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

  seleccionarTipoFiltro(tipo: 'todos' | 'numeric' | 'literal' | 'percentage'): void {
    this.tipoFiltro.set(tipo);
    this.paginaActual.set(1);
    this.tipoDropdownAbierto.set(false);
  }

  readonly textoFiltro = computed(() => {
    const map: Record<string, string> = {
      'todas': 'Todas las escalas',
      'activas': 'Solo activas',
      'inactivas': 'Solo inactivas'
    };
    return map[this.estadoFiltro()] || 'Filtros';
  });

  readonly textoTipoFiltro = computed(() => {
    const map: Record<string, string> = {
      'todos': 'Todos los tipos',
      'numeric': 'Numérica',
      'literal': 'Literal',
      'percentage': 'Porcentaje'
    };
    return map[this.tipoFiltro()] || 'Tipo';
  });

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'numeric': 'Numérica',
      'literal': 'Literal',
      'percentage': 'Porcentaje'
    };
    return map[type] || type;
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      'numeric': '#10b981',
      'literal': '#8b5cf6',
      'percentage': '#f59e0b'
    };
    return map[type] || '#10b981';
  }

  setVista(v: VistaMode): void {
    this.vistaMode.set(v);
  }

  setBusqueda(e: Event): void {
    this.busqueda.set((e.target as HTMLInputElement).value);
    this.paginaActual.set(1);
  }

  // ==================== MODAL ====================

  abrirModal(scale?: GradingScale): void {
    if (scale) {
      this.modalCargando.set(true);
      this.gradingScaleService.obtenerPorId(scale.id!).subscribe({
        next: (fullScale) => {
          this.editando.set(fullScale);
          this.form.patchValue({
            institutionId: fullScale.institutionId,
            name: fullScale.name,
            description: fullScale.description || '',
            type: fullScale.type,
            minScore: fullScale.minScore,
            maxScore: fullScale.maxScore,
            passingScore: fullScale.passingScore,
            rounding: fullScale.rounding ?? true
          });
          this.modalCargando.set(false);
          this.mostrarModal.set(true);
        },
        error: (err) => {
          console.error('Error al obtener detalle:', err);
          this.modalCargando.set(false);
          Swal.fire('Error', 'No se pudo cargar la escala', 'error');
        }
      });
    } else {
      this.editando.set(null);
      this.form.reset({
        institutionId: 1,
        name: '',
        description: '',
        type: 'numeric',
        minScore: 0,
        maxScore: 20,
        passingScore: 11,
        rounding: true
      });
      this.mostrarModal.set(true);
    }
  }

  verDetalle(scale: GradingScale): void {
    this.detalleCargando.set(true);
    this.gradingScaleService.obtenerPorId(scale.id!).subscribe({
      next: (fullScale) => {
        this.detalle.set(fullScale);
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

  // ==================== GUARDAR ====================

  guardar(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsTouched();
        control?.markAsDirty();
      });

      if (this.form.hasError('invalidRange')) {
        Swal.fire('Rango inválido', 'El valor mínimo debe ser menor que el máximo', 'warning');
      } else if (this.form.hasError('invalidPassingScore')) {
        Swal.fire('Nota aprobatoria inválida', 'La nota aprobatoria debe estar entre el mínimo y máximo', 'warning');
      } else if (this.form.get('name')?.hasError('required')) {
        Swal.fire('Campo requerido', 'El nombre es obligatorio', 'warning');
      } else if (this.form.get('type')?.hasError('required')) {
        Swal.fire('Campo requerido', 'El tipo de escala es obligatorio', 'warning');
      } else if (this.form.get('minScore')?.hasError('required')) {
        Swal.fire('Campo requerido', 'El puntaje mínimo es obligatorio', 'warning');
      } else if (this.form.get('maxScore')?.hasError('required')) {
        Swal.fire('Campo requerido', 'El puntaje máximo es obligatorio', 'warning');
      } else if (this.form.get('passingScore')?.hasError('required')) {
        Swal.fire('Campo requerido', 'La nota aprobatoria es obligatoria', 'warning');
      } else {
        Swal.fire('Campos incompletos', 'Por favor completa todos los campos obligatorios', 'warning');
      }
      return;
    }

    const datos = {
      institutionId: 1,
      name: this.form.value.name!,
      description: this.form.value.description || null,
      type: this.form.value.type!,
      minScore: Number(this.form.value.minScore),
      maxScore: Number(this.form.value.maxScore),
      passingScore: Number(this.form.value.passingScore),
      rounding: this.form.value.rounding ?? true
    } as GradingScaleRequest;

    console.log('📤 Enviando:', JSON.stringify(datos, null, 2));

    const editando = this.editando();
    const obs$ = editando
      ? this.gradingScaleService.actualizar(editando.id!, datos)
      : this.gradingScaleService.crear(datos);

    obs$.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargar();
        Swal.fire({
          title: '¡Guardado!',
          text: `La escala ha sido ${editando ? 'actualizada' : 'registrada'} exitosamente.`,
          icon: 'success',
          confirmButtonColor: '#165EF0',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        let errorMsg = 'No se pudo guardar la escala';
        if (err.error?.message?.includes('duplicate') || err.error?.message?.includes('ya existe')) {
          errorMsg = 'Ya existe una escala con ese nombre';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  // ==================== ACCIONES ====================

  toggleEstado(scale: GradingScale): void {
    const activo = scale.isActive;

    Swal.fire({
      title: '¿Estás seguro?',
      text: activo ? '¿Deseas desactivar esta escala?' : '¿Deseas activar esta escala?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#165EF0',
      cancelButtonColor: '#475569',
      confirmButtonText: activo ? 'Sí, desactivar' : 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const obs$ = activo
          ? this.gradingScaleService.softDelete(scale.id!)
          : this.gradingScaleService.activar(scale.id!);

        obs$.subscribe({
          next: () => {
            this.cargar();
            Swal.fire({
              title: '¡Actualizado!',
              text: `La escala fue ${activo ? 'desactivada' : 'activada'}.`,
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
      text: "¡No podrás revertir esta acción! La escala será eliminada permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.gradingScaleService.eliminar(id).subscribe({
          next: () => {
            this.cargar();
            Swal.fire({
              title: '¡Eliminada!',
              text: 'La escala ha sido eliminada.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Error al eliminar:', err);
            Swal.fire('Error', 'No se pudo eliminar la escala', 'error');
          }
        });
      }
    });
  }

  // ==================== HELPERS ====================

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const date = new Date(fecha);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
  }
}