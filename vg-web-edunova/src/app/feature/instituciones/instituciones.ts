import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule, Building, Search, LayoutGrid, List, Edit, Power, Trash, MapPin, RotateCcw } from 'lucide-angular';
import { Observable } from 'rxjs';
import { InstitucionService } from '../../core/services/auth/institucion.service';
import { Institucion, InstitucionRequest } from '../../core/interfaces/auth.interface';
import Swal from 'sweetalert2';
import { extractAuthError } from '../../core/handlers/auth-error.handler';
import { httpsUrl, peruCodigoModular, peruCodigoPostal, peruPhone, strictEmail, strictText } from '../../shared/strict-form.validators';

type VistaMode = 'lista' | 'grilla';

@Component({
  selector: 'app-instituciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './instituciones.html',
  styleUrl: './instituciones.scss'
})
export class Instituciones implements OnInit {
  private readonly svc = inject(InstitucionService);
  private readonly fb  = inject(FormBuilder);

  readonly instituciones  = signal<Institucion[]>([]);
  readonly cargando       = signal(false);
  readonly mostrarModal   = signal(false);
  readonly modalCargando  = signal(false);
  readonly mostrarDetalle = signal(false);
  readonly detalleCargando = signal(false);
  readonly detalle        = signal<any>(null);
  readonly editando       = signal<Institucion | null>(null);
  readonly busqueda       = signal('');
  readonly estadoFiltro   = signal<'todas' | 'estado_activa' | 'estado_inactiva'>('todas');
  readonly vistaMode      = signal<VistaMode>('lista');
  readonly dropdownAbierto = signal(false);
  readonly formDropdownAbierto = signal(false);
  
  readonly paginaActual   = signal(1);
  readonly itemsPorPagina = signal(10);

  toggleDropdown(): void {
    this.dropdownAbierto.update(v => !v);
  }

  seleccionarFiltro(estado: 'todas' | 'estado_activa' | 'estado_inactiva'): void {
    this.setFiltroEstado(estado);
    this.dropdownAbierto.set(false);
  }

  seleccionarTipo(tipo: string): void {
    this.form.patchValue({ tipoInstitucion: tipo });
    this.formDropdownAbierto.set(false);
  }

  readonly textoTipo = computed(() => {
    const val = (this.form.get('tipoInstitucion')?.value || 'PUBLICA') as string;
    const map: Record<string, string> = {
      'PUBLICA': 'Pública',
      'PRIVADA': 'Privada',
      'CONCERTADA': 'Concertada'
    };
    return map[val] || 'Seleccionar...';
  });

  readonly textoFiltro = computed(() => {
    const map: Record<string, string> = {
      'todas': 'Todas las sedes',
      'estado_activa': 'Solo Activas',
      'estado_inactiva': 'Solo Inactivas'
    };
    return map[this.estadoFiltro()] || 'Filtros';
  });

