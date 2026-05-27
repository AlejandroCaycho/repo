import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LucideAngularModule, Users, Search, LayoutGrid, List, Edit, Power, Trash, Eye, X, User, GraduationCap, Calendar, BookOpen, Mail, Phone, MapPin, CheckCircle, XCircle, Award, UserPlus, AlertCircle, ChevronDown, Briefcase, Clock } from 'lucide-angular';
import { TeacherService } from '../../core/services/teacher.service';
import { PersonService } from '../../core/services/person.service';
import { Teacher, TeacherRequest, PersonOption } from '../../core/interfaces/teacher.interface';
import Swal from 'sweetalert2';

type VistaMode = 'lista' | 'grilla';

// ==================== VALIDADORES PERSONALIZADOS ====================

// Solo letras y espacios (para especialidad)
const soloLetrasYEspacios = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    return regex.test(value) ? null : { soloLetras: true };
};

// Para título profesional (permite letras, números, puntos y espacios)
const tituloProfesionalValido = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.]+$/;
    return regex.test(value) ? null : { tituloInvalido: true };
};

// Código de profesor (alfanumérico con guiones)
const codigoProfesorValido = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const regex = /^[a-zA-Z0-9-]+$/;
    return regex.test(value) ? null : { codigoInvalido: true };
};

// Fecha no futura
const fechaNoFutura = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(value);
    if (fecha > hoy) {
        return { fechaFutura: true };
    }
    return null;
};

@Component({
    selector: 'app-teachers',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    templateUrl: './teachers.html',
    styleUrl: './teachers.scss'
})
export class TeachersComponent implements OnInit {
    private readonly teacherService = inject(TeacherService);
    private readonly personService = inject(PersonService);
    private readonly fb = inject(FormBuilder);

    readonly teachers = signal<Teacher[]>([]);
    readonly persons = signal<PersonOption[]>([]);

    readonly cargando = signal(false);
    readonly cargandoSelects = signal(false);
    readonly mostrarModal = signal(false);
    readonly modalCargando = signal(false);
    readonly mostrarDetalle = signal(false);
    readonly detalleCargando = signal(false);
    readonly detalle = signal<any>(null);
    readonly editando = signal<Teacher | null>(null);
    readonly busqueda = signal('');
    readonly estadoFiltro = signal<'todas' | 'activas' | 'inactivas'>('todas');
    readonly tipoContratoFiltro = signal<'todos' | 'PERMANENTE' | 'TEMPORAL' | 'POR_HORAS'>('todos');
    readonly vistaMode = signal<VistaMode>('lista');
    readonly dropdownAbierto = signal(false);
    readonly contratoDropdownAbierto = signal(false);

    readonly paginaActual = signal(1);
    readonly itemsPorPagina = signal(10);

    // ==================== FORMULARIO CON VALIDACIONES COMPLETAS ====================
    readonly form = this.fb.group({
        institutionId: [1, Validators.required],
        personId: [null as number | null, [Validators.required]],
        teacherCode: ['', [
            Validators.required,
            Validators.minLength(4),
            Validators.maxLength(15),
            codigoProfesorValido
        ]],
        specialty: ['', [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(50),
            soloLetrasYEspacios
        ]],
        professionalTitle: ['', [
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(100),
            tituloProfesionalValido
        ]],
        hireDate: ['', [
            Validators.required,
            fechaNoFutura
        ]],
        contractType: ['PERMANENTE', [Validators.required]],
        userId: [null as number | null]
    });

    constructor() {
        effect(() => {
            const code = this.form.get('teacherCode');
            if (code?.touched && code.invalid) {
                code.markAsDirty();
            }
        });
    }

    ngOnInit(): void {
        this.cargarSelects();
        this.cargar();
    }

    cargarSelects(): void {
        this.cargandoSelects.set(true);

        this.personService.listarTodas().subscribe({
            next: (persons) => {
                if (persons && persons.length > 0) {
                    this.persons.set(persons.map(p => ({
                        id: p.id!,
                        name: `${p.firstName} ${p.lastName} ${p.secondLastName || ''}`.trim(),
                        documentNumber: p.documentNumber
                    })));
                }
                this.cargandoSelects.set(false);
            },
            error: (err) => {
                console.error('Error al cargar personas:', err);
                this.cargandoSelects.set(false);
                Swal.fire('Error', 'No se pudieron cargar las personas', 'error');
            }
        });
    }

