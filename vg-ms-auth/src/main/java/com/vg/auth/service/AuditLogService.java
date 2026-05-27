package com.vg.auth.service;

import com.vg.auth.domain.dto.AuditLogRequest;
import com.vg.auth.domain.dto.AuditLogResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Domain Service — contrato para registro y consulta de auditoría.
//
// Define operaciones para registrar eventos de auditoría
// y consultarlos por usuario, tabla, registro o acción.
//
// Esta interfaz pertenece a la capa de dominio (puerto de salida).
public interface AuditLogService {
    Mono<AuditLogResponse> registrar(AuditLogRequest request);
    Flux<AuditLogResponse> listarTodos();
    Flux<AuditLogResponse> listarPorUsuario(Integer usuarioId);
    Flux<AuditLogResponse> listarPorTabla(String tabla);
    Flux<AuditLogResponse> listarPorTablaYRegistro(String tabla, Integer registroId);
    Flux<AuditLogResponse> listarPorAccion(String accion);
    Mono<AuditLogResponse> buscarPorId(Long id);
    Mono<Void> eliminar(Long id);
}