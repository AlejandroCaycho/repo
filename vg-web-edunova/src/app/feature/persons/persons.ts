import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LucideAngularModule, User, Search, LayoutGrid, List, Edit, Power, Trash, Eye, X, Building, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-angular';
import { PersonService } from '../../core/services/person.service';
import { Person, PersonRequest } from '../../core/interfaces/person.interface';
import Swal from 'sweetalert2';

type VistaMode = 'lista' | 'grilla';

// ==================== VALIDADORES PERSONALIZADOS ====================

// Validador: Solo letras y espacios (para nombres y apellidos) - NO permite números ni caracteres especiales
const soloLetrasYEspacios = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  // Permite letras unicode y espacios
  const regex = /^[\p{L}\s]+$/u;
  return regex.test(value) ? null : { soloLetras: true };
};

// Validador: documento segun tipo seleccionado
const documentoPorTipo = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const type = control.parent?.get('documentType')?.value || 'DNI';

  if (type === 'DNI') {
    return /^\d{8}$/.test(value) ? null : { documentoInvalido: 'dni' };
  }

  if (type === 'CE') {
    return /^[A-Za-z0-9]{9,12}$/.test(value) ? null : { documentoInvalido: 'ce' };
  }

  if (type === 'PASSPORT') {
    return /^[A-Za-z0-9]{6,12}$/.test(value) ? null : { documentoInvalido: 'passport' };
  }

  return null;
};

// Validador: telefono Peru (9 digitos, empieza con 9)
const telefonoPeru = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  const regex = /^9\d{8}$/;
  return regex.test(value) ? null : { telefonoInvalido: true };
};

// Validador: fecha de nacimiento de una persona
const fechaNacimientoValida = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;
  
  const fechaNac = new Date(`${value}T00:00:00`);
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNac.getFullYear();
  const mesDiff = hoy.getMonth() - fechaNac.getMonth();
  
  if (fechaNac > hoy) {
    return { futureDate: true };
  }
  
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaNac.getDate())) {
    edad--;
  }
  
  return edad > 110 ? { maxAge: true } : null;
};

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './persons.html',
  styleUrl: './persons.scss'
})
export class PersonsComponent implements OnInit {
  private readonly personService = inject(PersonService);
  private readonly fb = inject(FormBuilder);

  readonly persons = signal<Person[]>([]);
  readonly cargando = signal(false);
  readonly mostrarModal = signal(false);
  readonly modalCargando = signal(false);
  readonly mostrarDetalle = signal(false);
  readonly detalleCargando = signal(false);
  readonly detalle = signal<any>(null);
  readonly editando = signal<Person | null>(null);
  readonly busqueda = signal('');
  readonly estadoFiltro = signal<'todas' | 'activas' | 'inactivas'>('todas');
  readonly vistaMode = signal<VistaMode>('lista');
  readonly dropdownAbierto = signal(false);
  readonly formDropdownAbierto = signal(false);
  
  readonly paginaActual = signal(1);
  readonly itemsPorPagina = signal(10);

