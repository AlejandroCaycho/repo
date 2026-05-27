package com.vg.auth.repository;

import com.vg.auth.domain.model.AuditLog;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

// DDD: Repository — persistencia de AuditLog (event store de auditoría).
//
// Registra eventos de auditoría con datos anteriores y nuevos en formato JSONB.
// Funciona como un event store para trazabilidad de cambios en el dominio.
public interface AuditLogRepository extends ReactiveCrudRepository<AuditLog, Long> {

    @Query("""
            INSERT INTO audit_log
            (usuario_id, tabla, registro_id, accion, datos_anteriores, datos_nuevos, ip_origen, user_agent, created_at)
            VALUES (:usuarioId, :tabla, :registroId, :accion, CAST(:datosAnteriores AS jsonb), CAST(:datosNuevos AS jsonb), :ipOrigen, :userAgent, :createdAt)
            RETURNING *
            """)
    Mono<AuditLog> registrar(Integer usuarioId,
                             String tabla,
                             Integer registroId,
                             String accion,
                             String datosAnteriores,
                             String datosNuevos,
                             String ipOrigen,
                             String userAgent,
                             OffsetDateTime createdAt);

    Flux<AuditLog> findByUsuarioId(Integer usuarioId);
    Flux<AuditLog> findByTabla(String tabla);
    Flux<AuditLog> findByTablaAndRegistroId(String tabla, Integer registroId);
    Flux<AuditLog> findByAccion(String accion);
}
