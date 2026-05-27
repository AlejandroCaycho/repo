package com.vg.auth.service;

import com.vg.auth.domain.dto.UsuarioRolRequest;
import com.vg.auth.domain.dto.UsuarioRolResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Domain Service — contrato para asignación de roles a usuarios.
//
// Define operaciones de negocio: asignar rol, listar relaciones
// por usuario o rol, y remover asignaciones.
//
// Esta interfaz pertenece a la capa de dominio (puerto de salida).
public interface UsuarioRolService {
    Mono<UsuarioRolResponse> asignarRol(UsuarioRolRequest request);
    Flux<UsuarioRolResponse> listarTodos();
    Flux<UsuarioRolResponse> listarRolesPorUsuario(Integer usuarioId);
    Flux<UsuarioRolResponse> listarUsuariosPorRol(Integer rolId);
    Mono<Void> quitarRol(Integer usuarioId, Integer rolId);
}
