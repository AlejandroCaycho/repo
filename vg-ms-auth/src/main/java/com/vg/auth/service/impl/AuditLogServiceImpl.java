package com.vg.auth.service.impl;

import com.vg.auth.domain.dto.AuditLogRequest;
import com.vg.auth.domain.dto.AuditLogResponse;
import com.vg.auth.exception.NotFoundException;
import com.vg.auth.mapper.AuditLogMapper;
import com.vg.auth.repository.AuditLogRepository;
import com.vg.auth.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
// DDD: Domain Service — registro y consulta de eventos de auditoría.
//
// Implementa los casos de uso del dominio para persistir
// y consultar eventos de auditoría con datos anteriores
// y nuevos en formato JSON.
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository repository;
    private final AuditLogMapper mapper;

    @Override
    public Mono<AuditLogResponse> registrar(AuditLogRequest request) {
        var auditLog = mapper.toModel(request);
        return repository.registrar(
                        auditLog.getUsuarioId(),
                        auditLog.getTabla(),
                        auditLog.getRegistroId(),
                        auditLog.getAccion(),
                        auditLog.getDatosAnteriores(),
                        auditLog.getDatosNuevos(),
                        auditLog.getIpOrigen(),
                        auditLog.getUserAgent(),
                        auditLog.getCreatedAt()
                )
                .map(mapper::toResponse);
    }

    @Override
    public Flux<AuditLogResponse> listarTodos() {
        return repository.findAll()
                .map(mapper::toResponse);
    }

    @Override
    public Flux<AuditLogResponse> listarPorUsuario(Integer usuarioId) {
        return repository.findByUsuarioId(usuarioId)
                .map(mapper::toResponse);
    }

    @Override
    public Flux<AuditLogResponse> listarPorTabla(String tabla) {
        return repository.findByTabla(tabla)
                .map(mapper::toResponse);
    }

    @Override
    public Flux<AuditLogResponse> listarPorTablaYRegistro(String tabla, Integer registroId) {
        return repository.findByTablaAndRegistroId(tabla, registroId)
                .map(mapper::toResponse);
    }

    @Override
    public Flux<AuditLogResponse> listarPorAccion(String accion) {
        return repository.findByAccion(accion)
                .map(mapper::toResponse);
    }

    @Override
    public Mono<AuditLogResponse> buscarPorId(Long id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Registro de auditoría no encontrado")))
                .map(mapper::toResponse);
    }

    @Override
    public Mono<Void> eliminar(Long id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Registro de auditoría no encontrado")))
                .flatMap(repository::delete);
    }
}
