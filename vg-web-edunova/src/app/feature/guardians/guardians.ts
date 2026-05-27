import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LucideAngularModule, Users, Search, LayoutGrid, List, Edit, Power, Trash, Eye, X, User, Shield, Mail, Phone, MapPin, CheckCircle, XCircle, Award, UserPlus, AlertCircle, ChevronDown, Briefcase, GraduationCap, Building } from 'lucide-angular';
import { GuardianService } from '../../core/services/guardian.service';
import { PersonService } from '../../core/services/person.service';
import { Guardian, GuardianRequest, PersonOption } from '../../core/interfaces/guardian.interface';
import Swal from 'sweetalert2';

type VistaMode = 'lista' | 'grilla';

// Validadores personalizados
const onlyLettersAndSpaces = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const isValid = /^[a-zA-ZáéíóúñÑüÜ\s]+$/.test(value);
    return isValid ? null : { onlyLetters: true };
};

@Component({
    selector: 'app-guardians',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    templateUrl: './guardians.html',
    styleUrl: './guardians.scss'
})
export class GuardiansComponent implements OnInit {
    private readonly guardianService = inject(GuardianService);
    private readonly personService = inject(PersonService);
    private readonly fb = inject(FormBuilder);

    readonly guardians = signal<Guardian[]>([]);
    readonly persons = signal<PersonOption[]>([]);

    readonly cargando = signal(false);
    readonly cargandoSelects = signal(false);
    readonly mostrarModal = signal(false);
    readonly modalCargando = signal(false);
    readonly mostrarDetalle = signal(false);
    readonly detalleCargando = signal(false);
    readonly detalle = signal<any>(null);
    readonly editando = signal<Guardian | null>(null);
    readonly busqueda = signal('');
    readonly estadoFiltro = signal<'todas' | 'activas' | 'inactivas'>('todas');
    readonly vistaMode = signal<VistaMode>('lista');
    readonly dropdownAbierto = signal(false);

    readonly paginaActual = signal(1);
    readonly itemsPorPagina = signal(10);

    readonly form = this.fb.group({
        institutionId: [1, Validators.required],
        personId: [null as number | null, [Validators.required, Validators.min(1)]],
        occupation: ['', [Validators.maxLength(50), onlyLettersAndSpaces]],
        company: ['', [Validators.maxLength(100), onlyLettersAndSpaces]],
        position: ['', [Validators.maxLength(50), onlyLettersAndSpaces]],
        educationLevel: ['', [Validators.maxLength(50), onlyLettersAndSpaces]]
    });

    constructor() {
        effect(() => {
            const occupation = this.form.get('occupation');
            if (occupation?.touched && occupation.invalid) {
                occupation.markAsDirty();
            }
        });
    }

