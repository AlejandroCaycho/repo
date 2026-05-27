package com.vg.auth.service;

import com.vg.auth.domain.dto.PermisoRequest;
import com.vg.auth.domain.dto.PermisoResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Domain Service — contrato para la gestión de entidades Permiso.
//
// Define operaciones de negocio: CRUD de permisos, asignación
// y remoción de permisos a roles.
//
// Esta interfaz pertenece a la capa de dominio (puerto de salida).
public interface PermisoService {
    // DDD: Comando de negocio — crear un nuevo permiso.
    Mono<PermisoResponse> crear(PermisoRequest request);
    // DDD: Consulta — listar todos los permisos.
    Flux<PermisoResponse> listarTodos();
    // DDD: Consulta — listar permisos por módulo.
    Flux<PermisoResponse> listarPorModulo(String modulo);
    // DDD: Consulta — listar permisos asignados a un rol.
    Flux<PermisoResponse> listarPorRol(Integer rolId);
    // DDD: Consulta — buscar permiso por ID.
    Mono<PermisoResponse> buscarPorId(Integer id);
    // DDD: Comando de negocio — actualizar datos del permiso.
    Mono<PermisoResponse> actualizar(Integer id, PermisoRequest request);
    // DDD: Comando de negocio — cambiar estado del permiso.
    Mono<PermisoResponse> cambiarEstado(Integer id, String estado);
    // DDD: Comando de negocio — eliminar un permiso.
    Mono<Void> eliminar(Integer id);
    // DDD: Comando de negocio — asignar permiso a un rol.
    Mono<Void> asignarPermiso(Integer rolId, Integer permisoId);
    // DDD: Comando de negocio — quitar permiso de un rol.
    Mono<Void> quitarPermiso(Integer rolId, Integer permisoId);
}
