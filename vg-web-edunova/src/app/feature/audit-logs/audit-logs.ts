import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText, Trash, Activity, Users, Database, Calendar, Clock, User } from 'lucide-angular';
import Swal from 'sweetalert2';
import { extractAuthError } from '../../core/handlers/auth-error.handler';
import { AuditLog } from '../../core/interfaces/auth.interface';
import { AuditLogService } from '../../core/services/auth/audit-log.service';
import { UsuarioAuthService } from '../../core/services/auth/usuario-auth.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.scss',
})
export class AuditLogs implements OnInit {
  private readonly svc = inject(AuditLogService);
  private readonly usuarioSvc = inject(UsuarioAuthService);

  readonly FileText = FileText;
  readonly Trash = Trash;
  readonly Activity = Activity;
  readonly Users = Users;
  readonly Database = Database;
  readonly Calendar = Calendar;

  readonly Clock = Clock;
  readonly User = User;

  readonly logs = signal<AuditLog[]>([]);
  readonly cargando = signal(false);
  readonly busqueda = signal('');
  readonly accionFiltro = signal<string | null>(null);
  readonly tablaFiltro = signal<string | null>(null);
  readonly dropdownAccionAbierto = signal(false);
  readonly dropdownTablaAbierto = signal(false);
  readonly mapaUsuarios = signal<Map<number, string>>(new Map());
  readonly cargaUsuariosExitosa = signal(false);

  readonly paginaActual   = signal(1);
  readonly itemsPorPagina = signal(10);

  readonly accionesUnicas = computed(() => 6);

  readonly textoFiltro = computed(() => {
    const a = this.accionFiltro();
    return a ?? 'Todas las acciones';
  });

  readonly textosFiltroTabla = computed(() => {
    const t = this.tablaFiltro();
    return t ?? 'Todos los módulos';
  });

  readonly tablasUnicas = computed(() => {
    const set = new Set(this.logs().map(l => l.tabla));
    return Array.from(set).sort();
  });

  readonly tablasAfectadas = computed(() => this.tablasUnicas().length);

  readonly iconoTabla = (tabla: string): string => {
    const t = tabla.toUpperCase();
    if (t === 'PERMISOS') return 'key';
    if (t === 'ROLES') return 'shield';
    if (t === 'USUARIOS') return 'users';
    if (t === 'AULA') return 'book-open';
    if (t === 'GRUPO') return 'layers';
    if (t === 'ALUMNO') return 'user';
    return 'file-text';
  };

  readonly usuariosInvolucrados = computed(() => {
    const set = new Set(this.logs().map(l => l.usuarioId).filter(id => id != null));
    return set.size;
  });

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const acc = this.accionFiltro();
    const tab = this.tablaFiltro();
    let list = this.logs();
    if (acc) list = list.filter(l => l.accion === acc);
    if (tab) list = list.filter(l => l.tabla === tab);
    if (!q) return list;
    return list.filter(log => {
      const nombre = log.usuarioId != null ? (this.mapaUsuarios().get(log.usuarioId) ?? '') : '';
      return (
        log.accion.toLowerCase().includes(q) ||
        log.tabla.toLowerCase().includes(q) ||
        String(log.usuarioId ?? '').includes(q) ||
        String(log.registroId ?? '').includes(q) ||
        nombre.toLowerCase().includes(q)
      );
    });
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtrados().length / this.itemsPorPagina()))
  );

  readonly filtradosPaginados = computed(() => {
    const list = this.filtrados();
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
    return list.slice(inicio, inicio + this.itemsPorPagina());
  });

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargar();
  }

  private cargarUsuarios(): void {
    this.usuarioSvc.listar().subscribe({
      next: usuarios => {
        const map = new Map<number, string>();
        usuarios.forEach(u => map.set(u.id, u.nombre));
        this.mapaUsuarios.set(map);
        this.cargaUsuariosExitosa.set(true);
      },
      error: () => {
        this.cargaUsuariosExitosa.set(true);
      },
    });
  }

  obtenerNombreUsuario(usuarioId: number | null | undefined): string {
    if (usuarioId == null) return '-';
    return this.mapaUsuarios().get(usuarioId) ?? `ID ${usuarioId}`;
  }

  iconoAccion(accion: string): string {
    const a = accion.toUpperCase();
    if (a === 'LOGIN') return 'log-in';
    if (a === 'LOGIN_FAILED') return 'alert-triangle';
    if (a === 'INSERT' || a === 'CREATE' || a === 'CREAR') return 'plus-circle';
    if (a === 'UPDATE' || a === 'EDITAR' || a === 'EDIT') return 'pencil';
    if (a === 'DELETE' || a === 'ELIMINAR') return 'trash-2';
    return 'list-checks';
  }

  claseAccion(accion: string): string {
    const a = accion.toUpperCase();
    if (a === 'CREAR' || a === 'CREATE') return 'accion-badge accion-badge--crear';
    if (a === 'EDITAR' || a === 'UPDATE' || a === 'EDIT') return 'accion-badge accion-badge--editar';
    if (a === 'ELIMINAR' || a === 'DELETE') return 'accion-badge accion-badge--eliminar';
    if (a === 'VER' || a === 'VIEW') return 'accion-badge accion-badge--ver';
    return 'accion-badge accion-badge--default';
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '-';
    if (/^\d{2}\/\d{2}\/\d{4}/.test(fecha)) return fecha;
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return fecha;
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      const hora = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${anio} ${hora}:${min}`;
    } catch {
      return fecha;
    }
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.listarTodos().subscribe({
      next: data => {
        this.logs.set(data);
        this.cargando.set(false);
        this.paginaActual.set(1);
      },
      error: () => {
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudieron cargar los audit logs', 'error');
      },
    });
  }

  eliminar(log: AuditLog): void {
    Swal.fire({
      title: 'Eliminar registro de auditoría',
      html: `¿Eliminar el evento <strong>#${log.id}</strong> de <strong>${this.obtenerNombreUsuario(log.usuarioId)}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.svc.eliminar(log.id).subscribe({
        next: () => {
          this.cargar();
          Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
        },
        error: err => Swal.fire('Error', extractAuthError(err), 'error'),
      });
    });
  }

  setFiltroAccion(accion: string | null): void {
    this.accionFiltro.set(accion);
    this.dropdownAccionAbierto.set(false);
    this.paginaActual.set(1);
  }

  setFiltroTabla(tabla: string | null): void {
    this.tablaFiltro.set(tabla);
    this.dropdownTablaAbierto.set(false);
    this.paginaActual.set(1);
  }

  setBusqueda(e: Event): void {
    this.busqueda.set((e.target as HTMLInputElement).value);
    this.paginaActual.set(1);
  }

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) this.paginaActual.set(nueva);
  }
}