    cargar(): void {
        this.cargando.set(true);
        this.teacherService.listarTodas().subscribe({
            next: (data) => {
                const enriched = data.map(t => ({
                    ...t,
                    personName: this.persons().find(p => p.id === t.personId)?.name || `Persona ${t.personId}`,
                    personDocument: this.persons().find(p => p.id === t.personId)?.documentNumber
                }));
                this.teachers.set(enriched);
                this.cargando.set(false);
            },
            error: (err) => {
                console.error('Error al cargar:', err);
                this.cargando.set(false);
                Swal.fire('Error', 'No se pudieron cargar los profesores', 'error');
            }
        });
    }

    // ==================== GETTERS PARA ERRORES ====================
    
    get teacherCodeInvalid() {
        const control = this.form.get('teacherCode');
        return control?.invalid && (control?.touched || control?.dirty);
    }

    get teacherCodeError() {
        const control = this.form.get('teacherCode');
        if (control?.hasError('required')) return 'El código de profesor es obligatorio';
        if (control?.hasError('minlength')) return 'Mínimo 4 caracteres';
        if (control?.hasError('maxlength')) return 'Máximo 15 caracteres';
        if (control?.hasError('codigoInvalido')) return 'Solo letras, números y guiones';
        return '';
    }

    get personIdInvalid() {
        const control = this.form.get('personId');
        return control?.invalid && (control?.touched || control?.dirty);
    }

    get specialtyInvalid() {
        const control = this.form.get('specialty');
        return control?.invalid && (control?.touched || control?.dirty);
    }

    get specialtyError() {
        const control = this.form.get('specialty');
        if (control?.hasError('required')) return 'La especialidad es obligatoria';
        if (control?.hasError('minlength')) return 'Mínimo 3 caracteres';
        if (control?.hasError('soloLetras')) return 'Solo se permiten letras y espacios';
        return '';
    }

    get professionalTitleInvalid() {
        const control = this.form.get('professionalTitle');
        return control?.invalid && (control?.touched || control?.dirty);
    }

    get professionalTitleError() {
        const control = this.form.get('professionalTitle');
        if (control?.hasError('required')) return 'El título profesional es obligatorio';
        if (control?.hasError('minlength')) return 'Mínimo 5 caracteres';
        if (control?.hasError('tituloInvalido')) return 'Solo letras, números, puntos y espacios';
        return '';
    }

    get hireDateInvalid() {
        const control = this.form.get('hireDate');
        return control?.invalid && (control?.touched || control?.dirty);
    }

    get hireDateError() {
        const control = this.form.get('hireDate');
        if (control?.hasError('required')) return 'La fecha de contratación es obligatoria';
        if (control?.hasError('fechaFutura')) return 'La fecha no puede ser futura';
        return '';
    }

    get contractTypeInvalid() {
        const control = this.form.get('contractType');
        return control?.invalid && (control?.touched || control?.dirty);
    }

    // ==================== COMPUTED ====================
    