  // ==================== FORMULARIO CON VALIDACIONES COMPLETAS ====================
  readonly form = this.fb.group({
    institutionId: [1, Validators.required],
    documentType: ['DNI', Validators.required],
    documentNumber: ['', [
      Validators.required,
      documentoPorTipo
    ]],
    firstName: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      soloLetrasYEspacios
    ]],
    lastName: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      soloLetrasYEspacios
    ]],
    secondLastName: ['', [
      soloLetrasYEspacios,
      Validators.maxLength(50)
    ]],
    birthDate: ['', [
      Validators.required,
      fechaNacimientoValida
    ]],
    gender: [''],
    address: ['', Validators.maxLength(200)],
    ubigeo: ['', [Validators.pattern(/^\d{6}$/)]],
    phone: ['', [telefonoPeru]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    photoUrl: ['']
  });

  ngOnInit(): void {
    this.form.get('documentType')?.valueChanges.subscribe(() => {
      this.form.get('documentNumber')?.updateValueAndValidity();
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.personService.listarTodas().subscribe({
      next: (data) => {
        this.persons.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar:', err);
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudieron cargar las personas', 'error');
      }
    });
  }

  readonly filtradas = computed(() => {
    const q = this.busqueda().toLowerCase();
    let filtered = this.persons().filter(p => {
      const fullName = `${p.firstName} ${p.lastName} ${p.secondLastName || ''}`.toLowerCase();
      return fullName.includes(q) || 
             p.documentNumber.includes(q) ||
             (p.email?.toLowerCase().includes(q) || false);
    });

    if (this.estadoFiltro() === 'activas') {
      filtered = filtered.filter(p => p.isActive === true);
    } else if (this.estadoFiltro() === 'inactivas') {
      filtered = filtered.filter(p => p.isActive === false);
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

  readonly totalActivas = computed(() => {
    return this.persons().filter(p => p.isActive === true).length;
  });

  readonly totalInactivas = computed(() => {
    return this.persons().filter(p => p.isActive === false).length;
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
      'todas': 'Todas las personas',
      'activas': 'Solo activas',
      'inactivas': 'Solo inactivas'
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

  abrirModal(person?: Person): void {
    if (person) {
      this.modalCargando.set(true);
      this.personService.obtenerPorId(person.id!).subscribe({
        next: (fullPerson) => {
          this.editando.set(fullPerson);
          this.form.patchValue({
            institutionId: fullPerson.institutionId,
            documentType: fullPerson.documentType,
            documentNumber: fullPerson.documentNumber,
            firstName: fullPerson.firstName,
            lastName: fullPerson.lastName,
            secondLastName: fullPerson.secondLastName || '',
            birthDate: fullPerson.birthDate?.split('T')[0] || '',
            gender: fullPerson.gender || '',
            address: fullPerson.address || '',
            ubigeo: fullPerson.ubigeo || '',
            phone: fullPerson.phone || '',
            email: fullPerson.email || '',
            photoUrl: fullPerson.photoUrl || ''
          });
          this.modalCargando.set(false);
          this.mostrarModal.set(true);
        },
        error: (err) => {
          console.error('Error al obtener detalle:', err);
          this.modalCargando.set(false);
          Swal.fire('Error', 'No se pudo cargar la persona', 'error');
        }
      });
    } else {
      this.editando.set(null);
      this.form.reset({ 
        institutionId: 1, 
        documentType: 'DNI',
        gender: '',
        birthDate: ''
      });
      this.mostrarModal.set(true);
    }
  }

  verDetalle(person: Person): void {
    this.detalleCargando.set(true);
    this.personService.obtenerPorId(person.id!).subscribe({
      next: (fullPerson) => {
        this.detalle.set(fullPerson);
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
    this.formDropdownAbierto.set(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsTouched();
        control?.markAsDirty();
      });
      
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Por favor, revisa los campos resaltados en rojo.',
        icon: 'warning',
        confirmButtonColor: '#165EF0'
      });
      return;
    }

    const datos = this.form.value as PersonRequest;
    const editando = this.editando();
    const obs$ = editando
      ? this.personService.actualizar(editando.id!, datos)
      : this.personService.crear(datos);

    obs$.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargar();
        Swal.fire({
          title: '¡Guardado!',
          text: `La persona ha sido ${editando ? 'actualizada' : 'registrada'} exitosamente.`,
          icon: 'success',
          confirmButtonColor: '#165EF0',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        const mensaje = err?.error?.error || err?.error?.message || 'No se pudo guardar la persona';
        Swal.fire('Error', mensaje, 'error');
      }
    });
  }

  toggleEstado(person: Person): void {
    const activa = person.isActive;
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: activa ? '¿Deseas desactivar esta persona?' : '¿Deseas activar esta persona?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#165EF0',
      cancelButtonColor: '#475569',
      confirmButtonText: activa ? 'Sí, desactivar' : 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const obs$ = activa 
          ? this.personService.softDelete(person.id!)
          : this.personService.activar(person.id!);
        
        obs$.subscribe({
          next: () => {
            this.cargar();
            Swal.fire({
              title: '¡Actualizado!',
              text: `La persona fue ${activa ? 'desactivada' : 'activada'}.`,
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
      text: "¡No podrás revertir esta acción! La persona será eliminada permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.personService.eliminar(id).subscribe({
          next: () => {
            this.cargar();
            Swal.fire({
              title: '¡Eliminada!',
              text: 'La persona ha sido eliminada.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Error al eliminar:', err);
            Swal.fire('Error', 'No se pudo eliminar la persona', 'error');
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

  getGenderLabel(gender: string): string {
    const map: Record<string, string> = {
      'MALE': 'Masculino',
      'FEMALE': 'Femenino',
      'OTHER': 'Otro'
    };
    return map[gender] || '—';
  }

  // ==================== GETTERS PARA ERRORES EN HTML ====================
  get documentNumberError(): string {
    const control = this.form.get('documentNumber');
    if (control?.hasError('required')) return 'El numero de documento es obligatorio';
    if (control?.hasError('documentoInvalido')) {
      const type = this.form.get('documentType')?.value;
      if (type === 'DNI') return 'El DNI debe tener exactamente 8 digitos';
      if (type === 'CE') return 'El CE debe tener entre 9 y 12 caracteres alfanumericos';
      if (type === 'PASSPORT') return 'El pasaporte debe tener entre 6 y 12 caracteres alfanumericos';
    }
    return '';
  }

  get firstNameError(): string {
    const control = this.form.get('firstName');
    if (control?.hasError('required')) return 'El nombre es obligatorio';
    if (control?.hasError('soloLetras')) return 'Solo se permiten letras y espacios (sin números)';
    if (control?.hasError('minlength')) return 'Mínimo 2 caracteres';
    return '';
  }

  get lastNameError(): string {
    const control = this.form.get('lastName');
    if (control?.hasError('required')) return 'El apellido paterno es obligatorio';
    if (control?.hasError('soloLetras')) return 'Solo se permiten letras y espacios (sin números)';
    if (control?.hasError('minlength')) return 'Mínimo 2 caracteres';
    return '';
  }

  get secondLastNameError(): string {
    const control = this.form.get('secondLastName');
    if (control?.hasError('soloLetras')) return 'Solo se permiten letras y espacios (sin números)';
    return '';
  }

  get birthDateError(): string {
    const control = this.form.get('birthDate');
    if (control?.hasError('required')) return 'La fecha de nacimiento es obligatoria';
    if (control?.hasError('futureDate')) return 'La fecha de nacimiento no puede ser futura';
    if (control?.hasError('maxAge')) return 'Edad no valida';
    return '';
  }

  get phoneError(): string {
    const control = this.form.get('phone');
    if (control?.hasError('telefonoInvalido') && control?.value) {
      return 'Debe tener 9 dígitos y empezar con 9 (ej: 987654321)';
    }
    return '';
  }

  get emailError(): string {
    const control = this.form.get('email');
    if (control?.hasError('email') && control?.value) {
      return 'Ingresa un email válido (ej: usuario@dominio.com)';
    }
    return '';
  }

  get ubigeoError(): string {
    const control = this.form.get('ubigeo');
    if (control?.hasError('pattern') && control?.value) {
      return 'El ubigeo debe tener 6 dígitos';
    }
    return '';
  }
}
