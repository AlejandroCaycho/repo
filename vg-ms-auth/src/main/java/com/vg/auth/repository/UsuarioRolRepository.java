package com.vg.auth.repository;

import com.vg.auth.domain.model.UsuarioRol;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Repository — persistencia de asociación Usuario-Rol.
//
// Tabla puente que asigna roles a usuarios, incluyendo
// trazabilidad de quién asignó el rol y cuándo.
public interface UsuarioRolRepository extends ReactiveCrudRepository<UsuarioRol, Integer> {

    @Query("SELECT usuario_id, rol_id, asignado_por, asignado_en FROM usuario_roles WHERE usuario_id = :usuarioId")
    Flux<UsuarioRol> findByUsuarioId(Integer usuarioId);

    @Query("SELECT usuario_id, rol_id, asignado_por, asignado_en FROM usuario_roles WHERE rol_id = :rolId")
    Flux<UsuarioRol> findByRolId(Integer rolId);

    @Query("SELECT EXISTS(SELECT 1 FROM usuario_roles WHERE usuario_id = :usuarioId AND rol_id = :rolId)")
    Mono<Boolean> existsByUsuarioIdAndRolId(Integer usuarioId, Integer rolId);

    @Query("SELECT EXISTS(SELECT 1 FROM usuario_roles WHERE usuario_id = :usuarioId)")
    Mono<Boolean> existsByUsuarioId(Integer usuarioId);

    @Query("SELECT EXISTS(SELECT 1 FROM usuario_roles WHERE rol_id = :rolId)")
    Mono<Boolean> existsByRolId(Integer rolId);

    @Query("SELECT usuario_id, rol_id, asignado_por, asignado_en FROM usuario_roles WHERE usuario_id = :usuarioId AND rol_id = :rolId")
    Mono<UsuarioRol> findByUsuarioIdAndRolId(Integer usuarioId, Integer rolId);

    @Modifying
    @Query("""
            INSERT INTO usuario_roles (usuario_id, rol_id, asignado_por, asignado_en)
            VALUES (:usuarioId, :rolId, :asignadoPor, COALESCE(:asignadoEn, now()))
            ON CONFLICT DO NOTHING
            """)
    Mono<Integer> insert(Integer usuarioId, Integer rolId, Integer asignadoPor, java.time.OffsetDateTime asignadoEn);

    @Modifying
    @Query("DELETE FROM usuario_roles WHERE usuario_id = :usuarioId AND rol_id = :rolId")
    Mono<Integer> deleteByUsuarioIdAndRolId(Integer usuarioId, Integer rolId);

    @Modifying
    @Query("DELETE FROM usuario_roles WHERE rol_id = :rolId")
    Mono<Integer> deleteByRolId(Integer rolId);
}
