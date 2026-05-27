import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import Swal from 'sweetalert2';

import { Nivel, Aula, Grado, Materia, AnoAcademico, PeriodoAcademico, Clase, HorarioClase, Profesor } from '../../core/interfaces/academic.interface';
import { NivelService } from '../../core/services/academic/nivel.service';
import { AulaService } from '../../core/services/academic/aula.service';
import { GradoService } from '../../core/services/academic/grado.service';
import { MateriaService } from '../../core/services/academic/materia.service';
import { AnoAcademicoService } from '../../core/services/academic/ano-academico.service';
import { PeriodoAcademicoService } from '../../core/services/academic/periodo-academico.service';
import { ClaseService } from '../../core/services/academic/clase.service';
import { HorarioClaseService } from '../../core/services/academic/horario-clase.service';
import { DocenteService } from '../../core/services/academic/docente.service';

type AcademicSection = 'clases' | 'grados' | 'aulas' | 'materias' | 'calendario';

@Component({
  selector: 'app-clases',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './clases.html',
  styleUrls: ['./clases.scss']
})
export class ClasesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  
  // Servicios Académicos
  private readonly nivelSvc = inject(NivelService);
  private readonly aulaSvc = inject(AulaService);
  private readonly docenteSvc = inject(DocenteService);
  private readonly gradoSvc = inject(GradoService);
  private readonly materiaSvc = inject(MateriaService);
  private readonly anoSvc = inject(AnoAcademicoService);
  private readonly periodoSvc = inject(PeriodoAcademicoService);
  private readonly claseSvc = inject(ClaseService);
  private readonly horarioSvc = inject(HorarioClaseService);

  // Estados reactivos (Signals)
  readonly seccion = signal<AcademicSection>('clases');
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly busqueda = signal('');
  readonly institucionId = 1; // Default corporativo

  // Listas de datos
  readonly niveles = signal<Nivel[]>([]);
  readonly aulas = signal<Aula[]>([]);
  readonly grados = signal<Grado[]>([]);
  readonly materias = signal<Materia[]>([]);
  readonly anos = signal<AnoAcademico[]>([]);
  readonly periodos = signal<PeriodoAcademico[]>([]);
  readonly clases = signal<Clase[]>([]);
  readonly horarios = signal<HorarioClase[]>([]);
  readonly docentes = signal<Profesor[]>([]);

  // Estados de Modales e Hilo de Edición
  readonly mostrarModal = signal(false);
  readonly modoEdicion = signal(false);
  
  readonly editandoId = signal<number | null>(null);
  readonly anoSeleccionadoId = signal<number | null>(null);
  readonly filtroGradoId = signal<number | null>(null);
  readonly filtroMateriaId = signal<number | null>(null);
  readonly filtroNivelGradoId = signal<number | null>(null);
  readonly filtroBloqueAula = signal<string>('');

  // Formularios Reactivos
  readonly aulaForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    codigo: ['', [Validators.maxLength(30)]],
    capacidad: [30, [Validators.required, Validators.min(1)]],
    tipo: ['Teórica', [Validators.required]],
    piso: ['1', [Validators.required]],
    bloque: ['Bloque A', [Validators.required]],
    equipamiento: [''],
    disponible: [true]
  });

  readonly materiaForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
    codigo: ['', [Validators.required, Validators.maxLength(50)]],
    descripcion: [''],
    horasSemana: [4, [Validators.required, Validators.min(1)]],
    color: ['#165EF0', [Validators.required]],
    nivelId: [null as number | null, [Validators.required]],
    esObligatoria: [true],
    activa: [true]
  });

  readonly gradoForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    seccion: ['A', [Validators.required, Validators.maxLength(10)]],
    turno: ['Mañana', [Validators.required]],
    capacidadMax: [30, [Validators.required, Validators.min(1)]],
    nivelId: [null as number | null, [Validators.required]],
    aulaId: [null as number | null],
    tutorId: [null as number | null], // Sin mock teacher ID
    activo: [true]
  });

  readonly claseForm = this.fb.group({
    profesorId: [null as number | null, [Validators.required]], // Sin mock teacher ID
    gradoId: [null as number | null, [Validators.required]],
    materiaId: [null as number | null, [Validators.required]],
    aulaId: [null as number | null],
    anoAcademicoId: [null as number | null, [Validators.required]],
    modalidad: ['presencial', [Validators.required]],
    enlaceVirtual: [''],
    descripcion: [''],
    activa: [true]
  });

  readonly anoForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    fechaInicio: ['', [Validators.required]],
    fechaFin: ['', [Validators.required]],
    activo: [true]
  });

  readonly periodoForm = this.fb.group({
    anoAcademicoId: [null as number | null, [Validators.required]],
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    tipo: ['Bimestral', [Validators.required]],
    orden: [1, [Validators.required, Validators.min(1)]],
    fechaInicio: ['', [Validators.required]],
    fechaFin: ['', [Validators.required]],
    activo: [true]
  });

  readonly horarioForm = this.fb.group({
    claseId: [null as number | null, [Validators.required]],
    tipoHorario: ['A', [Validators.required]],
    diaSemana: ['Lunes', [Validators.required]],
    horaInicio: ['08:00:00', [Validators.required]],
    horaFin: ['09:30:00', [Validators.required]]
  });

  readonly bloquesUnicos = computed(() => {
    const all = this.aulas().map(a => a.bloque).filter(b => !!b) as string[];
    return [...new Set(all)].sort();
  });

  readonly aulasFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const fBloque = this.filtroBloqueAula();
    return this.aulas().filter(a => {
      const matchesBloque = !fBloque || a.bloque === fBloque;
      const matchesQuery = !q || a.nombre.toLowerCase().includes(q) || (a.codigo && a.codigo.toLowerCase().includes(q));
      return matchesBloque && matchesQuery;
    });
  });

  readonly materiasFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.materias();
    return this.materias().filter(m => m.nombre.toLowerCase().includes(q) || (m.codigo && m.codigo.toLowerCase().includes(q)));
  });

  readonly gradosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const fNivel = this.filtroNivelGradoId();
    return this.grados().filter(g => {
      const matchesNivel = !fNivel || g.nivelId === fNivel;
      const matchesQuery = !q || g.nombre.toLowerCase().includes(q) || (g.seccion && g.seccion.toLowerCase().includes(q));
      return matchesNivel && matchesQuery;
    });
  });

  readonly clasesAgrupadasPorMateria = computed(() => {
    const allClases = this.clases();
    const allMaterias = this.materias();
    const query = this.busqueda().toLowerCase().trim();
    const fGrado = this.filtroGradoId();
    const fMateria = this.filtroMateriaId();

    // 1. Filtrar las clases según los filtros de Grado y Materia
    const clasesFiltradas = allClases.filter(c => {
      const matchesGrado = !fGrado || c.gradoId === fGrado;
      const matchesMateria = !fMateria || c.materiaId === fMateria;
      return matchesGrado && matchesMateria;
    });

    // 2. Agrupar clases por materiaId
    const gruposMap = new Map<number, Clase[]>();
    clasesFiltradas.forEach(c => {
      if (!gruposMap.has(c.materiaId)) {
        gruposMap.set(c.materiaId, []);
      }
      gruposMap.get(c.materiaId)!.push(c);
    });

    // 3. Crear el resultado combinando la materia y sus clases
    return allMaterias
      .map(m => {
        const clasesDeMateria = gruposMap.get(m.id!) || [];
        return {
          materia: m,
          clases: clasesDeMateria
        };
      })
      .filter(group => group.clases.length > 0)
      .filter(group => {
        if (!query) return true;
        return group.materia.nombre.toLowerCase().includes(query) || 
               (group.materia.codigo && group.materia.codigo.toLowerCase().includes(query));
      });
  });

  readonly anosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.anos();
    return this.anos().filter(a => a.nombre.toLowerCase().includes(q));
  });

  readonly periodosFiltrados = computed(() => {
    const selectedId = this.anoSeleccionadoId();
    if (!selectedId) return [];
    return this.periodos().filter(p => p.anoAcademicoId === selectedId)
      .sort((a, b) => a.orden - b.orden);
  });

  readonly aulasDisponiblesParaGrado = computed(() => {
    const allAulas = this.aulas();
    const allGrados = this.grados();
    const editandoId = this.editandoId();

    // Obtener los IDs de aulas que ya están ocupadas por otros grados activos
    const aulasOcupadas = allGrados
      .filter(g => g.activo && g.aulaId && g.id !== editandoId)
      .map(g => g.aulaId);

    // Filtrar las aulas para quedarnos solo con las libres o la asignada al grado actual
    return allAulas.filter(a => !aulasOcupadas.includes(a.id) && a.disponible);
  });

  readonly institucionNombre = computed(() => {
    const firstGrado = this.grados().find(g => g.institucion != null);
    if (firstGrado && firstGrado.institucion) return firstGrado.institucion.nombre;
    
    const firstClase = this.clases().find(c => c.institucion != null);
    if (firstClase && firstClase.institucion) return firstClase.institucion.nombre;
    
    return 'Conectando con Auth...'; // Fallback visual
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    
    // Carga paralela de catálogos y entidades
    this.nivelSvc.listar().subscribe({
      next: n => this.niveles.set(n),
      error: () => console.error('Error al cargar niveles')
    });

    this.aulaSvc.listar().subscribe({
      next: a => this.aulas.set(a),
      error: () => console.error('Error al cargar aulas')
    });

    this.gradoSvc.listar().subscribe({
      next: g => this.grados.set(g),
      error: () => console.error('Error al cargar grados')
    });

    this.materiaSvc.listar().subscribe({
      next: m => this.materias.set(m),
      error: () => console.error('Error al cargar materias')
    });

    this.anoSvc.listar().subscribe({
      next: an => {
        this.anos.set(an);
        if (an.length > 0 && !this.anoSeleccionadoId()) {
          const activeYear = an.find(y => y.activo) || an[0];
          if (activeYear && activeYear.id) {
            this.anoSeleccionadoId.set(activeYear.id);
          }
        }
      },
      error: () => console.error('Error al cargar años académicos')
    });

    this.periodoSvc.listar().subscribe({
      next: p => this.periodos.set(p),
      error: () => console.error('Error al cargar períodos')
    });

    this.claseSvc.listar().subscribe({
      next: c => {
        this.clases.set(c);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        console.error('Error al cargar clases');
      }
    });

    this.horarioSvc.listar().subscribe({
      next: h => this.horarios.set(h),
      error: () => console.error('Error al cargar horarios')
    });

    this.docenteSvc.listar().subscribe({
      next: d => this.docentes.set(d),
      error: () => console.error('Error al cargar docentes')
    });
  }

  setSeccion(sec: AcademicSection): void {
    this.seccion.set(sec);
    this.busqueda.set('');
  }

  seleccionarAno(id?: number): void {
    if (id) {
      this.anoSeleccionadoId.set(id);
    }
  }

  onGradoChange(): void {
    const gradoId = this.claseForm.get('gradoId')?.value;
    if (gradoId) {
      const grado = this.grados().find(g => g.id === Number(gradoId));
      if (grado && grado.aulaId) {
        this.claseForm.patchValue({ aulaId: grado.aulaId });
      }
    }
  }

  onFiltroGradoChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.filtroGradoId.set(val ? Number(val) : null);
  }

  onFiltroMateriaChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.filtroMateriaId.set(val ? Number(val) : null);
  }

  onFiltroNivelGradoChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.filtroNivelGradoId.set(val ? Number(val) : null);
  }

  onFiltroBloqueAulaChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.filtroBloqueAula.set(val);
  }

  setBusqueda(e: Event): void {
    this.busqueda.set((e.target as HTMLInputElement).value);
  }

  // Resolutores de Nombres para visualización
  getNivelNombre(id?: number): string {
    return this.niveles().find(n => n.id === id)?.nombre || 'Sin nivel';
  }

  getAulaNombre(id?: number): string {
    return this.aulas().find(a => a.id === id)?.nombre || 'Sin aula';
  }

  getGradoNombre(id?: number): string {
    const g = this.grados().find(x => x.id === id);
    return g ? `${g.nombre} ${g.seccion || ''}` : 'Sin grado';
  }

  getMateriaNombre(id?: number): string {
    return this.materias().find(m => m.id === id)?.nombre || 'Sin materia';
  }

  getMateriaColor(id?: number): string {
    return this.materias().find(m => m.id === id)?.color || '#165EF0';
  }

  getAnoNombre(id?: number): string {
    return this.anos().find(a => a.id === id)?.nombre || 'Sin año';
  }

  getHorariosDeClase(claseId?: number): HorarioClase[] {
    if (!claseId) return [];
    return this.horarios().filter(h => h.claseId === claseId);
  }

  // --- Operaciones de Apertura de Formularios ---
  abrirCrear(): void {
    this.modoEdicion.set(false);
    this.editandoId.set(null);
    this.mostrarModal.set(true);

    // Resetear formulario según sección activa
    switch (this.seccion()) {
      case 'aulas':
        this.aulaForm.reset({ disponible: true, capacidad: 30, tipo: 'Teórica', piso: '1', bloque: 'Bloque A' });
        break;
      case 'materias':
        this.materiaForm.reset({ color: '#165EF0', horasSemana: 4, esObligatoria: true, activa: true });
        break;
      case 'grados':
        this.gradoForm.reset({ activo: true, turno: 'Mañana', capacidadMax: 30 });
        if (this.niveles().length > 0) this.gradoForm.patchValue({ nivelId: this.niveles()[0].id });
        if (this.aulas().length > 0) this.gradoForm.patchValue({ aulaId: this.aulas()[0].id });
        break;
      case 'clases':
        this.claseForm.reset({ activa: true, modalidad: 'presencial' });
        if (this.grados().length > 0) this.claseForm.patchValue({ gradoId: this.grados()[0].id });
        if (this.materias().length > 0) this.claseForm.patchValue({ materiaId: this.materias()[0].id });
        if (this.aulas().length > 0) this.claseForm.patchValue({ aulaId: this.aulas()[0].id });
        if (this.anos().length > 0) this.claseForm.patchValue({ anoAcademicoId: this.anos()[0].id });
        break;
      case 'calendario':
        this.anoForm.reset({ activo: true });
        this.periodoForm.reset({ activo: true, tipo: 'Bimestral', orden: 1 });
        if (this.anos().length > 0) this.periodoForm.patchValue({ anoAcademicoId: this.anos()[0].id });
        break;
    }
  }

  abrirEditar(tipo: string, item: any): void {
    this.modoEdicion.set(true);
    this.editandoId.set(item.id);
    this.mostrarModal.set(true);

    if (tipo === 'aula') {
      this.aulaForm.patchValue(item);
    } else if (tipo === 'materia') {
      this.materiaForm.patchValue(item);
    } else if (tipo === 'grado') {
      this.gradoForm.patchValue(item);
    } else if (tipo === 'clase') {
      this.claseForm.patchValue(item);
    } else if (tipo === 'ano') {
      this.anoForm.patchValue(item);
    } else if (tipo === 'periodo') {
      this.periodoForm.patchValue(item);
    }
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  // --- Operaciones de Guardado (POST / PUT) ---
  guardar(): void {
    if (this.guardando()) return;
    this.guardando.set(true);

    const s = this.seccion();
    if (s === 'aulas') {
      this.guardarAula();
    } else if (s === 'materias') {
      this.guardarMateria();
    } else if (s === 'grados') {
      this.guardarGrado();
    } else if (s === 'clases') {
      this.guardarClase();
    } else if (s === 'calendario') {
      this.guardarAnoAcademico();
    }
  }

  private guardarAula(): void {
    if (this.aulaForm.invalid) { this.guardando.set(false); return; }
    const payload = { ...this.aulaForm.value, institucionId: this.institucionId } as Aula;
    
    const obs$ = this.modoEdicion() && this.editandoId()
      ? this.aulaSvc.actualizar(this.editandoId()!, payload)
      : this.aulaSvc.crear(payload);

    obs$.subscribe({
      next: () => {
        this.cargarDatos();
        this.cerrarModal();
        this.guardando.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Aula guardada',
          text: 'El registro se actualizó correctamente',
          timer: 1800,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#10b981',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        });
      },
      error: () => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el aula.',
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#ef4444',
          confirmButtonColor: '#165EF0',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        });
      }
    });
  }

  private guardarMateria(): void {
    if (this.materiaForm.invalid) { this.guardando.set(false); return; }
    const payload = { ...this.materiaForm.value, institucionId: this.institucionId } as Materia;

    const obs$ = this.modoEdicion() && this.editandoId()
      ? this.materiaSvc.actualizar(this.editandoId()!, payload)
      : this.materiaSvc.crear(payload);

    obs$.subscribe({
      next: () => {
        this.cargarDatos();
        this.cerrarModal();
        this.guardando.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Materia guardada',
          text: 'El registro se actualizó correctamente',
          timer: 1800,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#10b981',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        });
      },
      error: () => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar la materia.',
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#ef4444',
          confirmButtonColor: '#165EF0',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        });
      }
    });
  }

  private guardarGrado(): void {
    if (this.gradoForm.invalid) { this.guardando.set(false); return; }
    const payload = { ...this.gradoForm.value, institucionId: this.institucionId } as Grado;

    const obs$ = this.modoEdicion() && this.editandoId()
      ? this.gradoSvc.actualizar(this.editandoId()!, payload)
      : this.gradoSvc.crear(payload);

    obs$.subscribe({
      next: () => {
        this.cargarDatos();
        this.cerrarModal();
        this.guardando.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Grado guardado',
          text: 'El registro se actualizó correctamente',
          timer: 1800,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#10b981',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        });
      },
      error: () => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el grado.',
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#ef4444',
          confirmButtonColor: '#165EF0',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        });
      }
    });
  }

  private guardarClase(): void {
    if (this.claseForm.invalid) { this.guardando.set(false); return; }
    const payload = { ...this.claseForm.value } as Clase;

    const obs$ = this.modoEdicion() && this.editandoId()
      ? this.claseSvc.actualizar(this.editandoId()!, payload)
      : this.claseSvc.crear(payload);

    obs$.subscribe({
      next: () => {
        this.cargarDatos();
        this.cerrarModal();
        this.guardando.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Clase guardada',
          text: 'El registro se actualizó correctamente',
          timer: 1800,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#10b981',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        });
      },
      error: () => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar la clase.',
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#ef4444',
          confirmButtonColor: '#165EF0',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        });
      }
    });
  }

  private guardarAnoAcademico(): void {
    if (this.anoForm.invalid) { this.guardando.set(false); return; }
    const payload = { ...this.anoForm.value, institucionId: this.institucionId } as AnoAcademico;

    const obs$ = this.modoEdicion() && this.editandoId()
      ? this.anoSvc.actualizar(this.editandoId()!, payload)
      : this.anoSvc.crear(payload);

    obs$.subscribe({
      next: () => {
        this.cargarDatos();
        this.cerrarModal();
        this.guardando.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Año académico guardado',
          text: 'El registro se actualizó correctamente',
          timer: 1800,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#10b981',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        });
      },
      error: () => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el año académico.',
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#ef4444',
          confirmButtonColor: '#165EF0',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        });
      }
    });
  }

  // --- Adición rápida de Periodos y Horarios (con Modales Dinámicos de SweetAlert2) ---
  agregarPeriodo(): void {
    const selectedYearId = this.anoSeleccionadoId();
    if (!selectedYearId) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Primero selecciona o registra un año académico.',
        confirmButtonColor: '#165EF0',
        background: '#ffffff',
        color: '#1e293b',
        iconColor: '#f59e0b',
        customClass: {
          popup: 'swal-premium-popup',
          title: 'swal-premium-title'
        }
      });
      return;
    }

    Swal.fire({
      title: 'Nuevo Período Académico',
      html: `
        <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
          <label>Año Académico Seleccionado</label>
          <select id="swal-anoId" class="swal2-input" style="width:100%; margin:0;" disabled>
            ${this.anos().map(a => `<option value="${a.id}" ${a.id === selectedYearId ? 'selected' : ''}>${a.nombre}</option>`).join('')}
          </select>
          <label>Nombre del Período</label>
          <input id="swal-nombre" class="swal2-input" placeholder="Ej: Primer Bimestre" style="width:100%; margin:0;" />
          <label>Tipo</label>
          <input id="swal-tipo" class="swal2-input" value="Bimestral" style="width:100%; margin:0;" />
          <label>Orden</label>
          <input id="swal-orden" type="number" class="swal2-input" value="1" style="width:100%; margin:0;" />
          <label>Fecha de Inicio</label>
          <input id="swal-inicio" type="date" class="swal2-input" style="width:100%; margin:0;" />
          <label>Fecha de Fin</label>
          <input id="swal-fin" type="date" class="swal2-input" style="width:100%; margin:0;" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#165EF0',
      cancelButtonColor: '#64748b',
      background: '#ffffff',
      color: '#1e293b',
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
        confirmButton: 'swal-premium-btn',
        cancelButton: 'swal-premium-btn'
      },
      preConfirm: () => {
        const anoAcademicoId = selectedYearId;
        const nombre = (document.getElementById('swal-nombre') as HTMLInputElement).value;
        const tipo = (document.getElementById('swal-tipo') as HTMLInputElement).value;
        const orden = Number((document.getElementById('swal-orden') as HTMLInputElement).value);
        const fechaInicio = (document.getElementById('swal-inicio') as HTMLInputElement).value;
        const fechaFin = (document.getElementById('swal-fin') as HTMLInputElement).value;

        if (!nombre || !fechaInicio || !fechaFin) {
          Swal.showValidationMessage('Todos los campos obligatorios deben completarse');
        }
        return { anoAcademicoId, nombre, tipo, orden, fechaInicio, fechaFin, activo: true } as PeriodoAcademico;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.periodoSvc.crear(result.value).subscribe({
          next: () => {
            this.cargarDatos();
            Swal.fire({
              icon: 'success',
              title: 'Período creado',
              text: 'El registro se actualizó correctamente',
              timer: 1800,
              showConfirmButton: false,
              background: '#ffffff',
              color: '#1e293b',
              iconColor: '#10b981',
              customClass: {
                popup: 'swal-premium-popup',
                title: 'swal-premium-title'
              }
            });
          },
          error: () => Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear el período académico.',
            background: '#ffffff',
            color: '#1e293b',
            iconColor: '#ef4444',
            confirmButtonColor: '#165EF0',
            customClass: {
              popup: 'swal-premium-popup',
              title: 'swal-premium-title'
            }
          })
        });
      }
    });
  }

  eliminarPeriodo(p: PeriodoAcademico): void {
    Swal.fire({
      title: '¿Eliminar período?',
      text: `Se borrará "${p.nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: '#ffffff',
      color: '#1e293b',
      iconColor: '#f59e0b',
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
        confirmButton: 'swal-premium-btn',
        cancelButton: 'swal-premium-btn'
      }
    }).then(r => {
      if (r.isConfirmed) {
        this.periodoSvc.eliminar(p.id!).subscribe({
          next: () => {
            this.cargarDatos();
            Swal.fire({
              icon: 'success',
              title: 'Período eliminado',
              text: 'El registro se eliminó correctamente',
              timer: 1800,
              showConfirmButton: false,
              background: '#ffffff',
              color: '#1e293b',
              iconColor: '#10b981',
              customClass: {
                popup: 'swal-premium-popup',
                title: 'swal-premium-title'
              }
            });
          },
          error: () => Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el período.',
            background: '#ffffff',
            color: '#1e293b',
            iconColor: '#ef4444',
            confirmButtonColor: '#165EF0',
            customClass: {
              popup: 'swal-premium-popup',
              title: 'swal-premium-title'
            }
          })
        });
      }
    });
  }

  agregarHorario(clase: Clase): void {
    Swal.fire({
      title: 'Programar Horario',
      html: `
        <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
          <label>Día de la semana</label>
          <select id="swal-dia" class="swal2-input" style="width:100%; margin:0;">
            <option value="Lunes">Lunes</option>
            <option value="Martes">Martes</option>
            <option value="Miércoles">Miércoles</option>
            <option value="Jueves">Jueves</option>
            <option value="Viernes">Viernes</option>
            <option value="Sábado">Sábado</option>
          </select>
          <label>Tipo de Horario</label>
          <select id="swal-tipoH" class="swal2-input" style="width:100%; margin:0;">
            <option value="A">Horario A (Normal)</option>
            <option value="B">Horario B (Corto)</option>
          </select>
          <label>Hora Inicio</label>
          <input id="swal-hInicio" type="time" class="swal2-input" value="08:00" style="width:100%; margin:0;" />
          <label>Hora Fin</label>
          <input id="swal-hFin" type="time" class="swal2-input" value="09:30" style="width:100%; margin:0;" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Programar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#165EF0',
      cancelButtonColor: '#64748b',
      background: '#ffffff',
      color: '#1e293b',
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
        confirmButton: 'swal-premium-btn',
        cancelButton: 'swal-premium-btn'
      },
      preConfirm: () => {
        const diaSemana = (document.getElementById('swal-dia') as HTMLSelectElement).value;
        const tipoHorario = (document.getElementById('swal-tipoH') as HTMLSelectElement).value;
        let horaInicio = (document.getElementById('swal-hInicio') as HTMLInputElement).value;
        let horaFin = (document.getElementById('swal-hFin') as HTMLInputElement).value;

        // Añadir segundos para coincidir con la base de datos Time
        if (horaInicio && horaInicio.split(':').length === 2) horaInicio += ':00';
        if (horaFin && horaFin.split(':').length === 2) horaFin += ':00';

        if (!horaInicio || !horaFin) {
          Swal.showValidationMessage('Las horas de inicio y fin son obligatorias');
        }
        return { claseId: clase.id!, diaSemana, tipoHorario, horaInicio, horaFin } as HorarioClase;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.horarioSvc.crear(result.value).subscribe({
          next: () => {
            this.cargarDatos();
            Swal.fire({
              icon: 'success',
              title: 'Horario programado',
              text: 'El registro se actualizó correctamente',
              timer: 1800,
              showConfirmButton: false,
              background: '#ffffff',
              color: '#1e293b',
              iconColor: '#10b981',
              customClass: {
                popup: 'swal-premium-popup',
                title: 'swal-premium-title'
              }
            });
          },
          error: () => Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Conflicto en horario o datos incorrectos.',
            background: '#ffffff',
            color: '#1e293b',
            iconColor: '#ef4444',
            confirmButtonColor: '#165EF0',
            customClass: {
              popup: 'swal-premium-popup',
              title: 'swal-premium-title'
            }
          })
        });
      }
    });
  }

  eliminarHorario(h: HorarioClase): void {
    Swal.fire({
      title: '¿Eliminar bloque horario?',
      text: `Se retirará el bloque del día ${h.diaSemana}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: '#ffffff',
      color: '#1e293b',
      iconColor: '#f59e0b',
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
        confirmButton: 'swal-premium-btn',
        cancelButton: 'swal-premium-btn'
      }
    }).then(r => {
      if (r.isConfirmed) {
        this.horarioSvc.eliminar(h.id!).subscribe({
          next: () => {
            this.cargarDatos();
            Swal.fire({
              icon: 'success',
              title: 'Horario removido',
              text: 'El registro se eliminó correctamente',
              timer: 1800,
              showConfirmButton: false,
              background: '#ffffff',
              color: '#1e293b',
              iconColor: '#10b981',
              customClass: {
                popup: 'swal-premium-popup',
                title: 'swal-premium-title'
              }
            });
          },
          error: () => Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el horario.',
            background: '#ffffff',
            color: '#1e293b',
            iconColor: '#ef4444',
            confirmButtonColor: '#165EF0',
            customClass: {
              popup: 'swal-premium-popup',
              title: 'swal-premium-title'
            }
          })
        });
      }
    });
  }

  // --- Operaciones de Eliminación (DELETE) ---
  eliminar(tipo: string, id: number): void {
    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: 'Esta acción no se puede deshacer y podría afectar dependencias académicas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: '#ffffff',
      color: '#1e293b',
      iconColor: '#f59e0b',
      customClass: {
        popup: 'swal-premium-popup',
        title: 'swal-premium-title',
        confirmButton: 'swal-premium-btn',
        cancelButton: 'swal-premium-btn'
      }
    }).then(result => {
      if (!result.isConfirmed) return;

      let obs$;
      if (tipo === 'aula') obs$ = this.aulaSvc.eliminar(id);
      else if (tipo === 'materia') obs$ = this.materiaSvc.eliminar(id);
      else if (tipo === 'grado') obs$ = this.gradoSvc.eliminar(id);
      else if (tipo === 'clase') obs$ = this.claseSvc.eliminar(id);
      else if (tipo === 'ano') obs$ = this.anoSvc.eliminar(id);
      else return;

      obs$.subscribe({
        next: () => {
          this.cargarDatos();
          Swal.fire({
            icon: 'success',
            title: 'Eliminado correctamente',
            text: 'El registro se eliminó correctamente',
            timer: 1800,
            showConfirmButton: false,
            background: '#ffffff',
            color: '#1e293b',
            iconColor: '#10b981',
            customClass: {
              popup: 'swal-premium-popup',
              title: 'swal-premium-title'
            }
          });
        },
        error: () => Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el recurso. Verifique que no tenga dependencias activas.',
          background: '#ffffff',
          color: '#1e293b',
          iconColor: '#ef4444',
          confirmButtonColor: '#165EF0',
          customClass: {
            popup: 'swal-premium-popup',
            title: 'swal-premium-title'
          }
        })
      });
    });
  }
}
