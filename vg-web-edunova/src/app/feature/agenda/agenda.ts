import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LucideAngularModule, MessageSquare, Clock, CheckCircle2, Bell, Plus, Search, Phone, Video, Info, Paperclip, Send, Calendar, Users, FileText, Trash2, RefreshCw, Edit, X, AlertCircle, Shield, UserCheck } from 'lucide-angular';
import Swal from 'sweetalert2';
import { CommsService } from '../../core/services/comms.service';
import { UsuarioAuthService } from '../../core/services/auth/usuario-auth.service';
import { InstitucionService } from '../../core/services/auth/institucion.service';
import { Grupo, Mensaje, StatsResponse, AdjuntoMensaje, NotificacionItem, GrupoMiembroResponse, GrupoUpdateRequest, NotificacionRequest } from '../../core/interfaces/comms.interface';

interface ChatContact {
  id: number;
  initials: string;
  name: string;
  date: string;
  lastMessage: string;
  preview: string;
  isOnline: boolean;
  archivado: boolean;
  grupo: Grupo;
}

interface ChatMessage {
  id: number;
  text: string;
  time: string;
  isSent: boolean;
  adjuntos: AdjuntoMensaje[];
  esImportante?: boolean;
  eliminadoRemitente?: boolean;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  templateUrl: './agenda.html',
  styleUrl: './agenda.scss'
})
export class AgendaComponent implements OnInit {
  isLoading = true;
  activeTab: string = 'MENSAJES';
  selectedChatId: number | null = null;
  newMessageText: string = '';
  searchQuery: string = '';

  currentUserId = 1;
  institucionId = 1;

  icons = {
    MessageSquare, Bell, Plus, Search, Phone, Video, Info, Paperclip, Send, Calendar, Users, FileText, Trash2, RefreshCw, Edit, X, AlertCircle, Shield, UserCheck
  };

  stats = {
    mensajesNuevos: { count: '--', badge: '' },
    gruposActivos: { count: '--', badge: '' },
    archivosCompartidos: { count: '--', badge: '' },
    recordatorios: { count: '--', badge: '' }
  };

  usuariosMap: { [key: number]: string } = {};
  institucionesMap: { [key: number]: string } = {};
  todosUsuarios: any[] = [];
  contacts: ChatContact[] = [];
  chatMessages: ChatMessage[] = [];
  notificacionesPendientes: NotificacionItem[] = [];
  notificacionesHistorial: NotificacionItem[] = [];
  ultimaNotificacion: string = '';

  constructor(
    private commsService: CommsService,
    private usuarioAuthService: UsuarioAuthService,
    private institucionService: InstitucionService,
    private sanitizer: DomSanitizer
  ) { }

  get selectedChat(): ChatContact | undefined {
    return this.contacts.find(c => c.id === this.selectedChatId);
  }

  get contactosFiltrados(): ChatContact[] {
    if (!this.searchQuery.trim()) return this.contacts;
    const q = this.searchQuery.toLowerCase();
    return this.contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  }

  async ngOnInit() {
    await this.cargarUsuarios();
    this.recargarTodo();
  }

