package com.vg.auth.repository;

import com.vg.auth.domain.model.Permiso;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Repository — persistencia de Aggregate Root Permiso.
//
// Define consultas específicas del dominio para permisos,
// incluyendo la búsqueda por módulo, rol y email de usuario.
public interface PermisoRepository extends ReactiveCrudRepository<Permiso, Integer> {

    Flux<Permiso> findByModulo(String modulo);
    Mono<Boolean> existsByModuloAndAccion(String modulo, String accion);
    Mono<Boolean> existsByModuloAndAccionAndIdNot(String modulo, String accion, Integer id);

    @Query("""
            SELECT p.id, p.modulo, p.accion, p.descripcion, p.estado
            FROM permisos p
            INNER JOIN rol_permisos rp ON rp.permiso_id = p.id
            WHERE rp.rol_id = :rolId
            ORDER BY p.modulo, p.accion
            """)
    Flux<Permiso> findByRolId(Integer rolId);

    @Query("""
            SELECT DISTINCT p.id, p.modulo, p.accion, p.descripcion, p.estado
            FROM permisos p
            INNER JOIN rol_permisos rp ON rp.permiso_id = p.id
            INNER JOIN usuario_roles ur ON ur.rol_id = rp.rol_id
            INNER JOIN usuarios u ON u.id = ur.usuario_id
            WHERE u.email = :email
            ORDER BY p.modulo, p.accion
            """)
    Flux<Permiso> findPermissionsByUserEmail(String email);
}
