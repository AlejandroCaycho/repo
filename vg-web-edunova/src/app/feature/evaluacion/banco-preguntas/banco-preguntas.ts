import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { BancoPreguntaService } from '../../../core/services/evaluacion/banco-pregunta.service';
import { MateriaService } from '../../../core/services/evaluacion/materia.service';
import { ProfesorService } from '../../../core/services/evaluacion/profesor.service';
import { BancoPreguntaRequest, BancoPreguntaResponse, MateriaDto, ProfesorDto } from '../../../core/interfaces/evaluacion.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-banco-preguntas',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule
  ],
  templateUrl: './banco-preguntas.html',
  styleUrl: './banco-preguntas.scss'
})
export class BancoPreguntasComponent implements OnInit {
  // Señales
  loading = signal(false);
  preguntas = signal<BancoPreguntaResponse[]>([]);
  preguntaSeleccionada = signal<BancoPreguntaResponse | null>(null);
  mostrarModal = signal(false);
  mostrarModalForm = signal(false);
  modoEdicion = signal(false);
  
  // Listas para dropdowns
  materias = signal<MateriaDto[]>([]);
  profesores = signal<ProfesorDto[]>([]);
  loadingMaterias = signal(false);
  loadingProfesores = signal(false);
  
  // Opciones dinámicas
  opciones = signal<string[]>(['', '']);
  
  // Filtros
  filtroMateria = signal<number | null>(null);
  filtroDificultad = signal<string>('TODAS');
  filtroTipo = signal<string>('TODOS');
  busqueda = signal('');
  
  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = 12;
  
  // Formulario
  preguntaForm: FormGroup;
  
  // Math para template
  Math = Math;
  String = String;

  // Opciones
  dificultades = ['FACIL', 'MEDIO', 'DIFICIL'];
  tiposPregunta = [
    { value: 'MULTIPLE_CHOICE', label: 'Opción Múltiple' },
    { value: 'TRUE_FALSE', label: 'Verdadero/Falso' },
    { value: 'SHORT_ANSWER', label: 'Respuesta Corta' },
    { value: 'ESSAY', label: 'Ensayo' }
  ];

  constructor(
    private bancoPreguntaService: BancoPreguntaService,
    private materiaService: MateriaService,
    private profesorService: ProfesorService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.preguntaForm = this.fb.group({
      materiaId: [null, [Validators.required, this.validarNumeroPositivo]],
      profesorId: [null, [Validators.required, this.validarNumeroPositivo]],
      enunciado: ['', [
        Validators.required, 
        Validators.minLength(10), 
        Validators.maxLength(1000),
        this.validarTextoNoVacio,
        this.validarCaracteresEspeciales
      ]],
      tipo: ['MULTIPLE_CHOICE', [Validators.required, this.validarTipoPregunta]],
      respuestaClave: ['', [
        Validators.required, 
        Validators.minLength(1),
        Validators.maxLength(500),
        this.validarTextoNoVacio
      ]],
      dificultad: ['MEDIO', [Validators.required, this.validarDificultad]],
      explicacion: ['', [
        Validators.maxLength(2000),
        this.validarCaracteresEspeciales
      ]],
      tags: ['', [
        Validators.maxLength(255),
        this.validarTags
      ]]
    });
  }

  ngOnInit(): void {
    this.cargarPreguntas();
    this.cargarMaterias();
    this.cargarProfesores();
    
    // Forzar la actualización inicial
    setTimeout(() => {
      this.actualizarValidacionesPorTipo('MULTIPLE_CHOICE');
    }, 100);
  }

