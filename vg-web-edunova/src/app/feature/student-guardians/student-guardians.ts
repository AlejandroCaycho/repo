import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import Swal from 'sweetalert2';
import { StudentGuardianService } from '../../core/services/student-guardian.service';
import { StudentService } from '../../core/services/student.service';
import { GuardianService } from '../../core/services/guardian.service';
import { PersonService } from '../../core/services/person.service';
import { StudentGuardian, StudentGuardianRequest } from '../../core/interfaces/student-guardian.interface';
import { Student } from '../../core/interfaces/student.interface';
import { Guardian } from '../../core/interfaces/guardian.interface';
import { Person } from '../../core/interfaces/person.interface';

type VistaMode = 'lista' | 'grilla';
type RelacionFiltro = 'todas' | 'primary' | 'pickup' | 'lives';

@Component({
  selector: 'app-student-guardians',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './student-guardians.html',
  styleUrl: './student-guardians.scss'
})
export class StudentGuardiansComponent implements OnInit {
  private readonly service = inject(StudentGuardianService);
  private readonly studentService = inject(StudentService);
  private readonly guardianService = inject(GuardianService);
  private readonly personService = inject(PersonService);
  private readonly fb = inject(FormBuilder);

  readonly relations = signal<StudentGuardian[]>([]);
  readonly students = signal<Student[]>([]);
  readonly guardians = signal<Guardian[]>([]);
  readonly persons = signal<Person[]>([]);

  readonly cargando = signal(false);
  readonly cargandoSelects = signal(false);
  readonly mostrarModal = signal(false);
  readonly mostrarDetalle = signal(false);
  readonly detalle = signal<StudentGuardian | null>(null);
  readonly editando = signal<StudentGuardian | null>(null);
  readonly busqueda = signal('');
  readonly vistaMode = signal<VistaMode>('lista');
  readonly filtro = signal<RelacionFiltro>('todas');
  readonly dropdownAbierto = signal(false);
  readonly paginaActual = signal(1);
  readonly itemsPorPagina = signal(10);

  readonly form = this.fb.group({
    studentId: [null as number | null, Validators.required],
    guardianId: [null as number | null, Validators.required],
    relationship: ['father', Validators.required],
    isPrimaryGuardian: [false],
    livesWithStudent: [true],
    authorizedPickup: [true]
  });

  ngOnInit(): void {
    this.cargarBase();
  }

