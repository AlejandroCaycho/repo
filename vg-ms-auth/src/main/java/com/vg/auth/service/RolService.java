package com.vg.auth.service;

import com.vg.auth.domain.dto.RolRequest;
import com.vg.auth.domain.dto.RolResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Domain Service — contrato para la gestión de entidades Rol.
//
// Define operaciones de negocio: CRUD de roles, filtros
// por tipo (sistema/no sistema).
//
// Esta interfaz pertenece a la capa de dominio (puerto de salida).
public interface RolService {
    // DDD: Comando de negocio — crear un nuevo rol.
    Mono<RolResponse> crear(RolRequest request);
    // DDD: Consulta — listar todos los roles.
    Flux<RolResponse> listarTodos();
    // DDD: Consulta — listar roles no de sistema.
    Flux<RolResponse> listarNoSistema();
    // DDD: Consulta — listar roles de sistema.
    Flux<RolResponse> listarSistema();
    // DDD: Consulta — buscar rol por ID.
    Mono<RolResponse> buscarPorId(Integer id);
    // DDD: Comando de negocio — actualizar datos del rol.
    Mono<RolResponse> actualizar(Integer id, RolRequest request);
    // DDD: Comando de negocio — eliminar un rol.
    Mono<Void> eliminar(Integer id);
}
