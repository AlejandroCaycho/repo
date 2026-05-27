import { Component, inject, signal, computed, OnInit, ApplicationRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule, Shield, Search, Edit, Trash, X, Filter, LayoutGrid, List, Plus, ChevronDown, CheckSquare, Square, Key } from 'lucide-angular';
import { RolService } from '../../core/services/auth/rol.service';
import { PermisoService } from '../../core/services/auth/permiso.service';
import { UsuarioAuthService } from '../../core/services/auth/usuario-auth.service';
import { Rol, RolRequest, Permiso, Usuario } from '../../core/interfaces/auth.interface';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { extractAuthError } from '../../core/handlers/auth-error.handler';
import { strictText, uppercaseCode } from '../../shared/strict-form.validators';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export class Roles implements OnInit {
  private readonly svc    = inject(RolService);
  private readonly pSvc   = inject(PermisoService);
  private readonly uSvc   = inject(UsuarioAuthService);
  private readonly fb     = inject(FormBuilder);
  private readonly appRef = inject(ApplicationRef);
  private readonly cdr    = inject(ChangeDetectorRef);

  readonly roles           = signal<Rol[]>([]);
  readonly cargando        = signal(false);
  readonly mostrarModal    = signal(false);
  readonly editando        = signal<Rol | null>(null);
  readonly busqueda        = signal('');
  readonly filtro          = signal<'todos' | 'sistema' | 'custom'>('todos');
  readonly dropdownAbierto = signal(false);

  readonly paginaActual   = signal(1);
  readonly itemsPorPagina = signal(10);

  readonly mostrarModalPermisos = signal(false);
  readonly rolSeleccionado      = signal<Rol | null>(null);
  readonly todosLosPermisos     = signal<Permiso[]>([]);
  readonly permisosAsignados    = signal<number[]>([]);
  readonly filtroModulo         = signal<string>('Todos');
  readonly dropdownModulosAbierto = signal(false);
  readonly cargandoPermisos     = signal(false);
  readonly paginaPermisos       = signal(1);
  readonly gruposPorPagina      = 6;

  readonly totalPaginasPermisos = computed(() =>
    Math.max(1, Math.ceil(this.permisosAgrupados().length / this.gruposPorPagina))
  );

  readonly permisosAgrupadosPaginados = computed(() => {
    const grupos = this.permisosAgrupados();
    const inicio = (this.paginaPermisos() - 1) * this.gruposPorPagina;
    return grupos.slice(inicio, inicio + this.gruposPorPagina);
  });

  readonly mostrarModalUsuarios = signal(false);
  readonly todosLosUsuarios     = signal<Usuario[]>([]);
  readonly usuariosAsignados    = signal<number[]>([]);
  readonly cargandoUsuarios     = signal(false);
  readonly busquedaUsuario      = signal('');

  readonly filtrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    const f = this.filtro();
    return this.roles()
      .filter(r => {
        const coincideTipo = f === 'todos' ||
                            (f === 'sistema' && r.esSistema) ||
                            (f === 'custom' && !r.esSistema);
        const coincideBusqueda = r.nombre.toLowerCase().includes(q) ||
                                 (r.descripcion ?? '').toLowerCase().includes(q);
        return coincideTipo && coincideBusqueda;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  readonly filtradosPaginados = computed(() => {
    const list = this.filtrados();
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
    return list.slice(inicio, inicio + this.itemsPorPagina());
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtrados().length / this.itemsPorPagina()))
  );

  readonly filasRelleno = computed(() => {
    const len = this.filtradosPaginados().length;
    if (len >= this.itemsPorPagina() || this.filtrados().length === 0) return [];
    return Array(Math.max(0, this.itemsPorPagina() - len));
  });

  readonly rolesSistema = computed(() => this.roles().filter(r => r.esSistema).length);
  readonly rolesCustom  = computed(() => this.roles().filter(r => !r.esSistema).length);

  readonly modulosDisponibles = computed(() => {
    const modulos = this.todosLosPermisos().map(p => p.modulo);
    return ['Todos', ...Array.from(new Set(modulos))].sort((a, b) => {
      if (a === 'Todos') return -1;
      if (b === 'Todos') return 1;
      return a.localeCompare(b);
    });
  });

  readonly permisosAgrupados = computed(() => {
    const filtro = this.filtroModulo();
    const lista = this.todosLosPermisos().filter(p => filtro === 'Todos' || p.modulo === filtro);

    const grupos: Record<string, Permiso[]> = {};
    lista.forEach(p => {
      grupos[p.modulo] = [...(grupos[p.modulo] ?? []), p];
    });
    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
  });

  readonly form = this.fb.group({
    nombre:      ['', [uppercaseCode({ min: 3, max: 50 })]],
    descripcion: ['', [strictText({ allowEmpty: true, min: 8, max: 180 })]],
    esSistema:   [false],
  });

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: (data) => { this.roles.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false)
    });
  }

  abrirModal(rol?: Rol): void {
    this.editando.set(rol ?? null);
    this.form.reset({ esSistema: false });
    if (rol) {
      this.form.patchValue({ nombre: rol.nombre, descripcion: rol.descripcion ?? '', esSistema: rol.esSistema });
    }
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.dropdownAbierto.set(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const datos: RolRequest = {
      nombre: String(raw.nombre ?? '').trim().toUpperCase(),
      descripcion: String(raw.descripcion ?? '').trim() || undefined,
      esSistema: !!raw.esSistema,
    };
    const editando = this.editando();
    const obs$ = editando ? this.svc.actualizar(editando.id, datos) : this.svc.crear(datos);
    obs$.subscribe({ 
      next: () => {
        this.cerrarModal();
        this.cargar();
        Swal.fire({ title: '¡Éxito!', text: `Rol ${editando ? 'actualizado' : 'creado'} correctamente`, icon: 'success', timer: 1500, showConfirmButton: false });
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        const msg = extractAuthError(err) || 'No se pudo guardar el rol';
        Swal.fire('Error', msg, 'error');
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
          next: () => { this.cargar(); Swal.fire('Eliminado', 'El rol ha sido borrado', 'success'); },
          error: (err) => {
            console.error('Error al eliminar:', err);
            const msg = extractAuthError(err) || 'No se pudo eliminar el rol';
            Swal.fire('Error', msg, 'error');
          }
        });
      }
    });
  }

  abrirModalPermisos(rol: Rol): void {
    this.rolSeleccionado.set(rol);
    this.mostrarModalPermisos.set(true);
    this.cargandoPermisos.set(true);
    this.filtroModulo.set('Todos');
    this.dropdownModulosAbierto.set(false);

    forkJoin({
      todos: this.pSvc.listar(),
      asignados: this.svc.listarPermisosPorRol(rol.id),
    }).subscribe({
      next: res => {
        this.todosLosPermisos.set(res.todos);
        this.permisosAsignados.set(res.asignados.map(p => p.id));
        this.paginaPermisos.set(1);
        this.cargandoPermisos.set(false);
        this.cdr.markForCheck();
        this.appRef.tick();
      },
      error: err => {
        this.cargandoPermisos.set(false);
        this.cdr.markForCheck();
        this.appRef.tick();
        Swal.fire('Error', extractAuthError(err) || 'No se pudieron cargar los permisos', 'error');
      },
    });
  }

  cerrarModalPermisos(): void {
    this.mostrarModalPermisos.set(false);
    this.rolSeleccionado.set(null);
    this.todosLosPermisos.set([]);
    this.permisosAsignados.set([]);
    this.dropdownModulosAbierto.set(false);
  }

  togglePermiso(permisoId: number): void {
    const rol = this.rolSeleccionado();
    if (!rol) return;

    const estaAsignado = this.permisosAsignados().includes(permisoId);
    const datos = { rolId: rol.id, permisoId };
    const obs$ = estaAsignado ? this.svc.quitarPermiso(datos) : this.svc.asignarPermiso(datos);

    obs$.subscribe({
      next: () => {
        if (estaAsignado) {
          this.permisosAsignados.update(list => list.filter(id => id !== permisoId));
        } else {
          this.permisosAsignados.update(list => [...list, permisoId]);
        }
        this.cdr.markForCheck();
        this.appRef.tick();
      },
      error: err => {
        Swal.fire('Error', extractAuthError(err) || 'No se pudo actualizar el permiso', 'error');
      }
    });
  }

  private permisosVisibles(): Permiso[] {
    const filtro = this.filtroModulo();
    return filtro === 'Todos'
      ? this.todosLosPermisos()
      : this.todosLosPermisos().filter(p => p.modulo === filtro);
  }

  asignarTodosPermisos(): void {
    const rol = this.rolSeleccionado();
    if (!rol) return;
    const pendientes = this.permisosVisibles().filter(p => !this.permisosAsignados().includes(p.id));
    if (!pendientes.length) return;
    pendientes.forEach(p => {
      this.svc.asignarPermiso({ rolId: rol.id, permisoId: p.id }).subscribe({
        next: () => this.permisosAsignados.update(list => [...list, p.id])
      });
    });
  }

  limpiarTodosPermisos(): void {
    const rol = this.rolSeleccionado();
    if (!rol) return;
    const asignados = this.permisosVisibles().filter(p => this.permisosAsignados().includes(p.id));
    if (!asignados.length) return;
    asignados.forEach(p => {
      this.svc.quitarPermiso({ rolId: rol.id, permisoId: p.id }).subscribe({
        next: () => this.permisosAsignados.update(list => list.filter(id => id !== p.id))
      });
    });
  }

  abrirModalUsuarios(rol: Rol): void {
    this.rolSeleccionado.set(rol);
    this.mostrarModalUsuarios.set(true);
    this.cargandoUsuarios.set(true);
    this.busquedaUsuario.set('');

    forkJoin({
      todos: this.uSvc.listar(),
      asignados: this.svc.listarUsuariosPorRol(rol.id)
    }).subscribe({
      next: (res) => {
        this.todosLosUsuarios.set(res.todos);
        this.usuariosAsignados.set(res.asignados.map(u => u.usuarioId));
        this.cargandoUsuarios.set(false);
      },
      error: (err) => {
        this.cargandoUsuarios.set(false);
        Swal.fire('Error', extractAuthError(err), 'error');
      }
    });
  }

  cerrarModalUsuarios(): void {
    this.mostrarModalUsuarios.set(false);
    this.rolSeleccionado.set(null);
  }

  toggleUsuario(usuarioId: number): void {
    const rol = this.rolSeleccionado();
    if (!rol) return;

    const estaAsignado = this.usuariosAsignados().includes(usuarioId);
    const datos = { usuarioId, rolId: rol.id };

    const obs$ = estaAsignado 
      ? this.svc.quitarRolAUsuario(usuarioId, rol.id) 
      : this.svc.asignarRolAUsuario(datos);

    obs$.subscribe({
      next: () => {
        if (estaAsignado) {
          this.usuariosAsignados.update(list => list.filter(id => id !== usuarioId));
        } else {
          this.usuariosAsignados.update(list => [...list, usuarioId]);
        }
      },
      error: (err) => Swal.fire('Error', extractAuthError(err), 'error')
    });
  }

  filtradosUsuarios = computed(() => {
    const q = this.busquedaUsuario().toLowerCase();
    return this.todosLosUsuarios().filter(u => 
      u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  setBusqueda(e: Event): void {
    this.busqueda.set((e.target as HTMLInputElement).value);
    this.paginaActual.set(1);
  }

  setFiltro(f: 'todos' | 'sistema' | 'custom'): void {
    this.filtro.set(f);
    this.dropdownAbierto.set(false);
    this.paginaActual.set(1);
  }

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) this.paginaActual.set(nueva);
  }

  cambiarPaginaPermisos(delta: number): void {
    const nueva = this.paginaPermisos() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginasPermisos()) this.paginaPermisos.set(nueva);
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
    if (errors['pattern']) return 'Usa solo MAYUSCULAS, numeros y guion bajo. Ej. ADMINISTRADOR_GENERAL.';
    return 'Valor invalido.';
  }
}