  readonly filtradas = computed(() => {
    const q = this.busqueda().toLowerCase();
    return this.instituciones()
      .filter(i => {
        return i.nombre.toLowerCase().includes(q) ||
          (i.codigoModular ?? '').toLowerCase().includes(q) ||
          (i.ciudad ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  readonly filtradasPaginadas = computed(() => {
    const list = this.filtradas();
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina();
    return list.slice(inicio, inicio + this.itemsPorPagina());
  });

  readonly filasRelleno = computed(() => {
    const len = this.filtradasPaginadas().length;
    if (len >= this.itemsPorPagina() || this.filtradas().length === 0) return [];
    return Array(Math.max(0, this.itemsPorPagina() - len));
  });

  readonly totalPaginas = computed(() => {
    return Math.max(1, Math.ceil(this.filtradas().length / this.itemsPorPagina()));
  });

  cambiarPagina(delta: number): void {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) {
      this.paginaActual.set(nueva);
    }
  }

  readonly totalActivas = computed(() =>
    this.instituciones().filter(i => this.esActiva(i)).length
  );

  readonly form = this.fb.group({
    nombre:              ['', [strictText({ min: 3, max: 120, pattern: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.'-]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.'-]+)*$/ })]],
    nombreCorto:         ['', [strictText({ allowEmpty: true, min: 2, max: 20, pattern: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.-]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9.-]+)*$/ })]],
    email:               ['', strictEmail(true)],
    emailSecundario:     ['', strictEmail(true)],
    telefono:            ['', peruPhone({ allowLandline: false })],
    telefonoSecundario:  ['', peruPhone({ allowLandline: false })],
    sitioWeb:            ['', httpsUrl(true)],
    direccion:           ['', strictText({ allowEmpty: true, min: 5, max: 160 })],
    ciudad:              ['', strictText({ allowEmpty: true, min: 2, max: 60, pattern: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.-]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ.-]+)*$/ })],
    departamento:        ['', strictText({ allowEmpty: true, min: 2, max: 60, pattern: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.-]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ.-]+)*$/ })],
    pais:                ['', strictText({ allowEmpty: true, min: 4, max: 40, pattern: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/ })],
    codigoPostal:        ['', peruCodigoPostal()],
    logoUrl:             ['', httpsUrl(true)],
    tipoInstitucion:     ['PUBLICA'],
    codigoModular:       ['', peruCodigoModular()],
    resolucionCreacion:  ['', strictText({ allowEmpty: true, min: 3, max: 60, pattern: /^[A-Za-z0-9-]+$/ })],
  });

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando.set(true);
    const estado = this.estadoFiltro();
    let obs$: Observable<Institucion[]>;

    if (estado === 'estado_activa') {
      obs$ = this.svc.listarPorEstado('ACTIVA');
    } else if (estado === 'estado_inactiva') {
      obs$ = this.svc.listarPorEstado('INACTIVA');
    } else {
      obs$ = this.svc.listarTodas();
    }

    obs$.subscribe({
      next:  (data) => { this.instituciones.set(data); this.cargando.set(false); },
      error: (err)  => { console.error('Error al cargar:', err); this.cargando.set(false); }
    });
  }

  abrirModal(inst?: Institucion): void {
    if (inst) {
      this.modalCargando.set(true);
      this.svc.obtenerPorUuid(inst.uuid).subscribe({
        next: (fullInst: any) => {
          this.editando.set(fullInst);
          this.form.patchValue({
            nombre:             fullInst.nombre ?? '',
            nombreCorto:        fullInst.nombreCorto ?? fullInst.nombre_corto ?? '',
            email:              fullInst.email ?? '',
            emailSecundario:    fullInst.emailSecundario ?? fullInst.email_secundario ?? fullInst.email_2 ?? '',
            telefono:           fullInst.telefono ?? '',
            telefonoSecundario: fullInst.telefonoSecundario ?? fullInst.telefono_secundario ?? fullInst.telefono2 ?? '',
            sitioWeb:           fullInst.sitioWeb ?? fullInst.sitio_web ?? fullInst.website ?? '',
            direccion:          fullInst.direccion ?? '',
            ciudad:             fullInst.ciudad ?? '',
            departamento:       fullInst.departamento ?? '',
            pais:               fullInst.pais ?? '',
            codigoPostal:       fullInst.codigoPostal ?? fullInst.codigo_postal ?? fullInst.zipCode ?? fullInst.zip ?? '',
            logoUrl:            fullInst.logoUrl ?? fullInst.logo_url ?? '',
            tipoInstitucion:    fullInst.tipoInstitucion ?? fullInst.tipo_institucion ?? 'PUBLICA',
            codigoModular:      fullInst.codigoModular ?? fullInst.codigo_modular ?? fullInst.modular ?? '',
            resolucionCreacion: fullInst.resolucionCreacion ?? fullInst.resolucion_creacion ?? fullInst.resolucion ?? '',
          });
          this.modalCargando.set(false);
          this.mostrarModal.set(true);
        },
        error: (err) => {
          console.error('Error al obtener detalle:', err);
          this.modalCargando.set(false);
          Swal.fire('Error', extractAuthError(err), 'error');
        }
      });
    } else {
      this.editando.set(null);
      this.form.reset({ tipoInstitucion: 'PUBLICA' });
      this.mostrarModal.set(true);
    }
  }

  verDetalle(inst: Institucion): void {
    this.detalleCargando.set(true);
    this.svc.obtenerPorUuid(inst.uuid).subscribe({
      next: (fullInst: any) => {
        this.detalle.set(fullInst);
        this.detalleCargando.set(false);
        this.mostrarDetalle.set(true);
      },
      error: (err) => {
        console.error('Error al obtener detalle:', err);
        this.detalleCargando.set(false);
        Swal.fire('Error', extractAuthError(err), 'error');
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
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const datos = Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    ) as unknown as InstitucionRequest;
    const editando = this.editando();
    const obs$ = editando
      ? this.svc.actualizar(editando.uuid, datos)
      : this.svc.crear(datos);
    obs$.subscribe({
      next: (res: any) => { 
        this.cerrarModal(); 
        if (editando) {
          this.instituciones.update(list => list.map(i => i.uuid === editando.uuid ? { ...i, ...res } : i));
        } else {
          this.cargar();
        }
        Swal.fire({
          title: '¡Guardado!',
          text: `La institución ha sido ${editando ? 'actualizada' : 'registrada'} exitosamente.`,
          icon: 'success',
          confirmButtonColor: '#165EF0',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => { 
        console.error('Error al guardar:', err); 
        Swal.fire('Error', extractAuthError(err), 'error');
      }
    });
  }

  toggleEstado(inst: Institucion): void {
    const activa = this.esActiva(inst);
    
    Swal.fire({
      title: '¿Estás seguro?',
      text: activa ? '¿Deseas desactivar esta institución?' : '¿Deseas activar esta institución?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#165EF0',
      cancelButtonColor: '#475569',
      confirmButtonText: activa ? 'Sí, desactivar' : 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        const obs$ = activa ? this.svc.desactivar(inst.uuid) : this.svc.activar(inst.uuid);
        obs$.subscribe({
          next: () => {
            this.instituciones.update(list => list.map(i =>
              i.uuid === inst.uuid ? { ...i, activa: !activa, estado: activa ? 'INACTIVO' : 'ACTIVO' } : i
            ));
            Swal.fire({
              title: '¡Actualizado!',
              text: `La institución fue ${activa ? 'desactivada' : 'activada'}.`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => { 
            console.error('Error al cambiar estado:', err); 
            Swal.fire('Error', extractAuthError(err), 'error');
          }
        });
      }
    });
  }

  eliminar(uuid: string): void {
    if (!uuid) return;
    
    Swal.fire({
      title: '¿Estás completamente seguro?',
      text: "¡No podrás revertir esta acción! La institución será eliminada.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.svc.eliminar(uuid).subscribe({
          next: () => {
            this.instituciones.update(list => list.filter(i => i.uuid !== uuid));
            if (this.filtradasPaginadas().length === 1 && this.paginaActual() > 1) {
              this.paginaActual.update(p => p - 1);
            }
            Swal.fire({
              title: '¡Eliminada!',
              text: 'La institución ha sido eliminada.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => { 
            console.error('Error al eliminar:', err); 
            Swal.fire('Error', extractAuthError(err), 'error');
          }
        });
      }
    });
  }

  esActiva(inst: Institucion): boolean {
    if (inst.estado) return inst.estado.toUpperCase() === 'ACTIVO';
    return inst.activa ?? false;
  }

  esEliminado(inst: Institucion): boolean {
    if (inst.estado) return inst.estado.toUpperCase() === 'ELIMINADO';
    return !!inst.eliminadoAt;
  }

  setFiltroEstado(estado: 'todas' | 'estado_activa' | 'estado_inactiva'): void {
    this.estadoFiltro.set(estado);
    this.paginaActual.set(1);
    this.cargar();
  }

  setVista(v: VistaMode): void { this.vistaMode.set(v); }
  setBusqueda(e: Event): void { this.busqueda.set((e.target as HTMLInputElement).value); }

  campoError(nombre: string): string {
    const control = this.form.get(nombre);
    if (!control || !(control.dirty || control.touched) || !control.errors) return '';
    const errors = control.errors;
    if (errors['required']) return 'Campo obligatorio.';
    if (errors['minlength']) return `Minimo ${errors['minlength'].requiredLength} caracteres.`;
    if (errors['maxlength']) return `Maximo ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['email']) return 'Correo invalido.';
    if (errors['telefonoPeru']) return 'Debe empezar con 9 y tener exactamente 9 dígitos.';
    if (errors['codigoModularPeru']) return 'Codigo modular peruano invalido. Debe tener 7 digitos.';
    if (errors['codigoPostalPeru']) return 'Codigo postal peruano invalido. Debe tener 5 digitos.';
    if (errors['httpsUrl']) return 'Debe ser una URL https valida.';
    if (errors['espaciosBorde']) return 'No debe iniciar ni terminar con espacios.';
    if (errors['espaciosDobles']) return 'No uses espacios dobles.';
    if (errors['pattern']) return 'Formato no permitido.';
    return 'Valor invalido.';
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

  soloNumeros(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '');
    this.form.get(controlName)?.setValue(value, { emitEvent: false });
    input.value = value;
  }
}
