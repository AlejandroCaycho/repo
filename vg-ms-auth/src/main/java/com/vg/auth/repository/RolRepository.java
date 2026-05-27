package com.vg.auth.repository;

import com.vg.auth.domain.model.Rol;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Repository — persistencia de Aggregate Root Rol.
//
// Define consultas específicas del dominio para roles,
// incluyendo la búsqueda de roles por email de usuario.
public interface RolRepository extends ReactiveCrudRepository<Rol, Integer> {

    Mono<Rol> findByNombre(String nombre);
    Mono<Boolean> existsByNombre(String nombre);
    Mono<Boolean> existsByNombreAndIdNot(String nombre, Integer id);
    Flux<Rol> findByEsSistemaFalse();
    Flux<Rol> findByEsSistemaTrue();

    @Query("""
        SELECT r.* FROM roles r
        JOIN usuario_roles ur ON r.id = ur.rol_id
        JOIN usuarios u ON u.id = ur.usuario_id
        WHERE u.email = :email
    """)
    Flux<Rol> findRolesByUserEmail(String email);
}
