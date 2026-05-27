package com.vg.auth.service;

import com.vg.auth.domain.dto.InstitucionRequest;
import com.vg.auth.domain.dto.InstitucionResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

// DDD: Domain Service — contrato para gestión de entidades Institucion.
//
// Define operaciones de negocio: CRUD, activación/desactivación,
// consulta por estado de instituciones educativas.
//
// Esta interfaz pertenece a la capa de dominio (puerto de salida).
public interface InstitucionService {
    Mono<InstitucionResponse> crear(InstitucionRequest request);
    Flux<InstitucionResponse> listarActivas();
    Flux<InstitucionResponse> listarTodas();
    Flux<InstitucionResponse> listarPorEstado(String estado);
    Mono<InstitucionResponse> buscarPorId(Integer id);
    Mono<InstitucionResponse> buscarPorUuid(UUID uuid);
    Mono<InstitucionResponse> actualizar(UUID uuid, InstitucionRequest request);
    Mono<InstitucionResponse> desactivar(UUID uuid);
    Mono<InstitucionResponse> activar(UUID uuid);
    Mono<Void> eliminar(UUID uuid);
}
