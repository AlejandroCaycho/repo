import { Component, inject, signal, computed, OnInit, ApplicationRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule, Shield, ShieldCheck, ShieldAlert, Search, Edit, Trash, X, Filter, LayoutGrid, List, Plus, ChevronDown, Key, Layers, AlertTriangle, Power, CheckCircle, XCircle, Eye } from 'lucide-angular';
import { PermisoService } from '../../core/services/auth/permiso.service';
import { Permiso, PermisoRequest } from '../../core/interfaces/auth.interface';
import Swal from 'sweetalert2';
import { extractAuthError } from '../../core/handlers/auth-error.handler';
import { strictText, uppercaseCode } from '../../shared/strict-form.validators';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './permisos.html',
  styleUrl: './permisos.scss'
})
export class Permisos implements OnInit {
  private readonly svc = inject(PermisoService);
  private readonly fb  = inject(FormBuilder);
  private readonly appRef = inject(ApplicationRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly permisos        = signal<Permiso[]>([]);
  readonly cargando        = signal(false);
  readonly mostrarModal    = signal(false);
  readonly editando        = signal<Permiso | null>(null);
  readonly mostrarDetalle  = signal(false);
  readonly detalle         = signal<Permiso | null>(null);
  readonly busqueda        = signal('');
  readonly filtro          = signal('todos');
  readonly dropdownAbierto       = signal(false);
  readonly dropdownModuloAbierto = signal(false);
  readonly dropdownAccionAbierto = signal(false);

  readonly paginaActual = signal(1);
  readonly itemsPorPagina = signal(10);
  
  readonly listaModulos = signal([
    'USUARIOS',
    'INSTITUCIONES',
    'ROLES',
    'PERMISOS',
    'CONFIGURACION',
    'AUDIT',
    'SISTEMA',
    'AUTH',
    'AULAS',
    'MATRICULAS',
    'ESTUDIANTES',
    'DOCENTES',
    'CURSOS',
    'NOTAS',
    'ASISTENCIA',
    'HORARIOS',
    'PAGOS'
  ]);

  readonly listaAcciones = signal([
    'VER',
    'CREAR',
    'EDITAR',
    'ELIMINAR',
    'BUSCAR',
    'EXPORTAR',
    'REPORTE',
    'ACCESO',
    'ACTIVAR',
    'INACTIVAR'
  ]);

  seleccionarModulo(m: string): void {
    this.form.patchValue({ modulo: m });
    this.dropdownModuloAbierto.set(false);
  }

  seleccionarAccion(a: string): void {
    this.form.patchValue({ accion: a });
    this.dropdownAccionAbierto.set(false);
  }

  readonly filtrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    const f = this.filtro();
    
    return this.permisos()
      .filter(p => {
        if (!this.esPermisoVisible(p)) return false;

        const estado = p.estado || 'ACTIVO';
        const coincideFiltro = f === 'todos' || p.modulo === f;
        const qLower = q.toLowerCase();
        
        const accion = (p.accion || '').toLowerCase();
        const modulo = (p.modulo || '').toLowerCase();
        const desc   = (p.descripcion || '').toLowerCase();

        const coincideBusqueda = !q || accion.includes(qLower) || modulo.includes(qLower) || desc.includes(qLower);
        return coincideFiltro && coincideBusqueda;
      })
      .sort((a, b) => a.modulo.localeCompare(b.modulo) || a.accion.localeCompare(b.accion));
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.itemsPorPagina())));

  readonly filtradosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
    return this.filtrados().slice(inicio, inicio + this.itemsPorPagina());
  });

  readonly filasRelleno = computed(() => {
    const len = this.filtradosPaginados().length;
    if (len >= this.itemsPorPagina() || this.filtrados().length === 0) return [];
    return Array(Math.max(0, this.itemsPorPagina() - len));
  });

  readonly modulosUnicos = computed(() => {
    const mods = this.permisos().map(p => p.modulo);
    return [...new Set(mods)].sort();
  });

  readonly totalAccionesCriticas = computed(() => {
    return this.permisos().filter(p => this.esAccionCritica(p.accion)).length;
  });

  readonly totalActivos = computed(() => this.permisos().filter(p => p.estado === 'ACTIVO').length);
  readonly totalInactivos = computed(() => this.permisos().filter(p => p.estado === 'INACTIVO').length);

  readonly form = this.fb.group({
    modulo:      ['', [uppercaseCode({ min: 3, max: 40 })]],
    accion:      ['', [uppercaseCode({ min: 3, max: 30 })]],
    descripcion: ['', [strictText({ allowEmpty: true, min: 8, max: 180 })]],
  });

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (data) => { 
        const lista = (Array.isArray(data) ? data : (data as any).data || [])
          .filter((p: Partial<Permiso>) => this.esPermisoVisible(p))
          .map((p: Permiso) => ({
            ...p,
            modulo: String(p.modulo).trim(),
            accion: String(p.accion).trim(),
            descripcion: p.descripcion?.trim()
          }));
        this.permisos.set(lista); 
        this.cargando.set(false);
        this.cdr.markForCheck();
        this.appRef.tick();
      },
      error: () => {
        this.cargando.set(false);
        this.cdr.markForCheck();
        this.appRef.tick();
      }
    });
  }

  abrirModal(p?: Permiso): void {
    this.editando.set(p ?? null);
    this.form.reset();
    if (p) this.form.patchValue({ modulo: p.modulo, accion: p.accion, descripcion: p.descripcion ?? '' });
    this.mostrarModal.set(true);
  }

  cerrarModal(): void { this.mostrarModal.set(false); }

  verDetalle(p: Permiso): void {
    this.detalle.set(p);
    this.mostrarDetalle.set(true);
  }

  cerrarDetalle(): void {
    this.mostrarDetalle.set(false);
    this.detalle.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const datos: PermisoRequest = {
      modulo: String(raw.modulo ?? '').trim().toUpperCase(),
      accion: String(raw.accion ?? '').trim().toUpperCase(),
      descripcion: String(raw.descripcion ?? '').trim() || undefined,
    };
    const editando = this.editando();
    const obs$ = editando ? this.svc.actualizar(editando.id, datos) : this.svc.crear(datos);
    
    obs$.subscribe({ 
      next: () => { 
        this.cerrarModal(); 
        this.cargar(); 
        Swal.fire({ icon: 'success', title: editando ? 'Actualizado' : 'Creado', timer: 1500, showConfirmButton: false });
        this.cdr.markForCheck();
        this.appRef.tick();
      },
      error: (err) => { 
        Swal.fire('Error', extractAuthError(err), 'error');
      }
    });
  }

  eliminar(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#165EF0',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.svc.eliminar(id).subscribe({ 
          next: () => { 
            this.cargar(); 
            Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El permiso ha sido marcado como ELIMINADO', timer: 1500, showConfirmButton: false });
            this.cdr.markForCheck();
            this.appRef.tick();
          },
          error: (err) => Swal.fire('Error', extractAuthError(err), 'error')
        });
      }
    });
  }

  toggleEstado(p: Permiso): void {
    const nuevoEstado = p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se va a ${accion} el permiso "${p.descripcion ?? this.traducirAccion(p.accion)}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.svc.cambiarEstado(p.id, nuevoEstado).subscribe({
        next: () => {
          this.cargar();
          Swal.fire({
            icon: 'success',
            title: `Permiso ${nuevoEstado}`,
            timer: 1000,
            showConfirmButton: false
          });
          this.cdr.markForCheck();
          this.appRef.tick();
        },
        error: (err) => Swal.fire('Error', extractAuthError(err), 'error')
      });
    });
  }

  setFiltro(f: string): void {
    this.filtro.set(f);
    this.paginaActual.set(1);
    this.dropdownAbierto.set(false);
  }

  setBusqueda(e: Event): void {
    this.busqueda.set((e.target as HTMLInputElement).value);
    this.paginaActual.set(1);
  }

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual() + delta;
    if (nueva > 0 && nueva <= this.totalPaginas()) {
      this.paginaActual.set(nueva);
    }
  }

  esAccionCritica(accion: string): boolean {
    if (!accion) return false;
    const criticas = ['ELIMINAR', 'BORRAR', 'QUITAR', 'DESACTIVAR', 'UPDATE', 'ACTUALIZAR'];
    return criticas.some(c => accion.toUpperCase().includes(c));
  }

  private readonly traduccionModulos: Record<string, string> = {
    USUARIOS: 'Usuarios',
    INSTITUCIONES: 'Instituciones',
    ROLES: 'Roles',
    PERMISOS: 'Permisos',
    CONFIGURACION: 'Configuración',
    AUDIT: 'Auditoría',
    SISTEMA: 'Sistema',
    AUTH: 'Autenticación',
    AULAS: 'Aulas',
    MATRICULAS: 'Matrículas',
    ESTUDIANTES: 'Estudiantes',
    DOCENTES: 'Docentes',
    CURSOS: 'Cursos',
    NOTAS: 'Notas',
    ASISTENCIA: 'Asistencia',
    HORARIOS: 'Horarios',
    PAGOS: 'Pagos',
  };

  private readonly traduccionAcciones: Record<string, string> = {
    VER: 'Ver',
    CREAR: 'Crear',
    EDITAR: 'Editar',
    ELIMINAR: 'Eliminar',
    BUSCAR: 'Buscar',
    EXPORTAR: 'Exportar',
    REPORTE: 'Reporte',
    ACCESO: 'Acceso',
    ACTIVAR: 'Activar',
    INACTIVAR: 'Inactivar',
  };

  traducirModulo(modulo: string): string {
    return this.traduccionModulos[modulo?.toUpperCase()] || modulo;
  }

  traducirAccion(accion: string): string {
    return this.traduccionAcciones[accion?.toUpperCase()] || accion;
  }

  private esPermisoVisible(p: Partial<Permiso> | null | undefined): boolean {
    return !!p?.id && !!String(p.modulo ?? '').trim() && !!String(p.accion ?? '').trim();
  }

  campoError(nombre: string): string {
    const control = this.form.get(nombre);
    if (!control || !(control.dirty || control.touched) || !control.errors) return '';
    const errors = control.errors;
    if (errors['required']) return 'Campo obligatorio.';
    if (errors['minlength']) return `Minimo ${errors['minlength'].requiredLength} caracteres.`;
    if (errors['maxlength']) return `Maximo ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['espaciosBorde']) return 'No debe iniciar ni terminar con espacios.';
    if (errors['espaciosDobles']) return 'No uses espacios dobles.';
    if (errors['pattern']) return 'Usa solo MAYUSCULAS, numeros y guion bajo.';
    return 'Valor invalido.';
  }
}