    ngOnInit(): void {
        this.cargarSelects();
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
                this.cargar(); // ← ahora sí, después de tener las personas
            },
            error: (err) => {
                console.error('Error al cargar personas:', err);
                this.cargandoSelects.set(false);
                this.cargar(); // igual carga aunque falle, para mostrar algo
                Swal.fire('Error', 'No se pudieron cargar las personas', 'error');
            }
        });
    }
    cargar(): void {
        this.cargando.set(true);
        this.guardianService.listarTodas().subscribe({
            next: (data) => {
                const enriched = data.map(g => ({
                    ...g,
                    personName: this.persons().find(p => p.id === g.personId)?.name || `Persona ${g.personId}`,
                    personDocument: this.persons().find(p => p.id === g.personId)?.documentNumber
                }));
                this.guardians.set(enriched);
                this.cargando.set(false);
            },
            error: (err) => {
                console.error('Error al cargar:', err);
                this.cargando.set(false);
                Swal.fire('Error', 'No se pudieron cargar los apoderados', 'error');
            }
        });
    }

    // Getters para validaciones
    get personIdInvalid() {
        const control = this.form.get('personId');
        return control?.invalid && (control?.touched || control?.dirty);
    }

    get occupationInvalid() {
        const control = this.form.get('occupation');
        if (!control?.value) return false;
        return control?.invalid && (control?.touched || control?.dirty);
    }

    get companyInvalid() {
        const control = this.form.get('company');
        if (!control?.value) return false;
        return control?.invalid && (control?.touched || control?.dirty);
    }

    get positionInvalid() {
        const control = this.form.get('position');
        if (!control?.value) return false;
        return control?.invalid && (control?.touched || control?.dirty);
    }

    get educationLevelInvalid() {
        const control = this.form.get('educationLevel');
        if (!control?.value) return false;
        return control?.invalid && (control?.touched || control?.dirty);
    }

    readonly filtradas = computed(() => {
        let filtered = this.guardians();

        const q = this.busqueda().toLowerCase();
        if (q) {
            filtered = filtered.filter(g =>
                g.occupation?.toLowerCase().includes(q) ||
                g.company?.toLowerCase().includes(q) ||
                g.position?.toLowerCase().includes(q) ||
                g.personName?.toLowerCase().includes(q) ||
                g.personDocument?.toLowerCase().includes(q)
            );
        }

        if (this.estadoFiltro() === 'activas') {
            filtered = filtered.filter(g => g.isActive === true);
        } else if (this.estadoFiltro() === 'inactivas') {
            filtered = filtered.filter(g => g.isActive === false);
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
        return this.guardians().filter(g => g.isActive === true).length;
    });

    readonly totalInactivos = computed(() => {
        return this.guardians().filter(g => g.isActive === false).length;
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

    seleccionarFiltro(estado: 'todas' | 'activas' | 'inactivas'): void {
        this.estadoFiltro.set(estado);
        this.paginaActual.set(1);
        this.dropdownAbierto.set(false);
    }

    readonly textoFiltro = computed(() => {
        const map: Record<string, string> = {
            'todas': 'Todos los apoderados',
            'activas': 'Solo activos',
            'inactivas': 'Solo inactivos'
        };
        return map[this.estadoFiltro()] || 'Filtros';
    });

    setVista(v: VistaMode): void {
        this.vistaMode.set(v);
    }

    setBusqueda(e: Event): void {
        this.busqueda.set((e.target as HTMLInputElement).value);
        this.paginaActual.set(1);
    }

    abrirModal(guardian?: Guardian): void {
        if (guardian) {
            this.modalCargando.set(true);
            this.guardianService.obtenerPorId(guardian.id!).subscribe({
                next: (fullGuardian) => {
                    this.editando.set(fullGuardian);
                    this.form.patchValue({
                        institutionId: 1,
                        personId: fullGuardian.personId,
                        occupation: fullGuardian.occupation || '',
                        company: fullGuardian.company || '',
                        position: fullGuardian.position || '',
                        educationLevel: fullGuardian.educationLevel || ''
                    });
                    this.modalCargando.set(false);
                    this.mostrarModal.set(true);
                },
                error: (err) => {
                    console.error('Error al obtener detalle:', err);
                    this.modalCargando.set(false);
                    Swal.fire('Error', 'No se pudo cargar el apoderado', 'error');
                }
            });
        } else {
            this.editando.set(null);
            this.form.reset({
                institutionId: 1,
                personId: null,
                occupation: '',
                company: '',
                position: '',
                educationLevel: ''
            });
            this.mostrarModal.set(true);
        }
    }

    verDetalle(guardian: Guardian): void {
        this.detalleCargando.set(true);
        this.guardianService.obtenerPorId(guardian.id!).subscribe({
            next: (fullGuardian) => {
                this.detalle.set({
                    ...fullGuardian,
                    personName: this.persons().find(p => p.id === fullGuardian.personId)?.name,
                    personDocument: this.persons().find(p => p.id === fullGuardian.personId)?.documentNumber
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

            if (!this.form.get('personId')?.value) {
                Swal.fire('Campo requerido', 'Por favor selecciona una persona', 'warning');
            } else {
                Swal.fire('Campos incompletos', 'Por favor completa todos los campos obligatorios', 'warning');
            }
            return;
        }

        const datos = {
            institutionId: 1,
            personId: Number(this.form.value.personId),
            occupation: this.form.value.occupation?.trim() || null,
            company: this.form.value.company?.trim() || null,
            position: this.form.value.position?.trim() || null,
            educationLevel: this.form.value.educationLevel?.trim() || null
        } as GuardianRequest;

        console.log('📤 Enviando:', JSON.stringify(datos, null, 2));

        const editando = this.editando();
        const obs$ = editando
            ? this.guardianService.actualizar(editando.id!, datos)
            : this.guardianService.crear(datos);

        obs$.subscribe({
            next: (response) => {
                console.log('✅ Respuesta del servidor:', response); // ← AGREGA ESTO
                this.cerrarModal();
                this.cargar();
                Swal.fire({
                    title: '¡Guardado!',
                    text: `El apoderado ha sido ${editando ? 'actualizado' : 'registrado'} exitosamente.`,
                    icon: 'success',
                    confirmButtonColor: '#165EF0',
                    timer: 2000,
                    showConfirmButton: false
                });
            },
            error: (err) => {
                console.error('❌ Error completo:', err);
                console.error('❌ Error body:', err.error);
                console.error('❌ Status:', err.status);
                let errorMsg = 'No se pudo guardar el apoderado';
                if (err.error?.error) errorMsg = err.error.error;
                else if (err.error?.message) errorMsg = err.error.message;
                Swal.fire('Error', errorMsg, 'error');
            }
        });
    }

    toggleEstado(guardian: Guardian): void {
        const activo = guardian.isActive;

        Swal.fire({
            title: '¿Estás seguro?',
            text: activo ? '¿Deseas desactivar este apoderado?' : '¿Deseas activar este apoderado?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#165EF0',
            cancelButtonColor: '#475569',
            confirmButtonText: activo ? 'Sí, desactivar' : 'Sí, activar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const obs$ = activo
                    ? this.guardianService.softDelete(guardian.id!)
                    : this.guardianService.activar(guardian.id!);

                obs$.subscribe({
                    next: () => {
                        this.cargar();
                        Swal.fire({
                            title: '¡Actualizado!',
                            text: `El apoderado fue ${activo ? 'desactivado' : 'activado'}.`,
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
            text: "¡No podrás revertir esta acción! El apoderado será eliminado permanentemente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#475569',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.guardianService.eliminar(id).subscribe({
                    next: () => {
                        this.cargar();
                        Swal.fire({
                            title: '¡Eliminado!',
                            text: 'El apoderado ha sido eliminado.',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    },
                    error: (err) => {
                        console.error('Error al eliminar:', err);
                        Swal.fire('Error', 'No se pudo eliminar el apoderado', 'error');
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

    getPersonDisplay(person: PersonOption): string {
        return `${person.name} (${person.documentNumber})`;
    }
}