    readonly filtradas = computed(() => {
        let filtered = this.teachers();

        const q = this.busqueda().toLowerCase();
        if (q) {
            filtered = filtered.filter(t =>
                t.teacherCode?.toLowerCase().includes(q) ||
                t.specialty?.toLowerCase().includes(q) ||
                t.personName?.toLowerCase().includes(q) ||
                t.personDocument?.toLowerCase().includes(q)
            );
        }

        if (this.estadoFiltro() === 'activas') {
            filtered = filtered.filter(t => t.isActive === true);
        } else if (this.estadoFiltro() === 'inactivas') {
            filtered = filtered.filter(t => t.isActive === false);
        }

        if (this.tipoContratoFiltro() !== 'todos') {
            filtered = filtered.filter(t => t.contractType === this.tipoContratoFiltro());
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
        return this.teachers().filter(t => t.isActive === true).length;
    });

    readonly totalInactivos = computed(() => {
        return this.teachers().filter(t => t.isActive === false).length;
    });

    readonly totalPermanentes = computed(() => {
        return this.teachers().filter(t => t.contractType === 'PERMANENTE').length;
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

    toggleContratoDropdown(): void {
        this.contratoDropdownAbierto.update(v => !v);
    }

    seleccionarFiltro(estado: 'todas' | 'activas' | 'inactivas'): void {
        this.estadoFiltro.set(estado);
        this.paginaActual.set(1);
        this.dropdownAbierto.set(false);
    }

    seleccionarContratoFiltro(tipo: 'todos' | 'PERMANENTE' | 'TEMPORAL' | 'POR_HORAS'): void {
        this.tipoContratoFiltro.set(tipo);
        this.paginaActual.set(1);
        this.contratoDropdownAbierto.set(false);
    }

    readonly textoFiltro = computed(() => {
        const map: Record<string, string> = {
            'todas': 'Todos los profesores',
            'activas': 'Solo activos',
            'inactivas': 'Solo inactivos'
        };
        return map[this.estadoFiltro()] || 'Filtros';
    });

    readonly textoContratoFiltro = computed(() => {
        const map: Record<string, string> = {
            'todos': 'Todos',
            'PERMANENTE': 'Permanente',
            'TEMPORAL': 'Temporal',
            'POR_HORAS': 'Por horas'
        };
        return map[this.tipoContratoFiltro()] || 'Tipo contrato';
    });

    setVista(v: VistaMode): void {
        this.vistaMode.set(v);
    }

    setBusqueda(e: Event): void {
        this.busqueda.set((e.target as HTMLInputElement).value);
        this.paginaActual.set(1);
    }

    // ==================== MODAL ====================
    
    abrirModal(teacher?: Teacher): void {
        if (teacher) {
            this.modalCargando.set(true);
            this.teacherService.obtenerPorId(teacher.id!).subscribe({
                next: (fullTeacher) => {
                    this.editando.set(fullTeacher);
                    this.form.patchValue({
                        institutionId: 1,
                        personId: fullTeacher.personId,
                        teacherCode: fullTeacher.teacherCode,
                        specialty: fullTeacher.specialty || '',
                        professionalTitle: fullTeacher.professionalTitle || '',
                        hireDate: fullTeacher.hireDate?.split('T')[0] || '',
                        contractType: fullTeacher.contractType || 'PERMANENTE',
                        userId: fullTeacher.userId || null
                    });
                    this.modalCargando.set(false);
                    this.mostrarModal.set(true);
                },
                error: (err) => {
                    console.error('Error al obtener detalle:', err);
                    this.modalCargando.set(false);
                    Swal.fire('Error', 'No se pudo cargar el profesor', 'error');
                }
            });
        } else {
            this.editando.set(null);
            this.form.reset({
                institutionId: 1,
                personId: null,
                teacherCode: '',
                specialty: '',
                professionalTitle: '',
                hireDate: '',
                contractType: 'PERMANENTE',
                userId: null
            });
            this.mostrarModal.set(true);
        }
    }

    verDetalle(teacher: Teacher): void {
        this.detalleCargando.set(true);
        this.teacherService.obtenerPorId(teacher.id!).subscribe({
            next: (fullTeacher) => {
                this.detalle.set({
                    ...fullTeacher,
                    personName: this.persons().find(p => p.id === fullTeacher.personId)?.name,
                    personDocument: this.persons().find(p => p.id === fullTeacher.personId)?.documentNumber
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

    // ==================== GUARDAR ====================
    
    guardar(): void {
        if (this.form.invalid) {
            Object.keys(this.form.controls).forEach(key => {
                const control = this.form.get(key);
                control?.markAsTouched();
                control?.markAsDirty();
            });

            // Mensajes específicos según el error
            if (this.form.get('teacherCode')?.errors?.['codigoInvalido']) {
                Swal.fire('Formato inválido', 'El código debe tener entre 4 y 15 caracteres (solo letras, números y guiones)', 'warning');
            } else if (this.form.get('specialty')?.hasError('required')) {
                Swal.fire('Campo requerido', 'La especialidad es obligatoria', 'warning');
            } else if (this.form.get('professionalTitle')?.hasError('required')) {
                Swal.fire('Campo requerido', 'El título profesional es obligatorio', 'warning');
            } else if (this.form.get('hireDate')?.hasError('required')) {
                Swal.fire('Campo requerido', 'La fecha de contratación es obligatoria', 'warning');
            } else if (this.form.get('hireDate')?.hasError('fechaFutura')) {
                Swal.fire('Fecha inválida', 'La fecha de contratación no puede ser futura', 'warning');
            } else if (!this.form.get('personId')?.value) {
                Swal.fire('Campo requerido', 'Por favor selecciona una persona', 'warning');
            } else {
                Swal.fire('Campos incompletos', 'Por favor completa todos los campos obligatorios', 'warning');
            }
            return;
        }

        const datos = {
            institutionId: 1,
            personId: Number(this.form.value.personId),
            teacherCode: this.form.value.teacherCode,
            specialty: this.form.value.specialty || null,
            professionalTitle: this.form.value.professionalTitle || null,
            hireDate: this.form.value.hireDate || null,
            contractType: this.form.value.contractType,
            userId: this.form.value.userId ? Number(this.form.value.userId) : null
        } as TeacherRequest;

        const editando = this.editando();
        const obs$ = editando
            ? this.teacherService.actualizar(editando.id!, datos)
            : this.teacherService.crear(datos);

        obs$.subscribe({
            next: () => {
                this.cerrarModal();
                this.cargar();
                Swal.fire({
                    title: '¡Guardado!',
                    text: `El profesor ha sido ${editando ? 'actualizado' : 'registrado'} exitosamente.`,
                    icon: 'success',
                    confirmButtonColor: '#165EF0',
                    timer: 2000,
                    showConfirmButton: false
                });
            },
            error: (err) => {
                console.error('Error al guardar:', err);
                let errorMsg = 'No se pudo guardar el profesor';
                if (err.error?.message?.includes('duplicate') || err.error?.message?.includes('ya existe')) {
                    errorMsg = 'Ya existe un profesor con ese código';
                } else if (err.error?.message) {
                    errorMsg = err.error.message;
                }
                Swal.fire('Error', errorMsg, 'error');
            }
        });
    }

    // ==================== ACCIONES ====================
    
    toggleEstado(teacher: Teacher): void {
        const activo = teacher.isActive;

        Swal.fire({
            title: '¿Estás seguro?',
            text: activo ? '¿Deseas desactivar este profesor?' : '¿Deseas activar este profesor?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#165EF0',
            cancelButtonColor: '#475569',
            confirmButtonText: activo ? 'Sí, desactivar' : 'Sí, activar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const obs$ = activo
                    ? this.teacherService.softDelete(teacher.id!)
                    : this.teacherService.activar(teacher.id!);

                obs$.subscribe({
                    next: () => {
                        this.cargar();
                        Swal.fire({
                            title: '¡Actualizado!',
                            text: `El profesor fue ${activo ? 'desactivado' : 'activado'}.`,
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
            text: "¡No podrás revertir esta acción! El profesor será eliminado permanentemente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.teacherService.eliminar(id).subscribe({
                    next: () => {
                        this.cargar();
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'El profesor ha sido eliminado.',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    },
                    error: (err) => {
                        console.error('Error al eliminar:', err);
                        Swal.fire('Error', 'No se pudo eliminar el profesor', 'error');
                    }
                });
            }
        });
    }

    // ==================== HELPERS ====================
    
    getContractTypeLabel(type: string | undefined): string {
        const map: Record<string, string> = {
            'PERMANENTE': 'Permanente',
            'TEMPORAL': 'Temporal',
            'POR_HORAS': 'Por horas'
        };
        return map[type || 'PERMANENTE'] || 'Permanente';
    }

    getContractTypeColor(type: string | undefined): string {
        const map: Record<string, string> = {
            'PERMANENTE': '#10b981',
            'TEMPORAL': '#f59e0b',
            'POR_HORAS': '#8b5cf6'
        };
        return map[type || 'PERMANENTE'] || '#10b981';
    }

    formatearFecha(fecha: string | null | undefined): string {
        if (!fecha) return '—';
        const date = new Date(fecha);
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
    }

    getPersonDisplay(person: PersonOption): string {
        return `${person.name} (${person.documentNumber})`;
    }
}