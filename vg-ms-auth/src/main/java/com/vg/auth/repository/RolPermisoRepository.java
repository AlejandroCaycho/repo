package com.vg.auth.repository;

import com.vg.auth.domain.model.RolPermiso;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Repository — persistencia de asociación Rol-Permiso.
//
// Tabla puente que implementa la relación muchos-a-muchos
// entre roles y permisos en el modelo de dominio.
public interface RolPermisoRepository extends ReactiveCrudRepository<RolPermiso, Integer> {

    @Query("SELECT rol_id, permiso_id FROM rol_permisos WHERE rol_id = :rolId")
    Flux<RolPermiso> findByRolId(Integer rolId);

    @Query("SELECT rol_id, permiso_id FROM rol_permisos WHERE permiso_id = :permisoId")
    Flux<RolPermiso> findByPermisoId(Integer permisoId);

    @Query("SELECT EXISTS(SELECT 1 FROM rol_permisos WHERE rol_id = :rolId AND permiso_id = :permisoId)")
    Mono<Boolean> existsByRolIdAndPermisoId(Integer rolId, Integer permisoId);

    @Query("SELECT EXISTS(SELECT 1 FROM rol_permisos WHERE rol_id = :rolId)")
    Mono<Boolean> existsByRolId(Integer rolId);

    @Query("SELECT EXISTS(SELECT 1 FROM rol_permisos WHERE permiso_id = :permisoId)")
    Mono<Boolean> existsByPermisoId(Integer permisoId);

    @Query("SELECT rol_id, permiso_id FROM rol_permisos WHERE rol_id = :rolId AND permiso_id = :permisoId")
    Mono<RolPermiso> findByRolIdAndPermisoId(Integer rolId, Integer permisoId);

    @Modifying
    @Query("INSERT INTO rol_permisos (rol_id, permiso_id) VALUES (:rolId, :permisoId) ON CONFLICT DO NOTHING")
    Mono<Integer> insert(Integer rolId, Integer permisoId);

    @Modifying
    @Query("DELETE FROM rol_permisos WHERE rol_id = :rolId AND permiso_id = :permisoId")
    Mono<Integer> deleteByRolIdAndPermisoId(Integer rolId, Integer permisoId);

    @Modifying
    @Query("DELETE FROM rol_permisos WHERE rol_id = :rolId")
    Mono<Integer> deleteByRolId(Integer rolId);

    @Modifying
    @Query("DELETE FROM rol_permisos WHERE permiso_id = :permisoId")
    Mono<Integer> deleteByPermisoId(Integer permisoId);
}
