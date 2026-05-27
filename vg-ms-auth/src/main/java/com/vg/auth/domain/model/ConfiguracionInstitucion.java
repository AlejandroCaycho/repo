package com.vg.auth.domain.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.OffsetDateTime;

// DDD: Entity interna del agregado Institucion (relación 1:1).
//
// Almacena la configuración específica de cada institución:
// colores corporativos, moneda, rangos de calificación,
// horarios, personalización visual.
//
// Aunque se persiste como tabla propia, pertenece al agregado
// Institucion y solo se accede a través de ella.
@Table("configuracion_institucion")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionInstitucion {

    @Id
    private Integer id;

    @Column("institucion_id")
    private Integer institucionId;

    @Column("escala_calificacion_id")
    private Integer escalaCalificacionId;

    @Column("tema_color_primario")
    private String temaColorPrimario;

    @Column("tema_color_secundario")
    private String temaColorSecundario;

    @Column("logo_url")
    private String logoUrl;

    @Column("mantener_registros_anos")
    private Short mantenerRegistrosAnos;

    @Column("permitir_registro_padres")
    private Boolean permitirRegistroPadres;

    @Column("padres_ven_calificaciones")
    private Boolean padresVenCalificaciones;

    @Column("padres_ven_asistencia")
    private Boolean padresVenAsistencia;

    @Column("padres_ven_tareas")
    private Boolean padresVenTareas;

    @Column("notificacion_inasistencia")
    private Boolean notificacionInasistencia;

    @Column("notificacion_calificacion_baja")
    private Boolean notificacionCalificacionBaja;

    @Column("umbral_calificacion_baja")
    private BigDecimal umbralCalificacionBaja;

    @Column("horario_inicio_clases")
    private LocalTime horarioInicioClases;

    @Column("horario_fin_clases")
    private LocalTime horarioFinClases;

    @Column("dias_laborables")
    private String diasLaborables;

    @Column("idioma_principal")
    private String idiomaPrincipal;

    @Column("zona_horaria")
    private String zonaHoraria;

    private String moneda;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}