import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import {
    LucideAngularModule, Users, Search, LayoutGrid, List, Edit, Power,
    Trash, Eye, X, User, GraduationCap, Calendar, BookOpen, CheckCircle,
    XCircle, Award, AlertCircle, ChevronDown
} from 'lucide-angular';
import { StudentService } from '../../core/services/student.service';
import { PersonService } from '../../core/services/person.service';
import { CommonService, SelectOption } from '../../core/services/common.service';
import { Student, StudentRequest, PersonOption } from '../../core/interfaces/student.interface';
import { catchError, forkJoin, of } from 'rxjs';
import Swal from 'sweetalert2';

type VistaMode = 'lista' | 'grilla';

// ── Validadores personalizados ──────────────────────────────────────────────
const onlyLettersAndSpaces = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    return /^[a-zA-ZáéíóúñÑüÜ\s]+$/.test(value) ? null : { onlyLetters: true };
};

const onlyLettersNumbersAndSpaces = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    return /^[a-zA-ZáéíóúñÑüÜ0-9\s]+$/.test(value) ? null : { invalidChars: true };
};

const validEnrollmentFormat = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    return /^\d{8}$/.test(value) ? null : { invalidEnrollment: true };
};

@Component({
    selector: 'app-students',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    templateUrl: './students.html',
    styleUrl: './students.scss'
})
export class StudentsComponent implements OnInit {
    private readonly studentService = inject(StudentService);
    private readonly personService = inject(PersonService);
    private readonly commonService = inject(CommonService);
    private readonly fb = inject(FormBuilder);

    // ── Datos ────────────────────────────────────────────────────────────────
    readonly students = signal<Student[]>([]);
    readonly persons = signal<PersonOption[]>([]);
    readonly grades = signal<SelectOption[]>([]);
    readonly academicYears = signal<SelectOption[]>([]);

    // ── Estados de UI ────────────────────────────────────────────────────────
    readonly cargando = signal(false);
    readonly cargandoSelects = signal(false);
    readonly mostrarModal = signal(false);
    readonly mostrarDetalle = signal(false);
    readonly detalleCargando = signal(false);
    readonly detalle = signal<any>(null);
    readonly editando = signal<Student | null>(null);
    readonly busqueda = signal('');
    readonly estadoFiltro = signal<'todas' | 'activas' | 'inactivas'>('todas');
    readonly statusFiltro = signal<'todos' | 'active' | 'graduated' | 'transferred' | 'withdrawn'>('todos');
    readonly vistaMode = signal<VistaMode>('lista');
    readonly dropdownAbierto = signal(false);
    readonly statusDropdownAbierto = signal(false);
    readonly paginaActual = signal(1);
    readonly itemsPorPagina = signal(10);

