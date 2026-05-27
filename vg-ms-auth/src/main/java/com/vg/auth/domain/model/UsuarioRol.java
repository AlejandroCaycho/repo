package com.vg.auth.domain.model;

import com.vg.auth.domain.model.Entity;
import lombok.*;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

// DDD: Entity interna del agregado Usuario (join table).
//
// Implementa la relación muchos-a-muchos entre Usuarios y Roles.
// Pertenece al agregado Usuario y solo se accede a través de él.
@Table("usuario_roles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRol implements Entity {

    @Column("usuario_id")
    private Integer usuarioId;

    @Column("rol_id")
    private Integer rolId;

    @Column("asignado_por")
    private Integer asignadoPor;

    @Column("asignado_en")
    private OffsetDateTime asignadoEn;
}