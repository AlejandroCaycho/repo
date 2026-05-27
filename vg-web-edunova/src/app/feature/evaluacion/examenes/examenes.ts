import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExamenService } from '../../../core/services/evaluacion/examen.service';
import { ExamenRequest, ExamenResponse } from '../../../core/interfaces/evaluacion.interface';
import { ExamenPreguntasComponent } from '../examen-preguntas/examen-preguntas';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-examenes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ExamenPreguntasComponent],
  templateUrl: './examenes.html',
  styleUrl: './examenes.scss'
})
export class ExamenesComponent implements OnInit {
  loading = signal(false);
  examenes = signal<ExamenResponse[]>([]);
  examenSeleccionado = signal<ExamenResponse | null>(null);
  mostrarModal = signal(false);
  mostrarModalForm = signal(false);
  modoEdicion = signal(false);
  
  // Filtros
  filtroEstado = signal<string>('TODOS');
  busqueda = signal('');
  
  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = 9;
  
  // Formulario
  examenForm: FormGroup;
  
  Math = Math;

  constructor(
    private examenService: ExamenService,
    private fb: FormBuilder
  ) {
    this.examenForm = this.fb.group({
      claseId: [1, Validators.required],
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      tipo: ['PARCIAL', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      duracionMinutos: [60, [Validators.required, Validators.min(1)]],
      puntajeTotal: [20, [Validators.required, Validators.min(1)]],
      puntajeAprobatorio: [11, [Validators.required, Validators.min(1)]],
      intentosPermitidos: [1, [Validators.required, Validators.min(1)]],
      mostrarResultados: [true]
    });
  }

  ngOnInit(): void {
    this.cargarExamenes();
  }

  cargarExamenes(): void {
    this.loading.set(true);
    this.examenService.listarTodos().subscribe({
      next: (examenes) => {
        this.examenes.set(examenes);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar exámenes:', error);
        this.cargarDatosMock();
        this.loading.set(false);
      }
    });
  }

  cargarDatosMock(): void {
    const mock: ExamenResponse[] = [
      {
        id: 1,
        claseId: 1,
        titulo: 'Examen Parcial - Álgebra',
        descripcion: 'Evaluación de ecuaciones y funciones',
        tipo: 'PARCIAL',
        fechaInicio: '2024-06-01T08:00:00',
        fechaFin: '2024-06-01T10:00:00',
        duracionMinutos: 120,
        puntajeTotal: 20,
        puntajeAprobatorio: 11,
        intentosPermitidos: 1,
        mostrarResultados: true,
        estado: 'PUBLICADO',
        activo: true,
        fechaCreacion: new Date().toISOString()
      },
      {
        id: 2,
        claseId: 1,
        titulo: 'Examen Final - Cálculo',
        descripcion: 'Evaluación integral del curso',
        tipo: 'FINAL',
        fechaInicio: '2024-07-15T08:00:00',
        fechaFin: '2024-07-15T11:00:00',
        duracionMinutos: 180,
        puntajeTotal: 20,
        puntajeAprobatorio: 11,
        intentosPermitidos: 1,
        mostrarResultados: false,
        estado: 'BORRADOR',
        activo: false,
        fechaCreacion: new Date().toISOString()
      }
    ];
    this.examenes.set(mock);
  }

  get examenesFiltrados(): ExamenResponse[] {
    let resultado = this.examenes();

    if (this.filtroEstado() !== 'TODOS') {
      if (this.filtroEstado() === 'ACTIVOS') {
        resultado = resultado.filter(e => e.estado === 'PUBLICADO');
      } else if (this.filtroEstado() === 'INACTIVOS') {
        resultado = resultado.filter(e => e.estado === 'BORRADOR' || e.estado === 'FINALIZADO');
      }
    }

    if (this.busqueda()) {
      const busquedaLower = this.busqueda().toLowerCase();
      resultado = resultado.filter(e => 
        e.titulo.toLowerCase().includes(busquedaLower) ||
        (e.descripcion && e.descripcion.toLowerCase().includes(busquedaLower))
      );
    }

    return resultado;
  }

  get examenesPaginados(): ExamenResponse[] {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.examenesFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.examenesFiltrados.length / this.itemsPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual.set(pagina);
    }
  }

  cambiarFiltro(filtro: string): void {
    this.filtroEstado.set(filtro);
    this.paginaActual.set(1);
  }

  nuevoExamen(): void {
    this.modoEdicion.set(false);
    this.examenForm.reset({
      claseId: 1,
      tipo: 'PARCIAL',
      duracionMinutos: 60,
      puntajeTotal: 20,
      puntajeAprobatorio: 11,
      intentosPermitidos: 1,
      mostrarResultados: true
    });
    this.mostrarModalForm.set(true);
  }

  verDetalles(examen: ExamenResponse): void {
    this.examenSeleccionado.set(examen);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.examenSeleccionado.set(null);
  }

  cerrarModalForm(): void {
    this.mostrarModalForm.set(false);
    this.examenForm.reset();
  }

  guardarExamen(): void {
    if (this.examenForm.invalid) {
      Object.keys(this.examenForm.controls).forEach(key => {
        this.examenForm.get(key)?.markAsTouched();
      });
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor completa todos los campos requeridos',
        confirmButtonColor: '#6366f1'
      });
      return;
    }

    const formValue = this.examenForm.value;
    
    // Convertir fechas al formato correcto para el backend
    const request: ExamenRequest = {
      ...formValue,
      fechaInicio: formValue.fechaInicio ? formValue.fechaInicio + ':00' : '',
      fechaFin: formValue.fechaFin ? formValue.fechaFin + ':00' : ''
    };

    console.log('Datos a enviar:', request);

    this.examenService.crear(request).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Examen creado',
          text: 'El examen se creó correctamente',
          timer: 2000,
          showConfirmButton: false
        });
        this.cargarExamenes();
        this.cerrarModalForm();
      },
      error: (error) => {
        console.error('Error al crear examen:', error);
        console.error('Detalles del error:', error.error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo crear el examen',
          confirmButtonColor: '#6366f1'
        });
      }
    });
  }

  publicarExamen(examen: ExamenResponse): void {
    Swal.fire({
      title: '¿Publicar examen?',
      text: 'Los estudiantes podrán ver y realizar el examen',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, publicar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.examenService.publicar(examen.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Examen publicado',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarExamenes();
          },
          error: (error) => {
            console.error('Error al publicar examen:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo publicar el examen',
              confirmButtonColor: '#6366f1'
            });
          }
        });
      }
    });
  }

  finalizarExamen(examen: ExamenResponse): void {
    Swal.fire({
      title: '¿Finalizar examen?',
      text: 'No se podrán realizar más intentos',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.examenService.finalizar(examen.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Examen finalizado',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarExamenes();
          },
          error: (error) => {
            console.error('Error al finalizar examen:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo finalizar el examen',
              confirmButtonColor: '#6366f1'
            });
          }
        });
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.examenForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