  /**
   * Agregar nueva opción
   */
  agregarOpcion(): void {
    const opcionesActuales = this.opciones();
    
    // Limitar a máximo 8 opciones
    if (opcionesActuales.length >= 8) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite alcanzado',
        text: 'No puedes agregar más de 8 opciones',
        confirmButtonColor: '#6366f1'
      });
      return;
    }
    
    this.opciones.set([...opcionesActuales, '']);
  }

  /**
   * Eliminar opción
   */
  eliminarOpcion(index: number): void {
    const opcionesActuales = this.opciones();
    
    // Mantener mínimo 2 opciones
    if (opcionesActuales.length <= 2) {
      Swal.fire({
        icon: 'warning',
        title: 'Mínimo requerido',
        text: 'Debe mantener al menos 2 opciones',
        confirmButtonColor: '#6366f1'
      });
      return;
    }
    
    opcionesActuales.splice(index, 1);
    this.opciones.set([...opcionesActuales]);
    
    // Validar que la respuesta clave siga siendo válida
    this.validarRespuestaClaveConOpciones();
  }

  /**
   * Actualizar opción con validación
   */
  actualizarOpcion(index: number, valor: string): void {
    // Validar longitud de la opción
    if (valor.length > 200) {
      Swal.fire({
        icon: 'warning',
        title: 'Texto muy largo',
        text: 'Cada opción no puede exceder 200 caracteres',
        confirmButtonColor: '#6366f1'
      });
      return;
    }
    
    // Validar caracteres especiales
    const caracteresProhibidos = /<script|javascript:|onload=|onerror=/i;
    if (caracteresProhibidos.test(valor)) {
      Swal.fire({
        icon: 'warning',
        title: 'Caracteres no permitidos',
        text: 'La opción contiene caracteres no permitidos',
        confirmButtonColor: '#6366f1'
      });
      return;
    }
    
    // Validar opciones duplicadas
    const opcionesActuales = this.opciones();
    const opcionTrimmed = valor.trim().toLowerCase();
    
    if (opcionTrimmed && opcionesActuales.some((op, i) => 
      i !== index && op.trim().toLowerCase() === opcionTrimmed
    )) {
      Swal.fire({
        icon: 'warning',
        title: 'Opción duplicada',
        text: 'Ya existe una opción con este texto',
        confirmButtonColor: '#6366f1'
      });
      return;
    }
    
    opcionesActuales[index] = valor;
    this.opciones.set([...opcionesActuales]);
    
    // Actualizar validación de respuesta clave si es necesario
    this.validarRespuestaClaveConOpciones();
  }

  /**
   * Validar que la respuesta clave siga siendo válida después de cambios en opciones
   */
  private validarRespuestaClaveConOpciones(): void {
    const respuestaControl = this.preguntaForm.get('respuestaClave');
    const tipo = this.preguntaForm.get('tipo')?.value;
    
    if (tipo === 'MULTIPLE_CHOICE' && respuestaControl?.value) {
      const letra = respuestaControl.value.toUpperCase();
      const opciones = this.opcionesValidas;
      const indiceRespuesta = letra.charCodeAt(0) - 65;
      
      if (indiceRespuesta >= opciones.length) {
        // La respuesta ya no es válida, limpiarla
        respuestaControl.setValue('');
        Swal.fire({
          icon: 'info',
          title: 'Respuesta actualizada',
          text: 'La respuesta correcta se ha limpiado porque ya no corresponde a una opción válida',
          timer: 3000,
          showConfirmButton: false
        });
      }
    }
  }

  /**
   * Obtener opciones como JSON string para el backend
   */
  getOpcionesString(): string {
    const opcionesArray = this.opcionesValidas
      .map((op, i) => ({
        id: String.fromCharCode(65 + i), // A, B, C, D...
        texto: op.trim()
      }));
    
    return JSON.stringify(opcionesArray);
  }

  /**
   * Cargar lista de materias
   */
  cargarMaterias(): void {
    this.loadingMaterias.set(true);
    this.materiaService.listarTodas().subscribe({
      next: (materias) => {
        this.materias.set(materias);
        this.loadingMaterias.set(false);
      },
      error: (error) => {
        console.error('Error al cargar materias:', error);
        // Cargar datos mock si falla
        this.materias.set([]);
        this.loadingMaterias.set(false);
      }
    });
  }

  /**
   * Cargar lista de profesores
   */
  cargarProfesores(): void {
    this.loadingProfesores.set(true);
    this.profesorService.listarTodos().subscribe({
      next: (profesores) => {
        this.profesores.set(profesores);
        this.loadingProfesores.set(false);
      },
      error: (error) => {
        console.error('Error al cargar profesores:', error);
        // Cargar datos mock si falla
        this.profesores.set([]);
        this.loadingProfesores.set(false);
      }
    });
  }

  /**
   * Cargar preguntas del backend
   */
  cargarPreguntas(): void {
    this.loading.set(true);
    this.bancoPreguntaService.listarTodas().subscribe({
      next: (preguntas) => {
        this.preguntas.set(preguntas);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar preguntas:', error);
        this.loading.set(false);
        // Mostrar datos mock si falla
        this.cargarDatosMock();
      }
    });
  }

  /**
   * Cargar datos mock para desarrollo
   */
  cargarDatosMock(): void {
    const mock: BancoPreguntaResponse[] = [
      {
        id: 1,
        materiaId: 1,
        profesorId: 1,
        nombreMateria: 'Matemáticas',
        nombreProfesor: 'Juan Pérez',
        enunciado: '¿Cuál es el resultado de 2 + 2?',
        tipo: 'MULTIPLE_CHOICE',
        opciones: '[{"id":"A","texto":"3"},{"id":"B","texto":"4"},{"id":"C","texto":"5"},{"id":"D","texto":"6"}]',
        respuestaClave: 'B',
        dificultad: 'FACIL',
        tags: 'Aritmética Básica',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        materiaId: 1,
        profesorId: 1,
        nombreMateria: 'Matemáticas',
        nombreProfesor: 'Juan Pérez',
        enunciado: '¿Cuál es la derivada de x²?',
        tipo: 'SHORT_ANSWER',
        respuestaClave: '2x',
        dificultad: 'MEDIO',
        tags: 'Cálculo Diferencial',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        materiaId: 2,
        profesorId: 2,
        nombreMateria: 'Física',
        nombreProfesor: 'María García',
        enunciado: 'La velocidad de la luz es constante en el vacío',
        tipo: 'TRUE_FALSE',
        respuestaClave: 'Verdadero',
        dificultad: 'FACIL',
        tags: 'Física Moderna',
        createdAt: new Date().toISOString()
      }
    ];
    this.preguntas.set(mock);
    this.loading.set(false);
  }

  /**
   * Obtener preguntas filtradas
   */
  get preguntasFiltradas(): BancoPreguntaResponse[] {
    let resultado = this.preguntas();

    // Filtro por dificultad
    if (this.filtroDificultad() !== 'TODAS') {
      resultado = resultado.filter(p => p.dificultad === this.filtroDificultad());
    }

    // Filtro por tipo
    if (this.filtroTipo() !== 'TODOS') {
      resultado = resultado.filter(p => p.tipo === this.filtroTipo());
    }

    // Filtro por búsqueda
    if (this.busqueda()) {
      const busquedaLower = this.busqueda().toLowerCase();
      resultado = resultado.filter(p => 
        p.enunciado.toLowerCase().includes(busquedaLower) ||
        (p.tags && p.tags.toLowerCase().includes(busquedaLower)) ||
        (p.nombreMateria && p.nombreMateria.toLowerCase().includes(busquedaLower))
      );
    }

    return resultado;
  }

  /**
   * Obtener preguntas paginadas
   */
  get preguntasPaginadas(): BancoPreguntaResponse[] {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.preguntasFiltradas.slice(inicio, fin);
  }

  /**
   * Total de páginas
   */
  get totalPaginas(): number {
    return Math.ceil(this.preguntasFiltradas.length / this.itemsPorPagina);
  }

  /**
   * Cambiar página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual.set(pagina);
    }
  }

  /**
   * Página anterior
   */
  paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.set(this.paginaActual() - 1);
    }
  }

  /**
   * Página siguiente
   */
  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas) {
      this.paginaActual.set(this.paginaActual() + 1);
    }
  }

  /**
   * Array de páginas
   */
  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  /**
   * Cambiar filtro de dificultad
   */
  cambiarDificultad(dificultad: string): void {
    this.filtroDificultad.set(dificultad);
    this.paginaActual.set(1);
  }

  /**
   * Cambiar filtro de tipo
   */
  cambiarTipo(tipo: string): void {
    this.filtroTipo.set(tipo);
    this.paginaActual.set(1);
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
   * Ver detalles de pregunta
   */
  verDetalles(pregunta: BancoPreguntaResponse): void {
    this.preguntaSeleccionada.set(pregunta);
    this.mostrarModal.set(true);
  }

  /**
   * Cerrar modal de detalles
   */
  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.preguntaSeleccionada.set(null);
  }

  /**
   * Nueva pregunta
   */
  nuevaPregunta(): void {
    this.modoEdicion.set(false);
    this.opciones.set(['', '']);
    this.preguntaForm.reset({
      tipo: 'MULTIPLE_CHOICE',
      dificultad: 'MEDIO'
    });
    this.mostrarModalForm.set(true);
  }

  /**
   * Editar pregunta
   */
  editarPregunta(pregunta: BancoPreguntaResponse): void {
    this.modoEdicion.set(true);
    this.preguntaSeleccionada.set(pregunta);
    
    // Parsear opciones si existen
    if (pregunta.opciones) {
      try {
        // Intentar parsear como JSON
        const opcionesJson = JSON.parse(pregunta.opciones);
        if (Array.isArray(opcionesJson)) {
          const opcionesArray = opcionesJson.map((op: any) => op.texto || '');
          this.opciones.set(opcionesArray.length > 0 ? opcionesArray : ['', '']);
        } else {
          this.opciones.set(['', '']);
        }
      } catch (e) {
        // Si no es JSON, intentar parsear como texto separado por comas
        const opcionesArray = pregunta.opciones.split(',').map(op => {
          return op.trim().replace(/^[A-Z]\)\s*/, '');
        });
        this.opciones.set(opcionesArray.length > 0 ? opcionesArray : ['', '']);
      }
    } else {
      this.opciones.set(['', '']);
    }
    
    this.preguntaForm.patchValue({
      materiaId: pregunta.materiaId,
      profesorId: pregunta.profesorId,
      enunciado: pregunta.enunciado,
      tipo: pregunta.tipo,
      respuestaClave: pregunta.respuestaClave,
      dificultad: pregunta.dificultad,
      explicacion: pregunta.explicacion || '',
      tags: pregunta.tags || ''
    });
    this.mostrarModalForm.set(true);
  }

  /**
   * Cerrar modal de formulario
   */
  cerrarModalForm(): void {
    this.mostrarModalForm.set(false);
    this.preguntaForm.reset();
    this.preguntaSeleccionada.set(null);
  }

  /**
   * Validar formulario completo antes de guardar
   */
  private validarFormularioCompleto(): boolean {
    // Marcar todos los campos como tocados para mostrar errores
    Object.keys(this.preguntaForm.controls).forEach(key => {
      this.preguntaForm.get(key)?.markAsTouched();
    });
    
    // Validar formulario básico
    if (this.preguntaForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, complete todos los campos requeridos correctamente',
        confirmButtonColor: '#6366f1'
      });
      return false;
    }
    
    // Validaciones específicas por tipo
    const tipo = this.preguntaForm.get('tipo')?.value;
    
    if (tipo === 'MULTIPLE_CHOICE') {
      const opciones = this.opciones().filter(op => op.trim() !== '');
      
      if (opciones.length < 2) {
        Swal.fire({
          icon: 'warning',
          title: 'Opciones insuficientes',
          text: 'Las preguntas de opción múltiple deben tener al menos 2 opciones',
          confirmButtonColor: '#6366f1'
        });
        return false;
      }
      
      const respuesta = this.preguntaForm.get('respuestaClave')?.value;
      if (respuesta) {
        const indiceRespuesta = respuesta.charCodeAt(0) - 65;
        if (indiceRespuesta >= opciones.length) {
          Swal.fire({
            icon: 'warning',
            title: 'Respuesta inválida',
            text: 'La respuesta correcta no corresponde a ninguna opción disponible',
            confirmButtonColor: '#6366f1'
          });
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Guardar pregunta
   */
  guardarPregunta(): void {
    // Usar la validación completa
    if (!this.validarFormularioCompleto()) {
      return;
    }

    const formValue = this.preguntaForm.value;
    
    // Sanitizar datos antes de enviar
    const request: BancoPreguntaRequest = {
      materiaId: parseInt(formValue.materiaId),
      profesorId: parseInt(formValue.profesorId),
      enunciado: this.sanitizarTexto(formValue.enunciado),
      tipo: formValue.tipo,
      respuestaClave: this.sanitizarRespuestaClave(formValue.respuestaClave, formValue.tipo),
      dificultad: formValue.dificultad,
      explicacion: formValue.explicacion ? this.sanitizarTexto(formValue.explicacion) : undefined,
      tags: formValue.tags ? this.sanitizarTags(formValue.tags) : undefined,
      opciones: this.getOpcionesString()
    };

    if (this.modoEdicion() && this.preguntaSeleccionada()) {
      // Actualizar
      this.bancoPreguntaService.actualizar(this.preguntaSeleccionada()!.id, request).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: 'La pregunta se actualizó correctamente',
            timer: 2000,
            showConfirmButton: false
          });
          this.cargarPreguntas();
          this.cerrarModalForm();
        },
        error: (error) => {
          console.error('Error al actualizar pregunta:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar la pregunta. Intenta nuevamente.',
            confirmButtonColor: '#6366f1'
          });
        }
      });
    } else {
      // Crear
      this.bancoPreguntaService.crear(request).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Creado!',
            text: 'La pregunta se creó correctamente',
            timer: 2000,
            showConfirmButton: false
          });
          this.cargarPreguntas();
          this.cerrarModalForm();
        },
        error: (error) => {
          console.error('Error al crear pregunta:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear la pregunta. Intenta nuevamente.',
            confirmButtonColor: '#6366f1'
          });
        }
      });
    }
  }

  /**
   * Sanitizar texto para prevenir XSS
   */
  private sanitizarTexto(texto: string): string {
    if (!texto) return '';
    
    return texto
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitizar respuesta clave según el tipo
   */
  private sanitizarRespuestaClave(respuesta: string, tipo: string): string {
    if (!respuesta) return '';
    
    switch (tipo) {
      case 'MULTIPLE_CHOICE':
        return respuesta.toUpperCase().trim();
      case 'TRUE_FALSE':
        const resp = respuesta.toLowerCase().trim();
        // Normalizar respuestas
        if (['verdadero', 'true', 'v'].includes(resp)) return 'Verdadero';
        if (['falso', 'false', 'f'].includes(resp)) return 'Falso';
        return respuesta.trim();
      default:
        return this.sanitizarTexto(respuesta);
    }
  }

  /**
   * Manejar entrada de respuesta múltiple (solo letras)
   */
  onRespuestaMultipleInput(event: any): void {
    const input = event.target;
    let value = input.value.toUpperCase();
    
    // Filtrar solo letras
    value = value.replace(/[^A-Z]/g, '');
    
    // Limitar a una sola letra
    if (value.length > 1) {
      value = value.charAt(0);
    }
    
    // Verificar que la letra esté dentro del rango de opciones disponibles
    const opciones = this.opcionesValidas;
    if (value) {
      const indiceRespuesta = value.charCodeAt(0) - 65; // A=0, B=1, etc.
      if (indiceRespuesta >= opciones.length) {
        // Si la letra está fuera del rango, no la aceptar
        value = '';
        Swal.fire({
          icon: 'warning',
          title: 'Opción no válida',
          text: `Solo puede seleccionar hasta la letra ${String.fromCharCode(64 + opciones.length)} según las opciones disponibles`,
          timer: 3000,
          showConfirmButton: false
        });
      }
    }
    
    // Actualizar el valor del input y del formulario
    input.value = value;
    this.preguntaForm.get('respuestaClave')?.setValue(value);
  }

  /**
   * Seleccionar respuesta haciendo clic en la letra
   */
  seleccionarRespuesta(letra: string): void {
    this.preguntaForm.get('respuestaClave')?.setValue(letra);
  }

  /**
   * Obtener letras disponibles según las opciones
   */
  get letrasDisponibles(): string[] {
    const opciones = this.opcionesValidas;
    return Array.from({ length: opciones.length }, (_, i) => String.fromCharCode(65 + i));
  }

  /**
   * Obtener información contextual sobre el tipo de pregunta seleccionado
   */
  getTipoInfo(tipo: string): string {
    switch (tipo) {
      case 'MULTIPLE_CHOICE':
        return 'Pregunta con varias opciones donde solo una es correcta. Ideal para evaluar conocimiento específico.';
      case 'TRUE_FALSE':
        return 'Pregunta de verdadero o falso. Útil para evaluar comprensión de conceptos básicos.';
      case 'SHORT_ANSWER':
        return 'Pregunta que requiere una respuesta breve y específica. Evalúa conocimiento preciso.';
      case 'ESSAY':
        return 'Pregunta que requiere una respuesta extensa y desarrollada. Evalúa análisis y síntesis.';
      default:
        return '';
    }
  }

  /**
   * Obtener placeholder dinámico para el enunciado según el tipo
   */
  getEnunciadoPlaceholder(tipo: string): string {
    switch (tipo) {
      case 'MULTIPLE_CHOICE':
        return 'Ej: ¿Cuál es la capital de Francia?';
      case 'TRUE_FALSE':
        return 'Ej: La Tierra es el tercer planeta del sistema solar';
      case 'SHORT_ANSWER':
        return 'Ej: ¿Cuál es la fórmula del agua?';
      case 'ESSAY':
        return 'Ej: Analice las causas y consecuencias de la Segunda Guerra Mundial';
      default:
        return 'Escriba aquí la pregunta...';
    }
  }

  /**
   * Obtener opciones válidas (no vacías)
   */
  get opcionesValidas(): string[] {
    return this.opciones().filter(op => op.trim() !== '');
  }

  /**
   * Verificar si no hay opciones válidas
   */
  get noHayOpciones(): boolean {
    return this.opcionesValidas.length === 0;
  }

  /**
   * Debug: Ver el tipo actual seleccionado
   */
  get tipoActual(): string {
    return this.preguntaForm.get('tipo')?.value || 'NINGUNO';
  }

  /**
   * Manejar cambio de tipo de pregunta
   */
  onTipoChange(event: any): void {
    const nuevoTipo = event.target.value;
    console.log('Tipo cambiado a:', nuevoTipo);
    
    // Limpiar respuesta clave cuando cambia el tipo
    this.preguntaForm.get('respuestaClave')?.setValue('', { emitEvent: false });
    
    // Actualizar validaciones
    this.actualizarValidacionesPorTipo(nuevoTipo);
  }

  /**
   * Actualizar validaciones según el tipo de pregunta
   */
  private actualizarValidacionesPorTipo(tipo: string): void {
    const respuestaControl = this.preguntaForm.get('respuestaClave');
    
    if (!respuestaControl) return;
    
    // Limpiar validadores existentes
    respuestaControl.clearValidators();
    
    // Agregar validadores base
    const validadoresBase = [Validators.required, this.validarTextoNoVacio];
    
    switch (tipo) {
      case 'MULTIPLE_CHOICE':
        respuestaControl.setValidators([
          ...validadoresBase,
          Validators.maxLength(1),
          this.validarRespuestaMultiple.bind(this)
        ]);
        break;
        
      case 'TRUE_FALSE':
        respuestaControl.setValidators([
          ...validadoresBase,
          this.validarRespuestaVerdaderoFalso.bind(this)
        ]);
        break;
        
      case 'SHORT_ANSWER':
        respuestaControl.setValidators([
          ...validadoresBase,
          Validators.maxLength(200)
        ]);
        break;
        
      case 'ESSAY':
        respuestaControl.setValidators([
          ...validadoresBase,
          Validators.maxLength(1000)
        ]);
        break;
        
      default:
        respuestaControl.setValidators(validadoresBase);
    }
    
    // Actualizar validación
    respuestaControl.updateValueAndValidity();
  }

  /**
   * Validar respuesta de opción múltiple
   */
  private validarRespuestaMultiple(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    // Verificar que sea solo una letra
    if (!/^[A-Z]$/.test(value)) {
      return { respuestaMultiple: true };
    }
    
    // Verificar que la letra esté dentro del rango de opciones
    const opciones = this.opcionesValidas;
    const indiceRespuesta = value.charCodeAt(0) - 65;
    
    if (indiceRespuesta >= opciones.length) {
      return { respuestaFueraDeRango: true };
    }
    
    return null;
  }

  /**
   * Validar respuesta verdadero/falso
   */
  private validarRespuestaVerdaderoFalso(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    const valoresValidos = ['Verdadero', 'Falso'];
    if (!valoresValidos.includes(value)) {
      return { respuestaVerdaderoFalso: true };
    }
    
    return null;
  }
  private sanitizarTags(tags: string): string {
    if (!tags) return '';
    
    return tags
      .split(',')
      .map(tag => this.sanitizarTexto(tag.trim()))
      .filter(tag => tag.length > 0)
      .join(', ');
  }

  /**
   * Eliminar pregunta
   */
  eliminarPregunta(pregunta: BancoPreguntaResponse): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.bancoPreguntaService.eliminar(pregunta.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: 'La pregunta se eliminó correctamente',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarPreguntas();
          },
          error: (error) => {
            console.error('Error al eliminar pregunta:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la pregunta. Intenta nuevamente.',
              confirmButtonColor: '#6366f1'
            });
          }
        });
      }
    });
  }

  /**
   * Verificar si un campo es inválido
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.preguntaForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Obtener mensaje de error para un campo
   */
  getFieldError(fieldName: string): string {
    const field = this.preguntaForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    
    if (errors['required']) return `${this.getFieldLabel(fieldName)} es obligatorio`;
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} no puede exceder ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['numeroPositivo']) return `${this.getFieldLabel(fieldName)} debe ser un número positivo`;
    if (errors['textoVacio']) return `${this.getFieldLabel(fieldName)} no puede estar vacío o contener solo espacios`;
    if (errors['caracteresEspeciales']) return `${this.getFieldLabel(fieldName)} contiene caracteres no permitidos`;
    if (errors['tipoPregunta']) return 'Tipo de pregunta no válido';
    if (errors['dificultad']) return 'Nivel de dificultad no válido';
    if (errors['tags']) return 'Las etiquetas deben estar separadas por comas y no exceder 50 caracteres cada una';
    if (errors['opcionesInsuficientes']) return 'Debe tener al menos 2 opciones válidas';
    if (errors['opcionesVacias']) return 'Las opciones no pueden estar vacías';
    if (errors['contieneNumeros']) return 'No se permiten números, solo letras (A, B, C, D, etc.)';
    if (errors['formatoInvalido']) return 'Formato inválido. Use solo una letra (A, B, C, D, etc.)';
    if (errors['respuestaMultiple']) return 'Debe ser una letra válida (A, B, C, D, etc.)';
    if (errors['respuestaFueraDeRango']) return 'La letra no corresponde a ninguna opción disponible';
    if (errors['respuestaVerdaderoFalso']) return 'Debe ser Verdadero o Falso';

    return 'Campo inválido';
  }

  /**
   * Obtener etiqueta amigable del campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'materiaId': 'La materia',
      'profesorId': 'El profesor',
      'enunciado': 'El enunciado',
      'tipo': 'El tipo de pregunta',
      'respuestaClave': 'La respuesta clave',
      'dificultad': 'La dificultad',
      'explicacion': 'La explicación',
      'tags': 'Las etiquetas'
    };
    return labels[fieldName] || 'El campo';
  }

  // ==========================================
  // VALIDADORES PERSONALIZADOS
  // ==========================================

  /**
   * Validar que sea un número positivo
   */
  private validarNumeroPositivo(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value !== null && (isNaN(value) || value <= 0)) {
      return { numeroPositivo: true };
    }
    return null;
  }

  /**
   * Validar que el texto no esté vacío (sin solo espacios)
   */
  private validarTextoNoVacio(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && typeof value === 'string' && value.trim().length === 0) {
      return { textoVacio: true };
    }
    return null;
  }

  /**
   * Validar caracteres especiales peligrosos
   */
  private validarCaracteresEspeciales(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && typeof value === 'string') {
      // Caracteres peligrosos para XSS y SQL injection
      const caracteresProhibidos = /<script|javascript:|onload=|onerror=|<iframe|eval\(|alert\(/i;
      if (caracteresProhibidos.test(value)) {
        return { caracteresEspeciales: true };
      }
    }
    return null;
  }

  /**
   * Validar tipo de pregunta
   */
  private validarTipoPregunta(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const tiposValidos = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'];
    if (value && !tiposValidos.includes(value)) {
      return { tipoPregunta: true };
    }
    return null;
  }

  /**
   * Validar dificultad
   */
  private validarDificultad(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const dificultadesValidas = ['FACIL', 'MEDIO', 'DIFICIL'];
    if (value && !dificultadesValidas.includes(value)) {
      return { dificultad: true };
    }
    return null;
  }

  /**
   * Validar formato de tags
   */
  private validarTags(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && typeof value === 'string' && value.trim().length > 0) {
      const tags = value.split(',').map(tag => tag.trim());
      
      // Verificar que cada tag no exceda 50 caracteres
      for (const tag of tags) {
        if (tag.length > 50) {
          return { tags: true };
        }
      }
      
      // Verificar que no haya más de 10 tags
      if (tags.length > 10) {
        return { tags: true };
      }
    }
    return null;
  }

  /**
   * Validar opciones para preguntas de opción múltiple
   */
  private validarOpciones(): ValidationErrors | null {
    const tipo = this.preguntaForm.get('tipo')?.value;
    
    if (tipo === 'MULTIPLE_CHOICE') {
      const opciones = this.opcionesValidas;
      
      if (opciones.length < 2) {
        return { opcionesInsuficientes: true };
      }
      
      // Verificar que la respuesta clave coincida con alguna opción
      const respuestaClave = this.preguntaForm.get('respuestaClave')?.value;
      if (respuestaClave) {
        const letraRespuesta = respuestaClave.toUpperCase();
        const indiceRespuesta = letraRespuesta.charCodeAt(0) - 65; // A=0, B=1, etc.
        
        if (indiceRespuesta < 0 || indiceRespuesta >= opciones.length) {
          return { respuestaInvalida: true };
        }
      }
    }
    
    return null;
  }
}