    // ── Formulario con validaciones mejoradas ─────────────────────────────────
    readonly form = this.fb.group({
        institutionId: [1, Validators.required],
        personId: [null as number | null, [Validators.required]],
        gradeId: [null as number | null, [Validators.required]],
        academicYearId: [null as number | null, [Validators.required]],
        enrollmentNumber: ['', [Validators.required, validEnrollmentFormat]],
        studentCode: ['', [Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
        modularCode: ['', [Validators.maxLength(15), Validators.pattern(/^\d*$/)]],
        admissionDate: ['', [Validators.required]], // ✅ AHORA ES OBLIGATORIO
        previousSchool: ['', [Validators.maxLength(100), onlyLettersNumbersAndSpaces]],
        academicStatus: ['active', Validators.required]
    });

    // ── Lifecycle ────────────────────────────────────────────────────────────
    ngOnInit(): void {
        this.cargarSelects();
    }

    cargarSelects(): void {
        this.cargandoSelects.set(true);

        forkJoin({
            persons: this.personService.listarTodas().pipe(catchError(() => of([]))),
            grades: this.commonService.listarGrados().pipe(catchError(() => of([]))),
            years: this.commonService.listarAnosAcademicos().pipe(catchError(() => of([])))
        }).subscribe({
            next: (result) => {
                this.persons.set(result.persons.map(p => ({
                    id: p.id!,
                    name: `${p.firstName} ${p.lastName}${p.secondLastName ? ' ' + p.secondLastName : ''}`.trim(),
                    documentNumber: p.documentNumber
                })));
                this.grades.set(result.grades);
                this.academicYears.set(result.years);
                this.cargandoSelects.set(false);
                this.cargar();

                if (!result.grades.length || !result.years.length) {
                    Swal.fire('Advertencia', 'No se pudieron cargar grados/anios desde academic. No se podran registrar estudiantes hasta corregir esa comunicacion.', 'warning');
                }
            },
            error: (err) => {
                console.error('Error al cargar selects:', err);
                this.cargandoSelects.set(false);
                Swal.fire('Error', 'No se pudieron cargar los datos necesarios para estudiantes', 'error');

                this.cargar();
            }
        });
    }

    cargar(): void {
        this.cargando.set(true);
        this.studentService.listarTodas().subscribe({
            next: (data) => {
                const enriched = data.map(s => ({
                    ...s,
                    personName: this.persons().find(p => p.id === s.personId)?.name ?? `Persona ${s.personId}`,
                    personDocument: this.persons().find(p => p.id === s.personId)?.documentNumber,
                    gradeName: this.grades().find(g => g.id === s.gradeId)?.name ?? `Grado ${s.gradeId}`,
                    academicYearName: this.academicYears().find(y => y.id === s.academicYearId)?.name ?? `Año ${s.academicYearId}`
                }));
                this.students.set(enriched);
                this.cargando.set(false);
            },
            error: (err) => {
                console.error('Error al cargar estudiantes:', err);
                this.cargando.set(false);
                Swal.fire('Error', 'No se pudieron cargar los estudiantes', 'error');
            }
        });
    }

    // ── Getters de validación ─────────────────────────────────────────────────
    get enrollmentNumberInvalid() {
        const c = this.form.get('enrollmentNumber');
        return c?.invalid && (c?.touched || c?.dirty);
    }
    get enrollmentNumberError() {
        const c = this.form.get('enrollmentNumber');
        if (c?.hasError('required')) return 'El número de matrícula es obligatorio';
        if (c?.hasError('invalidEnrollment')) return 'Debe ser un número de 8 dígitos (ej: 20250001)';
        return '';
    }
    get personIdInvalid() { const c = this.form.get('personId'); return c?.invalid && (c?.touched || c?.dirty); }
    get gradeIdInvalid() { const c = this.form.get('gradeId'); return c?.invalid && (c?.touched || c?.dirty); }
    get academicYearIdInvalid() { const c = this.form.get('academicYearId'); return c?.invalid && (c?.touched || c?.dirty); }
    
    get admissionDateInvalid() { 
        const c = this.form.get('admissionDate'); 
        return c?.invalid && (c?.touched || c?.dirty); 
    }
    
    get previousSchoolInvalid() { 
        const c = this.form.get('previousSchool'); 
        if (!c?.value) return false; 
        return c?.invalid && (c?.touched || c?.dirty); 
    }
    
    get previousSchoolError() {
        const c = this.form.get('previousSchool');
        if (c?.hasError('invalidChars')) return 'Solo se permiten letras, números y espacios';
        return '';
    }

    get studentCodeError() {
        const c = this.form.get('studentCode');
        if (c?.hasError('pattern') && c?.value) return 'Solo se permiten letras, números y guiones';
        return '';
    }

    get modularCodeError() {
        const c = this.form.get('modularCode');
        if (c?.hasError('pattern') && c?.value) return 'Solo se permiten números';
        return '';
    }

    // ── Computed ──────────────────────────────────────────────────────────────
    readonly filtradas = computed(() => {
        let list = this.students();
        const q = this.busqueda().toLowerCase();

        if (q) {
            list = list.filter(s =>
                s.enrollmentNumber?.toLowerCase().includes(q) ||
                s.studentCode?.toLowerCase().includes(q) ||
                s.personName?.toLowerCase().includes(q) ||
                s.personDocument?.toLowerCase().includes(q)
            );
        }
        if (this.estadoFiltro() === 'activas') list = list.filter(s => s.isActive === true);
        if (this.estadoFiltro() === 'inactivas') list = list.filter(s => s.isActive === false);
        if (this.statusFiltro() !== 'todos') list = list.filter(s => s.academicStatus === this.statusFiltro());

        return list;
    });

    readonly filtradasPaginadas = computed(() => {
        const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
        return this.filtradas().slice(inicio, inicio + this.itemsPorPagina());
    });

    readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.itemsPorPagina())));
    readonly totalActivos = computed(() => this.students().filter(s => s.isActive === true).length);
    readonly totalInactivos = computed(() => this.students().filter(s => s.isActive === false).length);
    readonly totalActiveStatus = computed(() => this.students().filter(s => s.academicStatus === 'active').length);

    // ── Controles de UI ───────────────────────────────────────────────────────
    cambiarPagina(delta: number): void {
        const nueva = this.paginaActual() + delta;
        if (nueva >= 1 && nueva <= this.totalPaginas()) this.paginaActual.set(nueva);
    }

    toggleDropdown() { this.dropdownAbierto.update(v => !v); }
    toggleStatusDropdown() { this.statusDropdownAbierto.update(v => !v); }

    seleccionarFiltro(estado: 'todas' | 'activas' | 'inactivas'): void {
        this.estadoFiltro.set(estado);
        this.paginaActual.set(1);
        this.dropdownAbierto.set(false);
    }

    seleccionarStatusFiltro(status: 'todos' | 'active' | 'graduated' | 'transferred' | 'withdrawn'): void {
        this.statusFiltro.set(status);
        this.paginaActual.set(1);
        this.statusDropdownAbierto.set(false);
    }

    readonly textoFiltro = computed(() => ({
        'todas': 'Todos los estudiantes',
        'activas': 'Solo activos',
        'inactivas': 'Solo inactivos'
    }[this.estadoFiltro()] ?? 'Filtros'));

    readonly textoStatusFiltro = computed(() => ({
        'todos': 'Todos',
        'active': 'Activos',
        'graduated': 'Graduados',
        'transferred': 'Transferidos',
        'withdrawn': 'Retirados'
    }[this.statusFiltro()] ?? 'Estado'));

    setVista(v: VistaMode): void { this.vistaMode.set(v); }

    setBusqueda(e: Event): void {
        this.busqueda.set((e.target as HTMLInputElement).value);
        this.paginaActual.set(1);
    }

    // ── Modal ─────────────────────────────────────────────────────────────────
    abrirModal(student?: Student): void {
        if (student) {
            this.studentService.obtenerPorId(student.id!).subscribe({
                next: (s) => {
                    this.editando.set(s);
                    this.form.patchValue({
                        institutionId: 1,
                        personId: +s.personId,
                        gradeId: +s.gradeId,
                        academicYearId: +s.academicYearId,
                        enrollmentNumber: s.enrollmentNumber,
                        studentCode: s.studentCode ?? '',
                        modularCode: s.modularCode ?? '',
                        admissionDate: s.admissionDate?.split('T')[0] ?? '',
                        previousSchool: s.previousSchool ?? '',
                        academicStatus: s.academicStatus ?? 'active'
                    });
                    this.mostrarModal.set(true);
                },
                error: () => Swal.fire('Error', 'No se pudo cargar el estudiante', 'error')
            });
        } else {
            this.editando.set(null);
            this.form.reset({
                institutionId: 1,
                personId: null,
                gradeId: null,
                academicYearId: null,
                enrollmentNumber: '',
                studentCode: '',
                modularCode: '',
                admissionDate: '',
                previousSchool: '',
                academicStatus: 'active'
            });
            this.mostrarModal.set(true);
        }
    }

    cerrarModal(): void { this.mostrarModal.set(false); }

    // ── GUARDAR ──────────────────────────────────────────────────────────────
    guardar(): void {
        if (!this.grades().length || !this.academicYears().length) {
            Swal.fire('Datos academicos no disponibles', 'Primero debe estar disponible la comunicacion con academic para seleccionar grados y anios reales.', 'warning');
            return;
        }

        if (this.form.invalid) {
            Object.values(this.form.controls).forEach(c => { c.markAsTouched(); c.markAsDirty(); });

            if (this.form.get('enrollmentNumber')?.hasError('invalidEnrollment')) {
                Swal.fire('Formato inválido', 'El número de matrícula debe tener 8 dígitos (ej: 20250001)', 'warning');
            } else if (!this.form.get('personId')?.value) {
                Swal.fire('Campo requerido', 'Selecciona una persona', 'warning');
            } else if (!this.form.get('gradeId')?.value) {
                Swal.fire('Campo requerido', 'Selecciona un grado', 'warning');
            } else if (!this.form.get('academicYearId')?.value) {
                Swal.fire('Campo requerido', 'Selecciona un año académico', 'warning');
            } else if (!this.form.get('admissionDate')?.value) {
                Swal.fire('Campo requerido', 'La fecha de admisión es obligatoria', 'warning');
            } else {
                Swal.fire('Campos incompletos', 'Completa todos los campos obligatorios', 'warning');
            }
            return;
        }

        const raw = this.form.value;

        const datos: StudentRequest = {
            institutionId: Number(raw.institutionId),
            personId: Number(raw.personId),
            gradeId: Number(raw.gradeId),
            academicYearId: Number(raw.academicYearId),
            enrollmentNumber: raw.enrollmentNumber!,
            studentCode: raw.studentCode || undefined,
            modularCode: raw.modularCode || undefined,
            admissionDate: raw.admissionDate || undefined,
            previousSchool: raw.previousSchool || undefined,
            academicStatus: raw.academicStatus || 'active'
        };

        const editando = this.editando();
        const obs$ = editando
            ? this.studentService.actualizar(editando.id!, datos)
            : this.studentService.crear(datos);

        obs$.subscribe({
            next: () => {
                this.cerrarModal();
                this.cargar();
                Swal.fire({
                    title: '¡Guardado!',
                    text: `Estudiante ${editando ? 'actualizado' : 'registrado'} exitosamente.`,
                    icon: 'success',
                    confirmButtonColor: '#165EF0',
                    timer: 2000,
                    showConfirmButton: false
                });
            },
            error: (err) => {
                console.error('Error al guardar:', err);
                const msg = err.error?.error ?? err.error?.message ?? 'No se pudo guardar el estudiante';
                Swal.fire('Error', msg, 'error');
            }
        });
    }

    // ── Detalle ───────────────────────────────────────────────────────────────
    verDetalle(student: Student): void {
        this.detalleCargando.set(true);
        this.studentService.obtenerPorId(student.id!).subscribe({
            next: (s) => {
                this.detalle.set({
                    ...s,
                    personName: this.persons().find(p => p.id === s.personId)?.name ?? `Persona ${s.personId}`,
                    personDocument: this.persons().find(p => p.id === s.personId)?.documentNumber,
                    gradeName: this.grades().find(g => g.id === s.gradeId)?.name ?? `Grado ${s.gradeId}`,
                    academicYearName: this.academicYears().find(y => y.id === s.academicYearId)?.name ?? `Año ${s.academicYearId}`
                });
                this.detalleCargando.set(false);
                this.mostrarDetalle.set(true);
            },
            error: () => {
                this.detalleCargando.set(false);
                Swal.fire('Error', 'No se pudo cargar el detalle', 'error');
            }
        });
    }

    cerrarDetalle(): void { this.mostrarDetalle.set(false); this.detalle.set(null); }

    // ── Toggle estado ─────────────────────────────────────────────────────────
    toggleEstado(student: Student): void {
        const activo = student.isActive;
        Swal.fire({
            title: '¿Estás seguro?',
            text: activo ? '¿Deseas desactivar este estudiante?' : '¿Deseas activar este estudiante?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#165EF0',
            cancelButtonColor: '#475569',
            confirmButtonText: activo ? 'Sí, desactivar' : 'Sí, activar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (!result.isConfirmed) return;
            const obs$ = activo
                ? this.studentService.softDelete(student.id!)
                : this.studentService.activar(student.id!);

            obs$.subscribe({
                next: () => {
                    this.cargar();
                    Swal.fire({ title: '¡Actualizado!', text: `Estudiante ${activo ? 'desactivado' : 'activado'}.`, icon: 'success', timer: 1500, showConfirmButton: false });
                },
                error: () => Swal.fire('Error', 'No se pudo cambiar el estado', 'error')
            });
        });
    }

    // ── Eliminar ──────────────────────────────────────────────────────────────
    eliminar(id: number): void {
        Swal.fire({
            title: '¿Estás completamente seguro?',
            text: '¡No podrás revertir esta acción!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (!result.isConfirmed) return;
            this.studentService.eliminar(id).subscribe({
                next: () => {
                    this.cargar();
                    Swal.fire({ title: '¡Eliminado!', icon: 'success', timer: 1500, showConfirmButton: false });
                },
                error: () => Swal.fire('Error', 'No se pudo eliminar el estudiante', 'error')
            });
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    getStatusLabel(status: string | undefined): string {
        return ({ active: 'Activo', graduated: 'Graduado', transferred: 'Transferido', withdrawn: 'Retirado' }[status ?? 'active']) ?? 'Activo';
    }

    getStatusColor(status: string | undefined): string {
        return ({ active: '#10b981', graduated: '#8b5cf6', transferred: '#f59e0b', withdrawn: '#ef4444' }[status ?? 'active']) ?? '#10b981';
    }

    formatearFecha(fecha: string | null | undefined): string {
        if (!fecha) return '–';
        const d = new Date(fecha);
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
    }

    getPersonDisplay(p: PersonOption): string {
        return `${p.name} (${p.documentNumber})`;
    }
}
