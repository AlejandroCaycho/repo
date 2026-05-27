import { Component, inject, signal, computed, OnInit, ChangeDetectorRef, NgZone, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule, User, Search, Edit, Power, Trash, X, RotateCcw, ChevronDown, Users, UserCheck, UserX, Building, Globe, Filter, Eye, EyeOff, ChevronLeft, ChevronRight, LayoutGrid, List, Shield, Key, Camera } from 'lucide-angular';
import { Observable, forkJoin } from 'rxjs';
import { UsuarioAuthService } from '../../core/services/auth/usuario-auth.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { InstitucionService } from '../../core/services/auth/institucion.service';
import { RolService } from '../../core/services/auth/rol.service';
import { Usuario, UsuarioRequest, Institucion, Rol } from '../../core/interfaces/auth.interface';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { extractAuthError } from '../../core/handlers/auth-error.handler';
import { peruPhone, strictEmail, strictText, strongPassword } from '../../shared/strict-form.validators';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class UsuariosComponent implements OnInit {
  private readonly authSvc    = inject(AuthService);
  private readonly svc      = inject(UsuarioAuthService);
  private readonly instSvc  = inject(InstitucionService);
  private readonly rolSvc   = inject(RolService);
  private readonly fb       = inject(FormBuilder);
  private readonly cdr      = inject(ChangeDetectorRef);
  private readonly ngZone   = inject(NgZone);
  private readonly appRef   = inject(ApplicationRef);

  readonly usuarios        = signal<Usuario[]>([]);
  readonly instituciones   = signal<Institucion[]>([]);
  readonly cargando        = signal(false);
  readonly mostrarModal    = signal(false);
  readonly editando        = signal<Usuario | null>(null);
  readonly busqueda        = signal('');
  readonly estadoFiltro    = signal<'todas' | 'activa' | 'inactiva'>('todas');
  readonly institucionFiltro = signal<number | 'todas'>('todas');
  readonly vistaMode       = signal<'lista' | 'grilla'>('lista');
  readonly fotoBlobs       = signal<Map<number, string>>(new Map());
  
  readonly dropdownEstadoAbierto = signal(false);
  readonly dropdownInstAbierto   = signal(false);
  readonly dropdownModalAbierto  = signal(false);
  readonly mostrarContrasena     = signal(false);

  readonly mostrarDetalle   = signal(false);
  readonly detalleUsuario   = signal<Usuario | null>(null);
  readonly detalleCargando  = signal(false);
  readonly rolesDelUsuario  = signal<string[]>([]);
  readonly cargandoRolesDetalle = signal(false);

  private limpiarBlobs(): void {
    const old = this.fotoBlobs();
    old.forEach(url => URL.revokeObjectURL(url));
    this.fotoBlobs.set(new Map());
  }

  private cargarFotos(): void {
    for (const u of this.usuarios()) {
      if (u.id && u.fotoUrl) {
        this.svc.obtenerFoto(u.uuid).subscribe({
          next: blob => {
            const url = URL.createObjectURL(blob);
            this.fotoBlobs.update(m => { m.set(u.id, url); return new Map(m); });
          }
        });
      }
    }
  }

  getFotoUrl(u: Usuario): string | null {
    return this.fotoBlobs().get(u.id) ?? null;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle.set(false);
    this.rolesDelUsuario.set([]);
  }

  verDetalle(u: Usuario): void {
    this.detalleUsuario.set(u);
    this.mostrarDetalle.set(true);
    this.mostrarModalRoles.set(false);
    this.cargandoRolesDetalle.set(true);
    this.rolesDelUsuario.set([]);

    forkJoin({
      todos: this.rolSvc.listar(),
      asignados: this.rolSvc.listarRolesPorUsuario(u.id)
    }).subscribe({
      next: (res) => {
        const rolesMap = new Map(res.todos.map(r => [r.id, r.nombre]));
        this.rolesDelUsuario.set(
          res.asignados.map((a: any) => rolesMap.get(Number(a.rolId)) || `Rol #${a.rolId}`)
        );
        this.cargandoRolesDetalle.set(false);
      },
      error: () => {
        this.cargandoRolesDetalle.set(false);
      }
    });
  }

  readonly mostrarModalRoles = signal(false);
  readonly rolesDisponibles  = signal<Rol[]>([]);
  readonly rolesAsignados     = signal<number[]>([]);
  readonly usuarioSeleccionado = signal<Usuario | null>(null);
  readonly cargandoRoles      = signal(false);
  readonly filtroRolTipo      = signal<'todos' | 'sistema' | 'custom'>('todos');

  readonly paginaActualRoles   = signal(1);
  readonly itemsPorPaginaRoles = signal(5);

  readonly paginaActual   = signal(1);
  readonly itemsPorPagina = signal(10);

  readonly filtrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    return this.usuarios().filter(u => {
      return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  });

  readonly filtradosPaginados = computed(() => {
    const list = this.filtrados();
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
    return list.slice(inicio, inicio + this.itemsPorPagina());
  });

  readonly totalPaginas = computed(() => {
    return Math.max(1, Math.ceil(this.filtrados().length / this.itemsPorPagina()));
  });

  readonly rolesFiltradosInterno = computed(() => {
    const tipo = this.filtroRolTipo();
    return this.rolesDisponibles().filter(r => {
      const esSist = r.esSistema === true || String(r.esSistema) === 'true' || (r.esSistema as any) === 1;
      if (tipo === 'sistema') return esSist;
      if (tipo === 'custom') return !esSist;
      return true;
    });
  });

  readonly rolesFiltradosPaginadosInterno = computed(() => {
    const list = this.rolesFiltradosInterno();
    const inicio = (this.paginaActualRoles() - 1) * this.itemsPorPaginaRoles();
    return list.slice(inicio, inicio + this.itemsPorPaginaRoles());
  });

  readonly totalPaginasRoles = computed(() => {
    return Math.max(1, Math.ceil(this.rolesFiltradosInterno().length / this.itemsPorPaginaRoles()));
  });

  readonly totalActivos = computed(() =>
    this.usuarios().filter(u => this.esActiva(u)).length
  );

  readonly totalEliminados = computed(() =>
    this.usuarios().filter(u => this.esEliminado(u)).length
  );

  readonly totalInactivos = computed(() =>
    this.usuarios().filter(u => !this.esActiva(u) && !this.esEliminado(u)).length
  );

  readonly textoFiltroEstado = computed(() => {
    const map = { todas: 'Ver Todos', activa: 'Solo Activos', inactiva: 'Solo Inactivos' };
    return map[this.estadoFiltro()] || 'Estados';
  });

  readonly textoFiltroInst = computed(() => {
    const id = this.institucionFiltro();
    if (id === 'todas') return 'Todas las sedes';
    const nombre = this.instituciones().find(i => i.id === id)?.nombre || 'Sede';
    return nombre.length > 20 ? nombre.substring(0, 17) + '...' : nombre;
  });

  setVista(v: 'lista' | 'grilla'): void { this.vistaMode.set(v); }

  readonly form = this.fb.group({
    institucionId: [null as number | null, Validators.required],
    nombre:        ['', Validators.required],
    email:         ['', [Validators.required, Validators.email]],
    contrasena:    ['', Validators.minLength(8)],
    telefono:      [''],
  });

  fotoFile: File | null = null;
  fotoPreview: string | null = null;

  ngOnInit(): void {
    this.cargar();
    this.instSvc.listar().subscribe({ next: (data) => this.instituciones.set(data) });
  }

  cargar(): void {
    this.cargando.set(true);
    const estadoKey = this.estadoFiltro();
    const estadoStr = estadoKey === 'activa' ? 'activo' : (estadoKey === 'inactiva' ? 'inactivo' : null);
    const instId = this.institucionFiltro();
    
    let obs$: Observable<Usuario[]>;
    if (instId !== 'todas' && estadoStr) obs$ = this.svc.listarPorInstitucionYEstado(instId, estadoStr);
    else if (instId !== 'todas') obs$ = this.svc.listarPorInstitucion(instId);
    else if (estadoStr) obs$ = this.svc.listarPorEstado(estadoStr);
    else obs$ = this.svc.listar();

    obs$.subscribe({
      next:  (data) => {
        this.limpiarBlobs();
        this.usuarios.set(data);
        this.cargando.set(false);
        this.paginaActual.set(1);
        this.cargarFotos();
      },
      error: ()     => { this.cargando.set(false); console.error("Error al cargar"); }
    });
  }

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) this.paginaActual.set(nueva);
  }

  seleccionarFiltroEstado(e: 'todas' | 'activa' | 'inactiva'): void {
    this.estadoFiltro.set(e);
    this.dropdownEstadoAbierto.set(false);
    this.cargar();
  }

  seleccionarFiltroInst(id: number | 'todas'): void {
    this.institucionFiltro.set(id);
    this.dropdownInstAbierto.set(false);
    this.cargar();
  }

  seleccionarInstitucionModal(id: number): void {
    this.form.patchValue({ institucionId: id });
    this.dropdownModalAbierto.set(false);
  }

  abrirModal(u?: Usuario): void {
    this.editando.set(u ?? null);
    this.quitarFoto();
    if (u) {
      this.form.patchValue({ institucionId: u.institucionId, nombre: u.nombre, email: u.email, telefono: u.telefono ?? '', contrasena: '' });
      this.form.get('contrasena')?.clearValidators();
      const existing = this.getFotoUrl(u);
      if (existing) {
        this.fotoPreview = existing;
      } else if (u.fotoUrl) {
        this.svc.obtenerFoto(u.uuid).subscribe({
          next: blob => { this.fotoPreview = URL.createObjectURL(blob); }
        });
      }
    } else {
      this.form.reset();
      this.form.get('contrasena')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.form.get('contrasena')?.updateValueAndValidity();
    this.mostrarModal.set(true);
  }

  onFotoSeleccionado(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      this.fotoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.fotoPreview = reader.result as string;
      reader.readAsDataURL(this.fotoFile);
    }
  }

  quitarFoto(): void {
    this.fotoFile = null;
    this.fotoPreview = null;
  }

  campoError(campo: string): string | null {
    const ctrl = this.form.get(campo);
    if (ctrl?.invalid && (ctrl.dirty || ctrl.touched)) {
      if (ctrl.hasError('required')) return 'Este campo es obligatorio';
      if (ctrl.hasError('email')) return 'El formato del correo es inválido';
      if (ctrl.hasError('minlength')) return `Mínimo ${ctrl.getError('minlength').requiredLength} caracteres`;
      if (ctrl.hasError('maxlength')) return `Máximo ${ctrl.getError('maxlength').requiredLength} caracteres`;
      if (ctrl.hasError('pattern')) return 'El formato es inválido';
      if (ctrl.hasError('strongPassword')) return 'La contraseña debe tener mínimo 8 caracteres, mayúsculas, minúsculas y números';
      if (ctrl.hasError('peruPhone')) return 'El teléfono es inválido';
    }
    return null;
  }

  cerrarModal(): void { 
    this.mostrarModal.set(false); 
    this.dropdownModalAbierto.set(false);
    this.quitarFoto();
  }

  guardar(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const editando = this.editando();

    const payload: UsuarioRequest = {
      institucionId: Number(raw.institucionId),
      nombre: raw.nombre ?? '',
      email: raw.email?.trim() ?? '',
      telefono: raw.telefono || '',
      fotoUrl: '',
      contrasena: raw.contrasena || '',
    };

    if (editando && !raw.contrasena) {
      delete (payload as Partial<UsuarioRequest>).contrasena;
    }

    const obs$ = editando 
      ? this.svc.actualizar(editando.uuid, payload) 
      : this.svc.crear(payload);
    
     obs$.subscribe({ 
      next: (user) => {
        if (this.fotoFile) {
          const uuid = user.uuid || editando?.uuid || '';
          this.svc.subirFoto(uuid, this.fotoFile).subscribe({
            next: () => {
              const cu = this.authSvc.currentUser();
              if (cu && cu.uuid === uuid) {
                const updated = { ...cu, fotoUrl: uuid + '/foto' };
                this.authSvc.currentUser.set(updated);
                localStorage.setItem('auth_user', JSON.stringify(updated));
              }
              this.quitarFoto();
              this.cerrarModal();
              this.cargar();
              Swal.fire({ title: '¡Guardado!', text: 'Usuario procesado con éxito.', icon: 'success', timer: 1500, showConfirmButton: false });
            },
            error: () => {
              this.cerrarModal();
              this.cargar();
              Swal.fire({ title: '¡Guardado!', text: 'Usuario guardado pero no se pudo subir la foto.', icon: 'warning', timer: 2000, showConfirmButton: false });
            }
          });
        } else {
          this.quitarFoto();
          this.cerrarModal();
          this.cargar();
          Swal.fire({ title: '¡Guardado!', text: 'Usuario procesado con éxito.', icon: 'success', timer: 1500, showConfirmButton: false });
        }
      },
      error: (err) => { 
        console.error('Error al guardar:', err); 
        const msg = extractAuthError(err);
        Swal.fire('Error', msg, 'error'); 
      }
    });
  }

  toggleEstado(u: Usuario): void {
    const activo = this.esActiva(u);
    Swal.fire({
      title: '¿Cambiar estado?',
      text: `¿Deseas ${activo ? 'desactivar' : 'activar'} a este usuario?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#165EF0',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    }).then((result: SweetAlertResult) => {
      if (result.isConfirmed) {
        const obs$ = activo ? this.svc.desactivar(u.uuid) : this.svc.activar(u.uuid);
        obs$.subscribe({ 
          next: () => {
            this.cargar();
            Swal.fire({ title: '¡Actualizado!', icon: 'success', timer: 1000, showConfirmButton: false });
          },
          error: () => Swal.fire('Error', 'No se pudo cambiar el estado', 'error')
        });
      }
    });
  }

  eliminar(uuid: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "El usuario será marcado como eliminado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: SweetAlertResult) => {
      if (result.isConfirmed) {
        this.svc.eliminar(uuid).subscribe({ 
          next: () => {
            this.cargar();
            Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1000, showConfirmButton: false });
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar', 'error')
        });
      }
    });
  }

  abrirModalRoles(u: Usuario): void {
    this.usuarioSeleccionado.set(u);
    this.mostrarModalRoles.set(true);
    this.mostrarDetalle.set(false);
    this.rolesDisponibles.set([]);
    this.rolesAsignados.set([]);
    this.cargandoRoles.set(true);
    this.paginaActualRoles.set(1);
    this.filtroRolTipo.set('todos');

    forkJoin({
      todos: this.rolSvc.listar(),
      asignados: this.rolSvc.listarRolesPorUsuario(u.id)
    }).subscribe({
      next: (res) => {
        this.rolesDisponibles.set(res.todos);
        this.rolesAsignados.set(res.asignados.map(r => Number(r.rolId)));
        this.cargandoRoles.set(false);
        this.cdr.markForCheck();
        this.appRef.tick();
      },
      error: () => {
        this.cargandoRoles.set(false);
        this.cdr.markForCheck();
        Swal.fire('Error', 'No se pudieron cargar los roles', 'error');
      }
    });
  }

  toggleRol(rolId: number): void {
    const user = this.usuarioSeleccionado();
    if (!user) return;

    const estaAsignado = this.rolesAsignados().includes(rolId);
    const datos = { 
      usuarioId: user.id, 
      rolId,
      asignadoPor: user.id
    };

    const obs$ = estaAsignado 
      ? this.rolSvc.quitarRolAUsuario(user.id, rolId) 
      : this.rolSvc.asignarRolAUsuario(datos);

    obs$.subscribe({
      next: () => {
        if (estaAsignado) {
          this.rolesAsignados.update(list => list.filter(id => id !== rolId));
        } else {
          this.rolesAsignados.update(list => [...list, rolId]);
        }
      },
      error: () => Swal.fire('Error', 'No se pudo actualizar el rol', 'error')
    });
  }

  setFiltroRolTipo(tipo: 'todos' | 'sistema' | 'custom'): void {
    this.filtroRolTipo.set(tipo);
    this.paginaActualRoles.set(1);
    this.cdr.detectChanges();
  }

  cambiarPaginaRoles(delta: number): void {
    const nueva = this.paginaActualRoles() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginasRoles()) {
      this.paginaActualRoles.set(nueva);
      this.cdr.detectChanges();
    }
  }

  esActiva(u: Usuario): boolean { return u.estado?.toLowerCase() === 'activo'; }
  esEliminado(u: Usuario): boolean { return u.estado?.toLowerCase() === 'eliminado' || !!u.eliminadoAt; }
  setBusqueda(e: Event): void { this.busqueda.set((e.target as HTMLInputElement).value); this.paginaActual.set(1); }

  nombreInstitucion(id: number | null | undefined): string {
    if (!id) return '';
    return this.instituciones().find(i => i.id === id)?.nombre ?? `ID ${id}`;
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const parts = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!parts) return fecha;
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
    const dia = parseInt(parts[1], 10);
    const mes = meses[parseInt(parts[2], 10) - 1];
    const anio = parts[3];
    let h = parseInt(parts[4], 10);
    const min = parts[5];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${dia} de ${mes} de ${anio}, ${h}:${min} ${ampm}`;
  }
}
