package com.vg.auth.service;

import com.vg.auth.domain.dto.UsuarioRequest;
import com.vg.auth.domain.dto.UsuarioResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

// DDD: Domain Service — contrato para la gestión de entidades Usuario.
//
// Define operaciones de negocio: CRUD, activación/desactivación,
// subida de fotos de perfil.
//
// Esta interfaz pertenece a la capa de dominio (puerto de salida).
public interface UsuarioService {
    // DDD: Comando de negocio — crear un nuevo usuario en el sistema.
    Mono<UsuarioResponse> crear(UsuarioRequest request);
    // DDD: Consulta — listar todos los usuarios.
    Flux<UsuarioResponse> listarTodos();
    // DDD: Consulta — listar usuarios por institución.
    Flux<UsuarioResponse> listarPorInstitucion(Integer institucionId);
    // DDD: Consulta — listar usuarios por estado (activo/inactivo/bloqueado).
    Flux<UsuarioResponse> listarPorEstado(String estado);
    // DDD: Consulta — listar usuarios por institución y estado.
    Flux<UsuarioResponse> listarPorInstitucionYEstado(Integer institucionId, String estado);
    // DDD: Consulta — buscar usuario por ID.
    Mono<UsuarioResponse> buscarPorId(Integer id);
    // DDD: Consulta — buscar usuario por UUID.
    Mono<UsuarioResponse> buscarPorUuid(UUID uuid);
    // DDD: Comando de negocio — actualizar datos del usuario.
    Mono<UsuarioResponse> actualizar(UUID uuid, UsuarioRequest request);
    // DDD: Comando de negocio — desactivar usuario.
    Mono<UsuarioResponse> desactivar(UUID uuid);
    // DDD: Comando de negocio — activar usuario.
    Mono<UsuarioResponse> activar(UUID uuid);
    // DDD: Comando de negocio — eliminar usuario del sistema.
    Mono<Void> eliminar(UUID uuid);
    // DDD: Comando de negocio — subir foto de perfil.
    Mono<UsuarioResponse> subirFoto(UUID uuid, org.springframework.http.codec.multipart.FilePart file);
}
