import { Component, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExamenService } from '../../../core/services/evaluacion/examen.service';
import { BancoPreguntaService } from '../../../core/services/evaluacion/banco-pregunta.service';
import { ExamenPreguntaRequest, ExamenPreguntaResponse, BancoPreguntaResponse } from '../../../core/interfaces/evaluacion.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-examen-preguntas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './examen-preguntas.html',
  styleUrl: './examen-preguntas.scss'
})
export class ExamenPreguntasComponent implements OnInit {
  // Input del examen
  examenId = input.required<number>();
  
  // Señales
  loading = signal(false);
  preguntasExamen = signal<ExamenPreguntaResponse[]>([]);
  preguntasBanco = signal<BancoPreguntaResponse[]>([]);
  mostrarModalAgregar = signal(false);
  
  // Filtros
  busqueda = signal('');
  filtroDificultad = signal<string>('TODAS');
  
  // Formulario
  preguntaForm: FormGroup;
  
  Math = Math;

  constructor(
    private examenService: ExamenService,
    private bancoPreguntaService: BancoPreguntaService,
    private fb: FormBuilder
  ) {
    this.preguntaForm = this.fb.group({
      bancoPreguntaId: [null, Validators.required],
      orden: [1, [Validators.required, Validators.min(1)]],
      puntaje: [1, [Validators.required, Validators.min(0.1)]]
    });
  }

  ngOnInit(): void {
    this.cargarPreguntasExamen();
    this.cargarPreguntasBanco();
  }

  /**
   * Cargar preguntas del examen
   */
  cargarPreguntasExamen(): void {
    this.loading.set(true);
    this.examenService.listarPreguntas(this.examenId()).subscribe({
      next: (preguntas) => {
        this.preguntasExamen.set(preguntas);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar preguntas del examen:', error);
        this.preguntasExamen.set([]);
        this.loading.set(false);
      }
    });
  }

  /**
   * Cargar preguntas del banco
   */
  cargarPreguntasBanco(): void {
    this.bancoPreguntaService.listarTodas().subscribe({
      next: (preguntas) => {
        this.preguntasBanco.set(preguntas);
      },
      error: (error) => {
        console.error('Error al cargar banco de preguntas:', error);
        this.preguntasBanco.set([]);
      }
    });
  }

  /**
   * Obtener preguntas del banco filtradas
   */
  get preguntasBancoFiltradas(): BancoPreguntaResponse[] {
    let resultado = this.preguntasBanco();

    // Filtrar las que ya están en el examen
    const idsEnExamen = this.preguntasExamen().map(p => p.bancoPreguntaId);
    resultado = resultado.filter(p => !idsEnExamen.includes(p.id));

    // Filtro por dificultad
    if (this.filtroDificultad() !== 'TODAS') {
      resultado = resultado.filter(p => p.dificultad === this.filtroDificultad());
    }

    // Filtro por búsqueda
    if (this.busqueda()) {
      const busquedaLower = this.busqueda().toLowerCase();
      resultado = resultado.filter(p => 
        p.enunciado.toLowerCase().includes(busquedaLower) ||
        (p.tags && p.tags.toLowerCase().includes(busquedaLower))
      );
    }

    return resultado;
  }

  /**
   * Abrir modal para agregar pregunta
   */
  abrirModalAgregar(): void {
    const siguienteOrden = this.preguntasExamen().length + 1;
    this.preguntaForm.patchValue({
      orden: siguienteOrden,
      puntaje: 1
    });
    this.mostrarModalAgregar.set(true);
  }

  /**
   * Cerrar modal
   */
  cerrarModal(): void {
    this.mostrarModalAgregar.set(false);
    this.preguntaForm.reset();
  }

  /**
   * Seleccionar pregunta del banco
   */
  seleccionarPregunta(pregunta: BancoPreguntaResponse): void {
    this.preguntaForm.patchValue({
      bancoPreguntaId: pregunta.id
    });
  }

  /**
   * Agregar pregunta al examen
   */
  agregarPregunta(): void {
    if (this.preguntaForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona una pregunta',
        text: 'Debes seleccionar una pregunta del banco',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const request: ExamenPreguntaRequest = {
      examenId: this.examenId(),
      ...this.preguntaForm.value
    };

    this.examenService.agregarPregunta(request).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Pregunta agregada',
          timer: 1500,
          showConfirmButton: false
        });
        this.cargarPreguntasExamen();
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al agregar pregunta:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo agregar la pregunta',
          confirmButtonColor: '#10b981'
        });
      }
    });
  }

  /**
   * Obtener clase CSS de dificultad
   */
  getDificultadClass(dificultad: string): string {
    switch (dificultad) {
      case 'FACIL': return 'dificultad-facil';
      case 'MEDIO': return 'dificultad-medio';
      case 'DIFICIL': return 'dificultad-dificil';
      default: return '';
    }
  }

  /**
   * Obtener icono de tipo de pregunta
   */
  getTipoIcon(tipo: string): string {
    switch (tipo) {
      case 'MULTIPLE_CHOICE': return '☑️';
      case 'TRUE_FALSE': return '✓✗';
      case 'SHORT_ANSWER': return '✍️';
      case 'ESSAY': return '📝';
      default: return '❓';
    }
  }

  /**
   * Cambiar filtro de dificultad
   */
  cambiarDificultad(dificultad: string): void {
    this.filtroDificultad.set(dificultad);
  }

  /**
   * Calcular puntaje total del examen
   */
  get puntajeTotal(): number {
    return this.preguntasExamen().reduce((sum, p) => sum + (p.puntaje || 0), 0);
  }
}
