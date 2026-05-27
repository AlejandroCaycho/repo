import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import Swal from 'sweetalert2';
import { extractAuthError } from '../../core/handlers/auth-error.handler';
import { ConfiguracionInstitucion, ConfiguracionInstitucionRequest, Institucion } from '../../core/interfaces/auth.interface';
import { ConfiguracionService } from '../../core/services/auth/configuracion.service';
import { InstitucionService } from '../../core/services/auth/institucion.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { UsuarioAuthService } from '../../core/services/auth/usuario-auth.service';
import { finalize } from 'rxjs/operators';


type ConfigSection = 'cuenta' | 'institucion' | 'apariencia' | 'seguridad';

@Component({
  selector: 'app-configuraciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './configuraciones.html',
  styleUrl: './configuraciones.scss',
})
export class Configuraciones implements OnInit {
  private readonly svc = inject(ConfiguracionService);
  private readonly institucionSvc = inject(InstitucionService);
  private readonly authSvc = inject(AuthService);
  private readonly usuarioSvc = inject(UsuarioAuthService);
  private readonly fb = inject(FormBuilder);

  readonly configuraciones = signal<ConfiguracionInstitucion[]>([]);
  readonly instituciones = signal<Institucion[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorCarga = signal('');
  readonly editando = signal<ConfiguracionInstitucion | null>(null);
  readonly busqueda = signal('');
  readonly seccion = signal<ConfigSection>('cuenta');
  readonly usuarioActual = this.authSvc.currentUser;
  readonly usuarioInstitucionId = signal<number | null>(null);

  readonly paleta = ['#165EF0', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#0F172A'];

  readonly DIAS_SEMANA = [
    { key: 'LUNES',     label: 'Lu', nombre: 'Lunes' },
    { key: 'MARTES',    label: 'Ma', nombre: 'Martes' },
    { key: 'MIERCOLES', label: 'Mi', nombre: 'Miercoles' },
    { key: 'JUEVES',    label: 'Ju', nombre: 'Jueves' },
    { key: 'VIERNES',   label: 'Vi', nombre: 'Viernes' },
    { key: 'SABADO',    label: 'Sa', nombre: 'Sabado' },
    { key: 'DOMINGO',   label: 'Do', nombre: 'Domingo' },
  ];
  // diasSeleccionados signal removed - now handled through form

  readonly isSuperAdmin = computed(() => {
    const rol = this.usuarioActual()?.rol?.toUpperCase();
    return rol === 'ADMINISTRADOR_SISTEMA' || rol === 'SUPERADMIN';
  });

  readonly miInstitucionId = computed(() => {
    const id = this.usuarioInstitucionId() || this.usuarioActual()?.institucionId || null;
    return id ? Number(id) : null;
  });

  readonly institucionesDisponibles = computed(() => {
    if (this.isSuperAdmin()) return this.instituciones();
    const myId = this.miInstitucionId();
    return myId ? this.instituciones().filter(i => Number(i.id) === myId) : [];
  });

  readonly configuracionesDisponibles = computed(() => {
    if (this.isSuperAdmin()) return this.configuraciones();
    const myId = this.miInstitucionId();
    return myId ? this.configuraciones().filter(c => Number(c.institucionId) === myId) : [];
  });

  readonly filtradas = computed(() => {
    const list = this.configuracionesDisponibles();
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return list;
    return list.filter(c =>
      String(c.institucionId).includes(q) ||
      this.nombreInstitucion(c.institucionId).toLowerCase().includes(q) ||
      (c.moneda ?? '').toLowerCase().includes(q) ||
      (c.zonaHoraria ?? '').toLowerCase().includes(q)
    );
  });

  readonly seleccionada = computed(() => this.editando());
  
  institucionSeleccionada(): Institucion | null {
    const id = this.institucionActivaId();
    return id ? (this.instituciones().find(i => Number(i.id) === Number(id)) ?? null) : null;
  }

   formularioInvalido(): boolean {
     return this.form.invalid;
   }

  readonly configuracionesActivas = computed(() =>
    this.configuraciones().filter(c => c.permitirRegistroPadres).length
  );

  readonly notificacionesActivas = computed(() =>
    this.configuraciones().filter(c => c.notificacionInasistencia || c.notificacionCalificacionBaja).length
  );

  inicialesInstitucion(): string {
    const nombre = this.institucionSeleccionada()?.nombre ?? '';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('');
  }

  readonly form = this.fb.group({
    institucionId: [null as number | null, Validators.required],
    escalaCalificacionId: [null as number | null, [Validators.min(1)]],
    temaColorPrimario: [''],
    temaColorSecundario: [''],
    logoUrl: [''],
    mantenerRegistrosAnos: [null as number | null, [Validators.min(1), Validators.max(50)]],
    permitirRegistroPadres: [null as boolean | null],
    padresVenCalificaciones: [null as boolean | null],
    padresVenAsistencia: [null as boolean | null],
    padresVenTareas: [null as boolean | null],
    notificacionInasistencia: [null as boolean | null],
    notificacionCalificacionBaja: [null as boolean | null],
    umbralCalificacionBaja: [null as number | null, [Validators.min(0), Validators.max(20)]],
    horarioInicioClases: [''],
    horarioFinClases: [''],
    diasLaborables: [''],
    idiomaPrincipal: ['es'],
    zonaHoraria: ['America/Lima'],
    moneda: ['PEN'],
  });

  ngOnInit(): void {
    this.cargar();
    this.cargarInstituciones();
    this.cargarUsuarioActual();
  }

  cargar(seleccionarInstitucionId?: number): void {
    this.cargando.set(true);
    this.svc.listar().subscribe({
      next: data => {
        this.errorCarga.set('');
        this.configuraciones.set(data);
        const userInstId = Number(this.usuarioInstitucionId() || this.usuarioActual()?.institucionId);
        
        if (userInstId && !data.find(c => Number(c.institucionId) === userInstId)) {
          this.crearConfiguracionBase(userInstId);
        }

        const seleccion = seleccionarInstitucionId
          ? data.find(c => Number(c.institucionId) === Number(seleccionarInstitucionId))
          : this.editando()
            ? data.find(c => Number(c.institucionId) === Number(this.editando()?.institucionId))
            : (userInstId ? data.find(c => Number(c.institucionId) === userInstId) : null) || data[0];

        if (seleccion) {
          this.seleccionarConfiguracion(seleccion);
        } else if (!data.length) {
          this.seleccionarConfiguracion(null);
        }
        this.sincronizarCuenta();
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set('No se pudo cargar configuraciones');
        this.configuraciones.set([]);
        this.cargando.set(false);
      },
    });
  }

  cargarInstituciones(): void {
    const obs$ = this.isSuperAdmin() ? this.institucionSvc.listarTodas() : this.institucionSvc.listar();
    obs$.subscribe({
      next: data => {
        this.errorCarga.set('');
        this.instituciones.set(data);
        this.sincronizarCuenta();
      },
      error: () => {
        const fallback$ = this.isSuperAdmin() ? this.institucionSvc.listar() : this.institucionSvc.listarTodas();
        fallback$.subscribe({
          next: data => {
            this.errorCarga.set('');
            this.instituciones.set(data);
            this.sincronizarCuenta();
          },
          error: () => {
            this.instituciones.set([]);
            if (!this.configuraciones().length) {
              this.errorCarga.set('No se pudo cargar instituciones');
            }
          }
        });
      },
    });
  }

  abrirModal(config?: ConfiguracionInstitucion): void {
    this.seleccionarConfiguracion(config);
  }

   seleccionarConfiguracion(config?: ConfiguracionInstitucion | null): void {
     this.editando.set(config ?? null);
     this.form.reset({
       institucionId: config?.institucionId ?? null,
       escalaCalificacionId: config?.escalaCalificacionId ?? null,
       temaColorPrimario: config?.temaColorPrimario ?? '',
       temaColorSecundario: config?.temaColorSecundario ?? '',
       logoUrl: config?.logoUrl ?? '',
       mantenerRegistrosAnos: config?.mantenerRegistrosAnos ?? null,
       permitirRegistroPadres: config?.permitirRegistroPadres ?? null,
       padresVenCalificaciones: config?.padresVenCalificaciones ?? null,
       padresVenAsistencia: config?.padresVenAsistencia ?? null,
       padresVenTareas: config?.padresVenTareas ?? null,
       notificacionInasistencia: config?.notificacionInasistencia ?? null,
       notificacionCalificacionBaja: config?.notificacionCalificacionBaja ?? null,
       umbralCalificacionBaja: config?.umbralCalificacionBaja ?? null,
       horarioInicioClases: this.parseHora(config?.horarioInicioClases),
       horarioFinClases: this.parseHora(config?.horarioFinClases),
       diasLaborables: config?.diasLaborables ?? '',
       idiomaPrincipal: config?.idiomaPrincipal ?? '',
       zonaHoraria: config?.zonaHoraria ?? '',
       moneda: config?.moneda ?? '',
     });
   }

  cargarUsuarioActual(): void {
    const usuario = this.usuarioActual();
    if (!usuario?.id && !usuario?.email) return;

    this.usuarioSvc.listar().subscribe({
      next: usuarios => {
        const actual = usuarios.find(u => 
          (u.id && usuario.id && Number(u.id) === Number(usuario.id)) || 
          (u.email && usuario.email && u.email.toLowerCase().trim() === usuario.email.toLowerCase().trim())
        );
        const instId = actual?.institucionId ?? usuario.institucionId ?? null;
        this.usuarioInstitucionId.set(instId ? Number(instId) : null);
        this.sincronizarCuenta();
      },
      error: () => {
        const instId = usuario.institucionId ?? null;
        this.usuarioInstitucionId.set(instId ? Number(instId) : null);
        this.sincronizarCuenta();
      },
    });
  }

   private limpiarConfiguracionTecnica(institucionId: number | null): void {
     this.editando.set(null);
     this.form.reset({
       institucionId,
       escalaCalificacionId: null,
       temaColorPrimario: '',
       temaColorSecundario: '',
       logoUrl: '',
       mantenerRegistrosAnos: null,
       permitirRegistroPadres: null,
       padresVenCalificaciones: null,
       padresVenAsistencia: null,
       padresVenTareas: null,
       notificacionInasistencia: null,
       notificacionCalificacionBaja: null,
       umbralCalificacionBaja: null,
       horarioInicioClases: '',
       horarioFinClases: '',
       diasLaborables: '',
       idiomaPrincipal: '',
       zonaHoraria: '',
       moneda: '',
     });
   }

  crearNuevaConfiguracion(): void {
    const usadas = new Set(this.configuraciones().map(c => c.institucionId));
    const libre = this.instituciones().find(i => !usadas.has(i.id)) ?? this.instituciones()[0];
    if (!libre) {
      Swal.fire('Sin instituciones', 'Primero registra una institucion.', 'info');
      return;
    }
    if (usadas.has(libre.id)) {
      Swal.fire('Configuracion existente', 'Todas las instituciones ya tienen configuracion.', 'info');
      return;
    }
    this.seleccionarConfiguracion(null);
    this.limpiarConfiguracionTecnica(libre.id);
    this.seccion.set('institucion');
  }

  private crearConfiguracionBase(institucionId: number): void {
    const payload: ConfiguracionInstitucionRequest = {
      institucionId,
      idiomaPrincipal: 'es',
      zonaHoraria: 'America/Lima',
      moneda: 'PEN'
    };
    this.svc.crear(payload).subscribe({
      next: () => this.cargar(institucionId)
    });
  }

   seleccionarInstitucionDesdeFormulario(): void {
     const institucionId = Number(this.form.get('institucionId')?.value);
     if (!institucionId) return;

     this.limpiarConfiguracionTecnica(institucionId);
   }

   seleccionarInstitucionCuenta(): void {
     const institucionId = Number(this.form.get('institucionId')?.value);
     if (!institucionId) return;

     const config = this.configuraciones().find(c => Number(c.institucionId) === Number(institucionId));
     this.form.patchValue({
       idiomaPrincipal: config?.idiomaPrincipal || 'es',
       zonaHoraria: config?.zonaHoraria || 'America/Lima',
       moneda: config?.moneda || 'PEN',
     });
   }

  setSeccion(seccion: ConfigSection): void {
    this.seccion.set(seccion);
  }

  seleccionarColor(color: string): void {
    this.form.patchValue({ temaColorPrimario: color });
  }

  toggle(control: keyof ConfiguracionInstitucionRequest): void {
    const current = this.form.get(control as string)?.value;
    this.form.patchValue({ [control]: !current });
  }

  descartar(): void {
    if (this.seccion() === 'cuenta') {
      this.sincronizarCuenta();
      return;
    }
    this.seleccionarConfiguracion(this.editando());
  }

  onButtonClick(): void {
    if (this.seccion() === 'cuenta') {
      this.setSeccion('institucion');
    } else if (this.seccion() === 'institucion') {
      this.setSeccion('apariencia');
    } else if (this.seccion() === 'apariencia') {
      this.setSeccion('seguridad');
    } else if (this.seccion() === 'seguridad') {
      this.guardar();
    }
  }

   guardar(): void {
     if (this.form.invalid || this.guardando()) {
       this.form.markAllAsTouched();
       return;
     }
     const raw = this.form.getRawValue();
     const payload: ConfiguracionInstitucionRequest = {
       institucionId: Number(raw.institucionId),
       escalaCalificacionId: raw.escalaCalificacionId ?? undefined,
       temaColorPrimario: this.valorTexto(raw.temaColorPrimario),
       temaColorSecundario: this.valorTexto(raw.temaColorSecundario),
       logoUrl: this.valorTexto(raw.logoUrl),
       mantenerRegistrosAnos: raw.mantenerRegistrosAnos ?? undefined,
       permitirRegistroPadres: raw.permitirRegistroPadres ?? undefined,
       padresVenCalificaciones: raw.padresVenCalificaciones ?? undefined,
       padresVenAsistencia: raw.padresVenAsistencia ?? undefined,
       padresVenTareas: raw.padresVenTareas ?? undefined,
       notificacionInasistencia: raw.notificacionInasistencia ?? undefined,
       notificacionCalificacionBaja: raw.notificacionCalificacionBaja ?? undefined,
       umbralCalificacionBaja: raw.umbralCalificacionBaja ?? undefined,
       horarioInicioClases: this.formatHora(raw.horarioInicioClases),
       horarioFinClases: this.formatHora(raw.horarioFinClases),
        diasLaborables: raw.diasLaborables ?? '',
       idiomaPrincipal: this.valorTexto(raw.idiomaPrincipal),
       zonaHoraria: this.valorTexto(raw.zonaHoraria),
       moneda: this.valorTexto(raw.moneda),
     };

     const existente = this.configuraciones().find(c => Number(c.institucionId) === Number(payload.institucionId));
     let finalPayload: ConfiguracionInstitucionRequest;
     if (existente) {
       finalPayload = { ...existente, ...payload };
     } else {
       finalPayload = payload;
     }

     const obs$ = existente
       ? this.svc.actualizar(existente.institucionId, finalPayload)
       : this.svc.crear(finalPayload);

     this.guardando.set(true);
     obs$
       .pipe(finalize(() => this.guardando.set(false)))
       .subscribe({
         next: saved => {
           this.cargar(saved.institucionId);
           Swal.fire({ icon: 'success', title: 'Guardado', timer: 1400, showConfirmButton: false });
         },
         error: err => {
           Swal.fire('Error', extractAuthError(err), 'error');
         },
       });
   }

  eliminar(config: ConfiguracionInstitucion): void {
    Swal.fire({
      title: 'Eliminar configuracion',
      text: this.nombreInstitucion(config.institucionId),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.svc.eliminar(config.institucionId).subscribe({
        next: () => {
          this.cargar();
          Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
        },
        error: err => Swal.fire('Error', extractAuthError(err), 'error'),
      });
    });
  }

  setBusqueda(e: Event): void {
    this.busqueda.set((e.target as HTMLInputElement).value);
  }

  nombreInstitucion(id: number | null | undefined): string {
    if (!id) return '';
    return this.instituciones().find(i => Number(i.id) === Number(id))?.nombre ?? '';
  }



  detalleInstitucion(id: number | null | undefined): string {
    const institucion = this.instituciones().find(i => Number(i.id) === Number(id));
    if (!institucion) return '';
    return [institucion.codigoModular, institucion.ciudad, institucion.departamento]
      .filter(Boolean)
      .join(' - ');
  }
 
   estadoInstitucion(id: number | null | undefined): string {
    const institucion = this.instituciones().find(i => Number(i.id) === Number(id));
    if (!institucion) return '';
    return institucion.activa ? 'Activa' : 'Inactiva';
  }

   institucionActivaId(): number | null {
     return this.form.get('institucionId')?.value ?? null;
   }

   private sincronizarCuenta(): void {
     if (!this.instituciones().length) return;

     const idActual = this.form.get('institucionId')?.value;
     const usuario = this.usuarioActual();
     const institucionUsuarioId = Number(this.usuarioInstitucionId() || usuario?.institucionId) || null;
     const institucionUsuario = institucionUsuarioId
       ? this.instituciones().find(i => Number(i.id) === institucionUsuarioId)
       : this.instituciones().find(i => {
           const uInst = usuario?.institucion?.toLowerCase().trim() || '';
           const iNombre = i.nombre?.toLowerCase().trim() || '';
           return uInst && (iNombre === uInst || iNombre.includes(uInst));
         });
     const institucionId = institucionUsuario?.id || (idActual ? Number(idActual) : null) || this.instituciones()[0]?.id || null;
     const config = this.configuraciones().find(c => Number(c.institucionId) === Number(institucionId));

     // Solo actualizar si no estamos editando una configuración existente
     if (!this.editando()) {
       this.form.patchValue({
         institucionId,
         idiomaPrincipal: config?.idiomaPrincipal || this.form.get('idiomaPrincipal')?.value || 'es',
         zonaHoraria: config?.zonaHoraria || this.form.get('zonaHoraria')?.value || 'America/Lima',
         moneda: config?.moneda || this.form.get('moneda')?.value || 'PEN',
       });
     }

     if (!this.editando() && this.configuraciones().length) {
       const matchingConfig = this.configuraciones().find(c => Number(c.institucionId) === Number(institucionId));
       if (matchingConfig) {
         this.seleccionarConfiguracion(matchingConfig);
       }
     }

     if (!this.form.get('institucionId')?.value && this.seccion() !== 'cuenta') {
       this.limpiarConfiguracionTecnica(null);
     }
   }

  private valorTexto(value: string | null | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

   toggleDia(dia: string): void {
     const diasLaborables = this.form.get('diasLaborables')?.value || '';
     const diasArray = diasLaborables ? diasLaborables.split(',').map(d => d.trim().toUpperCase()).filter(Boolean) : [];
     const index = diasArray.indexOf(dia);
     if (index >= 0) {
       // Remove the day
       diasArray.splice(index, 1);
     } else {
       // Add the day and sort according to DIAS_SEMANA order
       const orden = this.DIAS_SEMANA.map(d => d.key);
       diasArray.push(dia);
       diasArray.sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
     }
     this.form.patchValue({ diasLaborables: diasArray.join(',') });
   }

   isDiaSeleccionado(dia: string): boolean {
     const diasLaborables = this.form.get('diasLaborables')?.value || '';
     const diasArray = diasLaborables ? diasLaborables.split(',').map(d => d.trim().toUpperCase()).filter(Boolean) : [];
     return diasArray.includes(dia);
   }

  private parseHora(valor: string | null | undefined): string {
    // El backend devuelve "HH:mm:ss", el input[type=time] necesita "HH:mm"
    if (!valor) return '';
    return valor.length >= 5 ? valor.substring(0, 5) : valor;
  }

  private formatHora(valor: string | null | undefined): string | undefined {
    // El input[type=time] devuelve "HH:mm", el backend necesita "HH:mm:ss"
    const h = valor?.trim();
    if (!h) return undefined;
    return h.length === 5 ? `${h}:00` : h;
  }
}
