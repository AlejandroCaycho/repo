package com.vg.auth.domain.model;

import com.vg.auth.domain.model.AggregateRoot;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

// DDD: Aggregate Root del agregado "Institucion".
//
// Es la entidad raíz del agregado que contiene a ConfiguracionInstitucion
// como entidad interna con relación 1:1.
//
// Contiene comportamiento de negocio: verificación de estado activo,
// activación/desactivación.
@Table("instituciones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Institucion implements AggregateRoot {

    @Id
    private Integer id;

    private UUID uuid;
    private String nombre;

    @Column("nombre_corto")
    private String nombreCorto;

    private String email;

    @Column("email_secundario")
    private String emailSecundario;

    private String telefono;

    @Column("telefono_secundario")
    private String telefonoSecundario;

    @Column("sitio_web")
    private String sitioWeb;

    private String direccion;
    private String ciudad;
    private String departamento;
    private String pais;

    @Column("codigo_postal")
    private String codigoPostal;

    @Column("logo_url")
    private String logoUrl;

    @Column("tipo_institucion")
    private String tipoInstitucion;

    @Column("codigo_modular")
    private String codigoModular;

    @Column("resolucion_creacion")
    private String resolucionCreacion;

    private Boolean activa;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;

    // DDD: Comportamiento — verifica si la institución está activa.
    public boolean estaActiva() {
        return Boolean.TRUE.equals(this.activa);
    }

    // DDD: Comportamiento — desactiva la institución.
    public void desactivar() {
        this.activa = false;
        this.updatedAt = OffsetDateTime.now();
    }

    // DDD: Comportamiento — activa la institución.
    public void activar() {
        this.activa = true;
        this.updatedAt = OffsetDateTime.now();
    }
}