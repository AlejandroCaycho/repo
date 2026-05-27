package com.vg.auth.domain.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracionInstitucionResponse {

    private Integer id;
    private Integer institucionId;
    private Integer escalaCalificacionId;
    private String temaColorPrimario;
    private String temaColorSecundario;
    private String logoUrl;
    private Short mantenerRegistrosAnos;
    private Boolean permitirRegistroPadres;
    private Boolean padresVenCalificaciones;
    private Boolean padresVenAsistencia;
    private Boolean padresVenTareas;
    private Boolean notificacionInasistencia;
    private Boolean notificacionCalificacionBaja;
    private BigDecimal umbralCalificacionBaja;
    private String horarioInicioClases;
    private String horarioFinClases;
    private String diasLaborables;
    private String idiomaPrincipal;
    private String zonaHoraria;
    private String moneda;
    private String createdAt;
    private String updatedAt;
}
