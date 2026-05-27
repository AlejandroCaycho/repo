import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Clock,
  Filter,
  GraduationCap,
  History,
  LucideAngularModule,
  Plus,
  Search,
  Trash,
  UserCheck,
  X
} from 'lucide-angular';
import Swal from 'sweetalert2';
import { StudentGradeHistoryRequest, StudentGradeHistoryResponse, StudentGradeMovementType } from '../../core/interfaces/student-grade-history.interface';
import { Student } from '../../core/interfaces/student.interface';
import { CommonService, SelectOption } from '../../core/services/common.service';
import { StudentGradeHistoryService } from '../../core/services/student-grade-history.service';
import { StudentService } from '../../core/services/student.service';

type MovementFilter = StudentGradeMovementType | 'todos';

@Component({
  selector: 'app-student-grade-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './student-grade-history.html',
  styleUrl: './student-grade-history.scss'
})
export class StudentGradeHistoryComponent implements OnInit {
  private readonly historyService = inject(StudentGradeHistoryService);
  private readonly studentService = inject(StudentService);
  private readonly commonService = inject(CommonService);
  private readonly fb = inject(FormBuilder);

  readonly History = History;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly GraduationCap = GraduationCap;
  readonly ArrowRight = ArrowRight;
  readonly CalendarDays = CalendarDays;
  readonly UserCheck = UserCheck;
  readonly Trash = Trash;
  readonly X = X;
  readonly Clock = Clock;
  readonly CheckCircle = CheckCircle;

  readonly histories = signal<StudentGradeHistoryResponse[]>([]);
  readonly students = signal<Student[]>([]);
  readonly grades = signal<SelectOption[]>([]);
  readonly academicYears = signal<SelectOption[]>([]);
  readonly loading = signal(false);
  readonly loadingSelects = signal(false);
  readonly modalOpen = signal(false);
  readonly saving = signal(false);
  readonly search = signal('');
  readonly movementFilter = signal<MovementFilter>('todos');

  readonly form = this.fb.group({
    institutionId: [1, Validators.required],
    studentId: [null as number | null, Validators.required],
    previousGradeId: [null as number | null],
    newGradeId: [null as number | null, Validators.required],
    academicYearId: [null as number | null, Validators.required],
    movementType: ['promotion' as StudentGradeMovementType, Validators.required],
    reason: [''],
    authorizedBy: [null as number | null],
    changeDate: [this.today(), Validators.required]
  });

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const movement = this.movementFilter();

