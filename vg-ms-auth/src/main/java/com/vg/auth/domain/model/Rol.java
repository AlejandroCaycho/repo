package com.vg.auth.domain.model;

import com.vg.auth.domain.model.AggregateRoot;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

// DDD: Aggregate Root del agregado "Rol".
//
// Es la entidad raíz del agregado que contiene a RolPermiso
// como entidad interna (join table con Permiso).
//
// Contiene comportamiento de negocio: verificación de rol de sistema.
@Table("roles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Rol implements AggregateRoot {

    @Id
    private Integer id;

    private String nombre;
    private String descripcion;

    @Column("es_sistema")
    private Boolean esSistema;

    // DDD: Comportamiento — true si es rol del sistema (no se puede eliminar).
    public boolean esSistema() {
        return Boolean.TRUE.equals(this.esSistema);
    }
}