  getSafeUrl(url: string): SafeUrl {
    if (!url) return '';
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  recargarTodo() {
    this.cargarGrupos();
    this.cargarStats();
    this.cargarNotificaciones();
    if (this.selectedChatId) {
      this.cargarMensajes(this.selectedChatId);
    }
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Sincronizado',
      showConfirmButton: false,
      timer: 800
    });
  }

  cargarUsuarios(): Promise<void> {
    return Promise.all([
      new Promise<void>((resolve) => {
        this.usuarioAuthService.listar().subscribe({
          next: (users) => {
            this.todosUsuarios = users;
            users.forEach(u => { this.usuariosMap[u.id] = u.nombre; });
            resolve();
          },
          error: () => resolve()
        });
      }),
      new Promise<void>((resolve) => {
        this.institucionService.listar().subscribe({
          next: (instituciones) => {
            instituciones.forEach(i => { this.institucionesMap[i.id] = i.nombre; });
            resolve();
          },
          error: () => resolve()
        });
      })
    ]).then(() => {});
  }

  cargarStats() {
    this.commsService.getStats(this.currentUserId).subscribe({
      next: (data: StatsResponse) => {
        this.stats.mensajesNuevos = { count: String(data.mensajesNuevos).padStart(2, '0'), badge: data.mensajesNuevos > 0 ? '+' + data.mensajesNuevos : '0' };
        this.stats.gruposActivos = { count: String(data.gruposActivos).padStart(2, '0'), badge: data.gruposActivos > 0 ? 'Activos' : '0' };
        this.stats.archivosCompartidos = { count: String(data.archivos).padStart(2, '0'), badge: data.archivos > 0 ? '+' + data.archivos : '0' };
        this.stats.recordatorios = { count: String(data.recordatorios).padStart(2, '0'), badge: data.recordatorios > 0 ? 'Sin leer' : 'Al día' };
      },
      error: (err) => console.warn('Stats no disponibles', err)
    });
  }

  cargarNotificaciones() {
    this.commsService.getNotificacionesPorUsuario(this.currentUserId).subscribe({
      next: (notifs) => {
        this.notificacionesPendientes = notifs.filter(n => !n.leida);
        this.notificacionesHistorial = notifs;
        this.ultimaNotificacion = this.notificacionesPendientes.length > 0 ? this.notificacionesPendientes[0].titulo : '';
      },
      error: () => { }
    });
  }

  cargarGrupos() {
    this.commsService.getGruposPorUsuario(this.currentUserId).subscribe({
      next: (grupos) => {
        this.contacts = grupos.map(g => ({
          id: g.id,
          initials: g.nombre.substring(0, 2).toUpperCase(),
          name: g.nombre,
          date: this.formatWhatsAppDate(g.createdAt),
          lastMessage: g.descripcion || 'Grupo Oficial',
          preview: g.archivado ? 'Archivado' : '',
          isOnline: true,
          archivado: g.archivado,
          grupo: g
        }));
        if (this.contacts.length > 0 && !this.selectedChatId) this.selectChat(this.contacts[0].id);
        this.isLoading = false;
      },
      error: (err) => { console.error('Error cargando grupos', err); this.isLoading = false; }
    });
  }

  selectChat(id: number) {
    this.selectedChatId = id;
    this.cargarMensajes(id);
    this.chatMessages.filter(m => !m.isSent).forEach(msg => {
      this.commsService.marcarMensajeLeido(msg.id, this.currentUserId).subscribe({
        next: () => this.cargarStats(),
        error: () => { }
      });
    });
  }

  cargarMensajes(grupoId: number) {
    this.commsService.getMensajesPorGrupo(grupoId, this.currentUserId).subscribe({
      next: (mensajes) => {
        const mapped: ChatMessage[] = mensajes.map(m => ({
          id: m.id,
          text: m.contenido,
          time: this.formatWhatsAppDate(m.createdAt, true),
          isSent: m.remitenteId === this.currentUserId,
          adjuntos: [],
          esImportante: m.esImportante,
          eliminadoRemitente: m.eliminadoRemitente
        }));
        this.chatMessages = mapped;
        mapped.forEach((msg, idx) => {
          this.commsService.getAdjuntosPorMensaje(msg.id).subscribe({
            next: (adjuntos) => { this.chatMessages[idx].adjuntos = adjuntos; },
            error: () => { }
          });
        });
      },
      error: (err) => console.error('Error cargando mensajes', err)
    });
  }

  eliminarMensaje(msg: ChatMessage) {
    Swal.fire({
      title: '¿Eliminar mensaje?',
      text: msg.isSent ? 'Puedes eliminarlo solo para ti o para todos en el grupo.' : 'Este mensaje se eliminará solo para ti.',
      icon: 'question',
      showDenyButton: msg.isSent,
      showCancelButton: true,
      confirmButtonText: 'Borrar para mí',
      denyButtonText: 'Borrar para todos',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6',
      denyButtonColor: '#ef4444'
    }).then((result) => {
      if (result.isConfirmed) {
        this.commsService.eliminarMensajeParaMi(msg.id, this.currentUserId).subscribe({
          next: () => {
            this.chatMessages = this.chatMessages.filter(m => m.id !== msg.id);
            this.cargarStats();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mensaje eliminado para ti', showConfirmButton: false, timer: 1500 });
          }
        });
      } else if (result.isDenied) {
        this.commsService.eliminarMensajeParaTodos(msg.id).subscribe({
          next: () => {
            this.cargarMensajes(this.selectedChatId!);
            this.cargarStats();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mensaje eliminado para todos', showConfirmButton: false, timer: 1500 });
          }
        });
      }
    });
  }

  restaurarMensaje(msg: ChatMessage) {
    Swal.fire({
      title: '¿Restaurar mensaje?',
      text: 'El mensaje volverá a ser visible con su contenido original para todos los miembros.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      confirmButtonColor: '#3b82f6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.commsService.restaurarMensajeParaTodos(msg.id).subscribe({
          next: () => {
            this.cargarMensajes(this.selectedChatId!);
            this.cargarStats();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mensaje restaurado con éxito', showConfirmButton: false, timer: 1500 });
          }
        });
      }
    });
  }

  setTab(tab: 'MENSAJES' | 'CALENDARIO') { this.activeTab = tab; }

  sendMessage() {
    if (!this.newMessageText.trim() || !this.selectedChatId) return;
    const textToSend = this.newMessageText;
    this.newMessageText = '';
    this.commsService.enviarMensaje(this.selectedChatId, this.currentUserId, textToSend).subscribe({
      next: () => { this.cargarMensajes(this.selectedChatId!); this.cargarStats(); },
      error: (err) => { console.error('Error al enviar mensaje', err); this.newMessageText = textToSend; }
    });
  }

  onAttach() {
    if (!this.selectedChatId || this.chatMessages.length === 0) {
      Swal.fire('Atención', 'Envía un mensaje primero para adjuntarle un archivo', 'info');
      return;
    }
    const ultimoMensajeId = this.chatMessages[this.chatMessages.length - 1].id;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const nombre = file.name;
      const tamanoKb = Math.round(file.size / 1024);
      let tipo = 'DOCUMENTO';
      if (file.type.includes('image')) tipo = 'IMAGEN';

      Swal.fire({
        title: 'Adjuntar Archivo Local',
        text: '¿Confirmas subir "' + nombre + '" (' + tamanoKb + ' KB)?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        confirmButtonColor: '#3b82f6'
      }).then((result) => {
        if (result.isConfirmed) {
          const reader = new FileReader();
          reader.onload = (event: any) => {
            const base64Data = event.target.result;
            this.commsService.adjuntarArchivo(ultimoMensajeId, tipo, nombre, base64Data, tamanoKb).subscribe({
              next: () => {
                this.cargarMensajes(this.selectedChatId!);
                this.cargarStats();
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Archivo adjuntado localmente', showConfirmButton: false, timer: 1500 });
              },
              error: (err) => Swal.fire('Error', err.error?.mensaje || err.message || 'Error al adjuntar archivo', 'error')
            });
          };
          reader.readAsDataURL(file);
        }
      });
    };
    fileInput.click();
  }

  confirmarEliminarChat(event: Event, contact: ChatContact) {
    event.stopPropagation();
    Swal.fire({
      title: '¿Abandonar grupo?',
      text: 'Dejarás de ser miembro de "' + contact.name + '".',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'SÍ, ABANDONAR',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        this.commsService.abandonarGrupo(contact.id, this.currentUserId).subscribe({
          next: () => {
            this.contacts = this.contacts.filter(c => c.id !== contact.id);
            if (this.selectedChatId === contact.id) this.selectedChatId = null;
            this.cargarStats();
          }
        });
      }
    });
  }

  // ────────────────────────────────────────
  // NOTIFICACIONES
  // ────────────────────────────────────────

  verAvisos() {
    if (this.notificacionesPendientes.length === 0) {
      Swal.fire({ title: '¡Estás al día!', icon: 'success' });
      return;
    }
    const htmlNotifs = this.notificacionesPendientes.map(n =>
      '<div style="padding: 10px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">' +
      '<div><strong>' + n.titulo + '</strong><p style="margin:0; font-size:0.8rem;">' + n.contenido + '</p></div>' +
      '<div style="display:flex; gap:6px;">' +
      '<button id="btn-read-' + n.id + '" style="background:#3b82f6; color:white; border:none; border-radius:5px; padding:5px 10px; cursor:pointer;">Leído</button>' +
      '<button id="btn-delete-notif-' + n.id + '" style="background:#fee2e2; color:#ef4444; border:none; border-radius:5px; padding:5px 10px; cursor:pointer;">✕</button>' +
      '</div></div>'
    ).join('');
    Swal.fire({
      title: 'Tus Avisos',
      html: '<div style="max-height: 300px; overflow-y: auto;">' + htmlNotifs + '</div>' +
        '<button id="btn-crear-notif" style="margin-top:12px; width:100%; background:#2563eb; color:white; border:none; padding:8px; border-radius:8px; font-weight:600; cursor:pointer;">+ CREAR AVISO</button>',
      showConfirmButton: false,
      didOpen: () => {
        this.notificacionesPendientes.forEach(n => {
          const btn = document.getElementById('btn-read-' + n.id);
          if (btn) btn.onclick = () => {
            this.commsService.marcarNotificacionLeida(n.id).subscribe({
              next: () => { this.cargarNotificaciones(); this.cargarStats(); Swal.close(); }
            });
          };
          const delBtn = document.getElementById('btn-delete-notif-' + n.id);
          if (delBtn) delBtn.onclick = () => {
            this.eliminarNotificacionModal(n.id);
          };
        });
        const crearBtn = document.getElementById('btn-crear-notif');
        if (crearBtn) crearBtn.onclick = () => this.crearNotificacionModal();
      }
    });
  }

  crearNotificacionModal() {
    Swal.fire({
      title: 'Crear Aviso',
      html:
        '<input id="n-titulo" class="swal2-input" placeholder="Título del aviso">' +
        '<textarea id="n-contenido" class="swal2-textarea" placeholder="Contenido del aviso"></textarea>' +
        '<select id="n-tipo" class="swal2-input" style="height:42px;">' +
        '<option value="COMUNICADO">Comunicado</option>' +
        '<option value="TAREA">Tarea</option>' +
        '<option value="CALIFICACION">Calificación</option>' +
        '<option value="SISTEMA">Sistema</option>' +
        '</select>',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      confirmButtonColor: '#2563eb',
      preConfirm: () => {
        const titulo = (document.getElementById('n-titulo') as HTMLInputElement).value;
        const contenido = (document.getElementById('n-contenido') as HTMLTextAreaElement).value;
        const tipo = (document.getElementById('n-tipo') as HTMLSelectElement).value;
        if (!titulo || !contenido) {
          Swal.showValidationMessage('Título y contenido requeridos');
          return false;
        }
        return { titulo, contenido, tipo };
      }
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        const data: NotificacionRequest = {
          usuarioId: this.currentUserId,
          titulo: res.value.titulo,
          contenido: res.value.contenido,
          tipo: res.value.tipo
        };
        this.commsService.crearNotificacion(data).subscribe({
          next: () => {
            this.cargarNotificaciones();
            this.cargarStats();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Aviso creado', showConfirmButton: false, timer: 1500 });
          },
          error: (err) => Swal.fire('Error', 'No se pudo crear el aviso', 'error')
        });
      }
    });
  }

  eliminarNotificacionModal(notifId: number) {
    Swal.fire({
      title: '¿Eliminar aviso?',
      text: 'Esta acción eliminará el aviso permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#ef4444'
    }).then((result) => {
      if (result.isConfirmed) {
        this.commsService.eliminarNotificacion(notifId).subscribe({
          next: () => {
            this.cargarNotificaciones();
            this.cargarStats();
            Swal.close();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Aviso eliminado', showConfirmButton: false, timer: 1500 });
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el aviso', 'error')
        });
      }
    });
  }

  // ────────────────────────────────────────
  // INFO GRUPO / MIEMBROS / EDITAR GRUPO
  // ────────────────────────────────────────

  async verInfoGrupo() {
    if (!this.selectedChatId) return;
    await this.cargarUsuarios();
    this.commsService.getMiembrosGrupo(this.selectedChatId).subscribe({
      next: (miembros: GrupoMiembroResponse[]) => {
        const grupo = this.contacts.find(c => c.id === this.selectedChatId)?.grupo;
        const descripcion = grupo?.descripcion || '';
        const nombreGrupo = grupo?.nombre || '';

        const grupoId = this.selectedChatId!;
        const lista = miembros.map(m => {
          const nombre = this.usuariosMap[m.usuarioId] || ('Usuario ' + m.usuarioId);
          const removeBtn = m.usuarioId !== this.currentUserId
            ? '<button class="remove-membro-btn" data-gid="' + grupoId + '" data-uid="' + m.usuarioId + '" data-name="' + nombre.replace(/'/g, "\\'") + '" style="background:#fee2e2; color:#ef4444; border:none; width:30px; height:30px; border-radius:8px; cursor:pointer; font-size:0.8rem; font-weight:700; display:flex; align-items:center; justify-content:center; margin-left:6px;" title="Quitar del grupo">✕</button>'
            : '';
          return '<div style="padding:12px 10px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">' +
            '  <div style="display:flex; align-items:center; gap:12px;">' +
            '    <div style="width:38px; height:38px; border-radius:50%; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem; border:1.5px solid #bfdbfe;">' + nombre.substring(0, 2).toUpperCase() + '</div>' +
            '    <div style="text-align:left;">' +
            '      <strong style="color:#1e293b; font-size:0.95rem; font-weight:700; display:block;">' + nombre + '</strong>' +
            '      <p style="margin:0; font-size:0.75rem; color:#64748b;">ID: ' + m.usuarioId + '</p>' +
            '    </div>' +
            '  </div>' +
            '  <div style="display:flex; align-items:center;">' +
            '    <span style="background:#eff6ff; color:#2563eb; padding:4px 12px; border-radius:9999px; font-size:0.7rem; font-weight:800; text-transform:uppercase; border: 1px solid #dbeafe;">' + m.rol + '</span>' +
            removeBtn +
            '  </div>' +
            '</div>';
        }).join('');

        const archivoTag = grupo?.archivado
          ? '<span style="display:inline-block; background:#fef3c7; color:#92400e; font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:9999px; margin-top:4px;">ARCHIVADO</span>'
          : '';
        const html = '' +
          '<div style="background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:12px; text-align:left;">' +
          '  <strong style="color:#1e293b; font-size:1.1rem;">' + nombreGrupo + '</strong>' +
          archivoTag +
          (descripcion ? '<p style="margin:6px 0 0; font-size:0.8rem; color:#64748b;">' + descripcion + '</p>' : '') +
          '</div>' +
          '<div style="max-height: 240px; overflow-y: auto; padding: 0 4px;">' + lista + '</div>' +
          '<div style="display:flex; gap:8px; margin-top:12px;">' +
          '<button id="btn-add-m" style="flex:1; background:#2563eb; color:white; border:none; padding:8px; border-radius:8px; font-weight:600; font-size:0.85rem; cursor:pointer;">+ MIEMBRO</button>' +
          '<button id="btn-edit-grupo" style="flex:1; background:#f1f5f9; color:#1e293b; border:1px solid #e2e8f0; padding:8px; border-radius:8px; font-weight:600; font-size:0.85rem; cursor:pointer;">EDITAR GRUPO</button>' +
          '</div>';

        Swal.fire({
          title: 'Info Grupo',
          html: html,
          showConfirmButton: false,
          didOpen: () => {
            const addBtn = document.getElementById('btn-add-m');
            if (addBtn) addBtn.onclick = () => this.abrirModalAgregarMiembro();
            const editBtn = document.getElementById('btn-edit-grupo');
            if (editBtn) editBtn.onclick = () => this.editarGrupoModal();
            document.querySelectorAll('.remove-membro-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const gid = Number(target.dataset['gid']);
                const uid = Number(target.dataset['uid']);
                const name = target.dataset['name'] || 'Usuario ' + uid;
                Swal.fire({
                  title: '¿Quitar miembro?',
                  text: name + ' será removido del grupo.',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: 'SÍ, QUITAR',
                  confirmButtonColor: '#ef4444',
                  cancelButtonText: 'Cancelar'
                }).then((result) => {
                  if (result.isConfirmed) {
                    this.commsService.abandonarGrupo(gid, uid).subscribe({
                      next: () => {
                        Swal.close();
                        this.verInfoGrupo();
                        this.cargarStats();
                        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: name + ' removido del grupo', showConfirmButton: false, timer: 1500 });
                      },
                      error: () => Swal.fire('Error', 'No se pudo quitar al miembro', 'error')
                    });
                  }
                });
              });
            });
          }
        });
      }
    });
  }

  abrirModalAgregarMiembro() {
    Swal.fire({ title: 'Cargando usuarios...', didOpen: () => Swal.showLoading(), allowOutsideClick: false, showConfirmButton: false });

    const cargarDatos = () => {
      return Promise.all([
        new Promise<void>((resolve) => {
          this.usuarioAuthService.listar().subscribe({
            next: (users) => {
              this.todosUsuarios = users;
              users.forEach((u: any) => { this.usuariosMap[u.id] = u.nombre; });
              resolve();
            },
            error: () => { this.todosUsuarios = []; resolve(); }
          });
        }),
        new Promise<void>((resolve) => {
          this.institucionService.listar().subscribe({
            next: (instituciones) => {
              instituciones.forEach((i: any) => { this.institucionesMap[i.id] = i.nombre; });
              resolve();
            },
            error: () => resolve()
          });
        })
      ]);
    };

    cargarDatos().then(() => {
      Swal.close();
      if (this.todosUsuarios.length === 0) {
        Swal.fire({ title: 'Sin datos', text: 'No se pudieron cargar los usuarios. ¿El servidor de autenticación está encendido?', icon: 'warning', confirmButtonText: 'Reintentar', confirmButtonColor: '#2563eb' }).then(r => { if (r.isConfirmed) this.abrirModalAgregarMiembro(); });
        return;
      }

      const usuariosHtml = this.todosUsuarios.map(u => {
      const inst = this.institucionesMap[u.institucionId] || '';
      const initials = u.nombre.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
      return '<div class="user-option" data-id="' + u.id + '" style="display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:10px; cursor:pointer; transition:all 0.15s; border:2px solid transparent; margin-bottom:4px;">' +
        '<div class="user-check" style="width:20px; height:20px; border-radius:50%; border:2px solid #cbd5e1; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s; font-size:0.65rem; color:white;">✓</div>' +
        '<div style="width:36px; height:36px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.8rem; flex-shrink:0;">' + initials + '</div>' +
        '<div style="flex:1; text-align:left; min-width:0;">' +
          '<strong style="display:block; font-size:0.85rem; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + u.nombre + '</strong>' +
          '<span style="font-size:0.7rem; color:#64748b;">' + inst + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    Swal.fire({
      title: 'Selecciona un usuario',
      html:
        '<input id="buscador-usuarios" type="text" placeholder="Buscar por nombre..." style="width:100%; padding:10px 14px; border:1px solid #e2e8f0; border-radius:10px; font-size:0.85rem; outline:none; margin-bottom:10px; box-sizing:border-box;">' +
        '<div id="lista-usuarios" style="max-height:300px; overflow-y:auto;">' + usuariosHtml + '</div>' +
        '<div id="footer-accion" style="display:none; margin-top:12px; padding-top:12px; border-top:1px solid #e2e8f0; text-align:center;">' +
          '<p id="selected-name" style="margin:0 0 8px; font-size:0.85rem; color:#64748b;"></p>' +
          '<div style="display:flex; gap:8px; justify-content:center;">' +
            '<button id="btn-confirm-miembro" style="flex:1; max-width:160px; background:#2563eb; color:white; border:none; padding:10px 16px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;">Agregar Miembro</button>' +
            '<button id="btn-confirm-admin" style="flex:1; max-width:160px; background:#9333ea; color:white; border:none; padding:10px 16px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;">Agregar Admin</button>' +
          '</div>' +
        '</div>',
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        let selectedUid: number | null = null;
        const searchInput = document.getElementById('buscador-usuarios') as HTMLInputElement;
        const footer = document.getElementById('footer-accion');
        const selectedName = document.getElementById('selected-name');

        const selectUser = (el: HTMLElement, uid: number, name: string) => {
          document.querySelectorAll('.user-option').forEach(opt => {
            (opt as HTMLElement).style.borderColor = 'transparent';
            (opt as HTMLElement).style.background = 'transparent';
            const check = opt.querySelector('.user-check') as HTMLElement;
            if (check) { check.style.background = 'transparent'; check.style.borderColor = '#cbd5e1'; check.textContent = '✓'; check.style.color = 'white'; }
          });
          el.style.borderColor = '#2563eb';
          el.style.background = '#eff6ff';
          const check = el.querySelector('.user-check') as HTMLElement;
          if (check) { check.style.background = '#2563eb'; check.style.borderColor = '#2563eb'; check.textContent = '✓'; check.style.color = 'white'; }
          selectedUid = uid;
          if (footer) footer.style.display = 'block';
          if (selectedName) selectedName.textContent = 'Agregar a: ' + name;
        };

        if (searchInput) {
          searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            document.querySelectorAll('.user-option').forEach(el => {
              const text = el.textContent?.toLowerCase() || '';
              (el as HTMLElement).style.display = text.includes(q) ? 'flex' : 'none';
            });
          });
        }

        document.querySelectorAll('.user-option').forEach(el => {
          el.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLElement;
            const uid = Number(target.dataset['id']);
            const name = target.querySelector('strong')?.textContent || 'Usuario ' + uid;
            selectUser(target, uid, name);
          });
        });

        const btnMiembro = document.getElementById('btn-confirm-miembro');
        const btnAdmin = document.getElementById('btn-confirm-admin');
        const doAdd = (rol: string) => {
          if (!selectedUid) return;
          this.commsService.agregarMiembro(this.selectedChatId!, selectedUid, rol).subscribe({
            next: () => {
              Swal.close();
              this.verInfoGrupo();
              this.cargarStats();
              Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Miembro agregado como ' + rol, showConfirmButton: false, timer: 1500 });
            },
            error: (err) => Swal.fire('Error', err.error?.mensaje || err.message || 'No se pudo agregar miembro', 'error')
          });
        };
        if (btnMiembro) btnMiembro.onclick = () => doAdd('miembro');
        if (btnAdmin) btnAdmin.onclick = () => doAdd('admin');
      }
    });
    });
  }

  editarGrupoModal() {
    const grupo = this.contacts.find(c => c.id === this.selectedChatId)?.grupo;
    if (!grupo) return;

    Swal.fire({
      title: 'Editar Grupo',
      html:
        '<input id="e-nombre" class="swal2-input" placeholder="Nombre" value="' + grupo.nombre + '">' +
        '<textarea id="e-descripcion" class="swal2-textarea" placeholder="Descripción">' + (grupo.descripcion || '') + '</textarea>' +
        '<label style="display:flex; align-items:center; gap:8px; padding:8px 0; font-size:0.85rem;">' +
        '<input id="e-archivado" type="checkbox"' + (grupo.archivado ? ' checked' : '') + '> ' + (grupo.archivado ? 'Desarchivar grupo' : 'Archivar grupo') +
        '</label>',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#2563eb',
      preConfirm: () => {
        const nombre = (document.getElementById('e-nombre') as HTMLInputElement).value;
        const descripcion = (document.getElementById('e-descripcion') as HTMLTextAreaElement).value;
        const archivado = (document.getElementById('e-archivado') as HTMLInputElement).checked;
        if (!nombre) {
          Swal.showValidationMessage('Nombre requerido');
          return false;
        }
        return { nombre, descripcion, archivado };
      }
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        const data: GrupoUpdateRequest = {
          nombre: res.value.nombre,
          descripcion: res.value.descripcion,
          archivado: res.value.archivado
        };
        this.commsService.actualizarGrupo(this.selectedChatId!, data).subscribe({
          next: () => {
            this.cargarGrupos();
            this.cargarStats();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Grupo actualizado', showConfirmButton: false, timer: 1500 });
          },
          error: () => Swal.fire('Error', 'No se pudo actualizar el grupo', 'error')
        });
      }
    });
  }

  // ────────────────────────────────────────
  // CREAR GRUPO
  // ────────────────────────────────────────

  crearNuevoGrupo() {
    Swal.fire({
      title: 'Nuevo Grupo',
      html: '<input id="n-nom" class="swal2-input" placeholder="Nombre"><textarea id="n-des" class="swal2-textarea" placeholder="Descripción"></textarea>',
      preConfirm: () => {
        const nombre = (document.getElementById('n-nom') as HTMLInputElement).value;
        const descripcion = (document.getElementById('n-des') as HTMLTextAreaElement).value;
        if (!nombre) Swal.showValidationMessage('Nombre requerido');
        return { nombre, descripcion };
      }
    }).then((res) => {
      if (res.isConfirmed) {
        this.commsService.crearGrupo(res.value.nombre, res.value.descripcion, this.institucionId, this.currentUserId, true).subscribe({
          next: () => { this.cargarGrupos(); this.cargarStats(); },
          error: () => Swal.fire('Error', 'No se pudo crear el grupo', 'error')
        });
      }
    });
  }

  formatWhatsAppDate(dateString: string | undefined, onlyTimeIfToday: boolean = false): string {
    if (!dateString) return '';
    let normalizedDate = dateString;
    if (!dateString.includes('Z') && !dateString.includes('+')) normalizedDate = dateString.replace(' ', 'T') + 'Z';
    const date = new Date(normalizedDate);
    const now = new Date();
    const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((dNow.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24));
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    if (dDate.getTime() === dNow.getTime()) return date.toLocaleTimeString('es-ES', timeOptions).toLowerCase();
    if (onlyTimeIfToday) return date.toLocaleTimeString('es-ES', timeOptions).toLowerCase();
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7 && diffDays > 0) return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  ejecutarBusqueda() {
    if (!this.searchQuery.trim()) return;
    this.commsService.buscarMensajes(this.currentUserId, this.searchQuery).subscribe({
      next: (resultados) => {
        if (resultados.length === 0) { Swal.fire({ title: 'Sin resultados', icon: 'info' }); return; }
        const html = resultados.map(m => '<div id="s-res-' + m.id + '" style="text-align:left; padding:10px; border-bottom:1px solid #eee; cursor:pointer;"><p style="margin:0;">' + m.contenido + '</p></div>').join('');
        Swal.fire({
          title: 'Resultados',
          html: '<div style="max-height:300px; overflow-y:auto;">' + html + '</div>',
          showConfirmButton: false,
          didOpen: () => {
            resultados.forEach(r => {
              const el = document.getElementById('s-res-' + r.id);
              if (el) el.onclick = () => { this.selectChat(r.grupoId); Swal.close(); };
            });
          }
        });
      }
    });
  }
}