    return this.histories().filter(item => {
      const matchesMovement = movement === 'todos' || item.movementType === movement;
      const text = [
        item.studentName,
        item.previousGradeName,
        item.newGradeName,
        item.academicYearName,
        item.reason,
        this.movementLabel(item.movementType)
      ].join(' ').toLowerCase();

      return matchesMovement && (!q || text.includes(q));
    });
  });

  readonly totalPromotion = computed(() => this.histories().filter(h => h.movementType === 'promotion').length);
  readonly totalTransfers = computed(() => this.histories().filter(h => h.movementType === 'transfer').length);
  readonly totalWithdrawals = computed(() => this.histories().filter(h => h.movementType === 'withdrawal').length);

  ngOnInit(): void {
    this.loadBaseData();
  }

  loadBaseData(): void {
    this.loadingSelects.set(true);

    forkJoin({
      students: this.studentService.listarTodas().pipe(
        catchError(err => {
          console.error('Error al cargar estudiantes:', err);
          return of([] as Student[]);
        })
      ),
      grades: this.commonService.listarGrados().pipe(
        catchError(err => {
          console.error('Error al cargar grados:', err);
          return of([] as SelectOption[]);
        })
      ),
      academicYears: this.commonService.listarAnosAcademicos().pipe(
        catchError(err => {
          console.error('Error al cargar anos academicos:', err);
          return of([] as SelectOption[]);
        })
      )
    }).subscribe({
      next: result => {
        this.students.set(result.students);
        this.grades.set(result.grades);
        this.academicYears.set(result.academicYears);
        this.loadingSelects.set(false);
        this.loadHistories();
      },
      error: () => {
        this.loadingSelects.set(false);
        this.loadHistories();
      }
    });
  }

  loadHistories(): void {
    this.loading.set(true);
    this.historyService.listarTodas().subscribe({
      next: data => {
        this.histories.set(data.map(item => this.enrich(item)));
        this.loading.set(false);
      },
      error: err => {
        console.error('Error al cargar historial de grados:', err);
        this.loading.set(false);
        Swal.fire('Error', 'No se pudo cargar el historial de grados', 'error');
      }
    });
  }

  openCreateModal(): void {
    this.form.reset({
      institutionId: 1,
      studentId: null,
      previousGradeId: null,
      newGradeId: null,
      academicYearId: null,
      movementType: 'promotion',
      reason: '',
      authorizedBy: null,
      changeDate: this.today()
    });
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire('Campos incompletos', 'Selecciona estudiante, grado nuevo, ano academico, movimiento y fecha.', 'warning');
      return;
    }

    const raw = this.form.getRawValue();
    const request: StudentGradeHistoryRequest = {
      institutionId: Number(raw.institutionId),
      studentId: Number(raw.studentId),
      previousGradeId: raw.previousGradeId ? Number(raw.previousGradeId) : null,
      newGradeId: Number(raw.newGradeId),
      academicYearId: Number(raw.academicYearId),
      movementType: raw.movementType as StudentGradeMovementType,
      reason: raw.reason?.trim() || null,
      authorizedBy: raw.authorizedBy ? Number(raw.authorizedBy) : null,
      changeDate: raw.changeDate || this.today()
    };

    this.saving.set(true);
    this.historyService.crear(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadHistories();
        Swal.fire({
          title: 'Registrado',
          text: 'El movimiento de grado fue agregado al historial.',
          icon: 'success',
          confirmButtonColor: '#165EF0',
          timer: 1800,
          showConfirmButton: false
        });
      },
      error: err => {
        console.error('Error al registrar historial:', err);
        this.saving.set(false);
        Swal.fire('Error', err.error?.message || 'No se pudo registrar el movimiento', 'error');
      }
    });
  }

  delete(id: number): void {
    Swal.fire({
      title: 'Eliminar registro',
      text: 'Este movimiento saldra del historial.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.historyService.eliminar(id).subscribe({
        next: () => {
          this.loadHistories();
          Swal.fire('Eliminado', 'El registro fue eliminado.', 'success');
        },
        error: err => {
          console.error('Error al eliminar historial:', err);
          Swal.fire('Error', 'No se pudo eliminar el registro', 'error');
        }
      });
    });
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setMovementFilter(event: Event): void {
    this.movementFilter.set((event.target as HTMLSelectElement).value as MovementFilter);
  }

  movementLabel(type: string): string {
    const labels: Record<string, string> = {
      promotion: 'Promocion',
      repetition: 'Repitencia',
      transfer: 'Traslado',
      withdrawal: 'Retiro'
    };
    return labels[type] || type;
  }

  movementClass(type: string): string {
    return `movement--${type}`;
  }

  formatDate(value?: string | null): string {
    if (!value) return '-';
    return new Date(`${value}T00:00:00`).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private enrich(item: StudentGradeHistoryResponse): StudentGradeHistoryResponse {
    const student = this.students().find(s => s.id === item.studentId);
    const previousGrade = this.grades().find(g => g.id === item.previousGradeId);
    const newGrade = this.grades().find(g => g.id === item.newGradeId);
    const academicYear = this.academicYears().find(y => y.id === item.academicYearId);

    return {
      ...item,
      studentName: student?.personName || `Estudiante ${item.studentId}`,
      previousGradeName: item.previousGradeId ? previousGrade?.name || `Grado ${item.previousGradeId}` : 'Primer ingreso',
      newGradeName: newGrade?.name || `Grado ${item.newGradeId}`,
      academicYearName: academicYear?.name || `Ano ${item.academicYearId}`
    };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