  cargarBase(): void {
    this.cargandoSelects.set(true);
    forkJoin({
      students: this.studentService.listarTodas(),
      guardians: this.guardianService.listarTodas(),
      persons: this.personService.listarTodas()
    }).subscribe({
      next: ({ students, guardians, persons }) => {
        this.students.set(students);
        this.guardians.set(guardians);
        this.persons.set(persons);
        this.cargandoSelects.set(false);
        this.cargar();
      },
      error: () => {
        this.cargandoSelects.set(false);
        Swal.fire('Error', 'No se pudieron cargar estudiantes y apoderados', 'error');
        this.cargar();
      }
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listarTodas().subscribe({
      next: data => {
        this.relations.set(data.map(r => this.enrich(r)));
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error al cargar asignaciones:', err);
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudieron cargar las asignaciones', 'error');
      }
    });
  }

  readonly filtradas = computed(() => {
    let list = this.relations();
    const q = this.busqueda().toLowerCase();

    if (q) {
      list = list.filter(r =>
        r.studentName?.toLowerCase().includes(q) ||
        r.guardianName?.toLowerCase().includes(q) ||
        r.studentEnrollment?.toLowerCase().includes(q) ||
        r.guardianDocument?.toLowerCase().includes(q) ||
        this.getRelationshipLabel(r.relationship).toLowerCase().includes(q)
      );
    }

    if (this.filtro() === 'primary') list = list.filter(r => r.isPrimaryGuardian);
    if (this.filtro() === 'pickup') list = list.filter(r => r.authorizedPickup);
    if (this.filtro() === 'lives') list = list.filter(r => r.livesWithStudent);

    return list;
  });

  readonly filtradasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
    return this.filtradas().slice(inicio, inicio + this.itemsPorPagina());
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.itemsPorPagina())));
  readonly totalPrincipales = computed(() => this.relations().filter(r => r.isPrimaryGuardian).length);
  readonly totalRetiro = computed(() => this.relations().filter(r => r.authorizedPickup).length);
  readonly totalConviven = computed(() => this.relations().filter(r => r.livesWithStudent).length);

  abrirModal(relation?: StudentGuardian): void {
    if (relation) {
      this.editando.set(relation);
      this.form.reset({
        studentId: relation.studentId,
        guardianId: relation.guardianId,
        relationship: relation.relationship,
        isPrimaryGuardian: !!relation.isPrimaryGuardian,
        livesWithStudent: !!relation.livesWithStudent,
        authorizedPickup: !!relation.authorizedPickup
      });
      this.form.get('studentId')?.disable();
      this.form.get('guardianId')?.disable();
    } else {
      this.editando.set(null);
      this.form.get('studentId')?.enable();
      this.form.get('guardianId')?.enable();
      this.form.reset({
        studentId: null,
        guardianId: null,
        relationship: 'father',
        isPrimaryGuardian: false,
        livesWithStudent: true,
        authorizedPickup: true
      });
    }
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.form.get('studentId')?.enable();
    this.form.get('guardianId')?.enable();
  }

  guardar(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsTouched();
        c.markAsDirty();
      });
      Swal.fire('Campos incompletos', 'Selecciona estudiante, apoderado y parentesco', 'warning');
      return;
    }

    const raw = this.form.getRawValue();
    const datos: StudentGuardianRequest = {
      studentId: Number(raw.studentId),
      guardianId: Number(raw.guardianId),
      relationship: raw.relationship!,
      isPrimaryGuardian: !!raw.isPrimaryGuardian,
      livesWithStudent: !!raw.livesWithStudent,
      authorizedPickup: !!raw.authorizedPickup
    };

    const editando = this.editando();
    const obs$ = editando
      ? this.service.actualizar(editando.studentId, editando.guardianId, datos)
      : this.service.asignar(datos);

    obs$.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargar();
        Swal.fire({
          title: 'Guardado',
          text: `Asignacion ${editando ? 'actualizada' : 'registrada'} exitosamente.`,
          icon: 'success',
          timer: 1600,
          showConfirmButton: false
        });
      },
      error: err => {
        const msg = err.error?.error ?? err.error?.message ?? 'No se pudo guardar la asignacion';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  verDetalle(relation: StudentGuardian): void {
    this.detalle.set(this.enrich(relation));
    this.mostrarDetalle.set(true);
  }

  cerrarDetalle(): void {
    this.detalle.set(null);
    this.mostrarDetalle.set(false);
  }

  eliminar(relation: StudentGuardian): void {
    Swal.fire({
      title: 'Eliminar asignacion',
      text: 'Se quitara el vinculo entre estudiante y apoderado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.service.eliminar(relation.studentId, relation.guardianId).subscribe({
        next: () => {
          this.cargar();
          Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1400, showConfirmButton: false });
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar la asignacion', 'error')
      });
    });
  }

  setBusqueda(e: Event): void {
    this.busqueda.set((e.target as HTMLInputElement).value);
    this.paginaActual.set(1);
  }

  setVista(v: VistaMode): void {
    this.vistaMode.set(v);
  }

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) this.paginaActual.set(nueva);
  }

  toggleDropdown(): void {
    this.dropdownAbierto.update(v => !v);
  }

  seleccionarFiltro(filtro: RelacionFiltro): void {
    this.filtro.set(filtro);
    this.paginaActual.set(1);
    this.dropdownAbierto.set(false);
  }

  readonly textoFiltro = computed(() => ({
    todas: 'Todas las asignaciones',
    primary: 'Apoderado principal',
    pickup: 'Autorizados retiro',
    lives: 'Vive con estudiante'
  }[this.filtro()]));

  getRelationshipLabel(value?: string): string {
    return ({
      father: 'Padre',
      mother: 'Madre',
      guardian: 'Tutor',
      uncle: 'Tio/Tia',
      grandparent: 'Abuelo/a',
      sibling: 'Hermano/a',
      other: 'Otro'
    }[value ?? 'other'] ?? 'Otro');
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  getStudentDisplay(student: Student): string {
    return `${this.getStudentName(student)} (${student.enrollmentNumber})`;
  }

  getGuardianDisplay(guardian: Guardian): string {
    const person = this.persons().find(p => p.id === guardian.personId);
    const name = person ? `${person.firstName} ${person.lastName} ${person.secondLastName ?? ''}`.trim() : `Persona ${guardian.personId}`;
    return `${name} (${person?.documentNumber ?? 'sin DNI'})`;
  }

  private enrich(relation: StudentGuardian): StudentGuardian {
    const student = this.students().find(s => s.id === relation.studentId);
    const guardian = this.guardians().find(g => g.id === relation.guardianId);
    const guardianPerson = this.persons().find(p => p.id === guardian?.personId);

    return {
      ...relation,
      studentName: student ? this.getStudentName(student) : `Estudiante ${relation.studentId}`,
      studentEnrollment: student?.enrollmentNumber,
      guardianName: guardianPerson
        ? `${guardianPerson.firstName} ${guardianPerson.lastName} ${guardianPerson.secondLastName ?? ''}`.trim()
        : `Apoderado ${relation.guardianId}`,
      guardianDocument: guardianPerson?.documentNumber
    };
  }

  private getStudentName(student: Student): string {
    const person = this.persons().find(p => p.id === student.personId);
    return person ? `${person.firstName} ${person.lastName} ${person.secondLastName ?? ''}`.trim() : `Persona ${student.personId}`;
  }
}
