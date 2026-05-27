package com.vg.auth.domain.model;

import com.vg.auth.domain.model.Entity;
import lombok.*;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

// DDD: Entity interna del agregado Rol (join table).
//
// Implementa la relación muchos-a-muchos entre Roles y Permisos.
// Pertenece al agregado Rol y solo se accede a través de él.
@Table("rol_permisos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolPermiso implements Entity {

    @Column("rol_id")
    private Integer rolId;

    @Column("permiso_id")
    private Integer permisoId;
}