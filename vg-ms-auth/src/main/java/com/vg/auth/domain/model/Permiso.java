package com.vg.auth.domain.model;

import com.vg.auth.domain.model.Entity;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

// DDD: Entity — define una acción granular sobre un módulo del sistema.
//
// Representa un permiso atómico como "USUARIOS.CREAR" o "ROLES.ELIMINAR".
// Los permisos se asignan a roles mediante la join table RolPermiso.
@Table("permisos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permiso implements Entity {

    @Id
    private Integer id;

    private String modulo;
    private String accion;
    private String descripcion;
    private String estado;
}