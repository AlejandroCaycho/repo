package com.vg.auth.mapper;

import com.vg.auth.domain.dto.ConfiguracionInstitucionRequest;
import com.vg.auth.domain.dto.ConfiguracionInstitucionResponse;
import com.vg.auth.domain.model.ConfiguracionInstitucion;
import com.vg.auth.util.DateUtil;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalTime;

@Component
public class ConfiguracionInstitucionMapper {

    public ConfiguracionInstitucion toModel(ConfiguracionInstitucionRequest req) {
        return ConfiguracionInstitucion.builder()
                .institucionId(req.getInstitucionId())
                .escalaCalificacionId(req.getEscalaCalificacionId())
                .temaColorPrimario(req.getTemaColorPrimario() != null ? req.getTemaColorPrimario() : "#1A73E8")
                .temaColorSecundario(req.getTemaColorSecundario() != null ? req.getTemaColorSecundario() : "#34A853")
                .logoUrl(req.getLogoUrl())
                .mantenerRegistrosAnos(req.getMantenerRegistrosAnos() != null ? req.getMantenerRegistrosAnos() : 5)
                .permitirRegistroPadres(req.getPermitirRegistroPadres() != null ? req.getPermitirRegistroPadres() : true)
                .padresVenCalificaciones(req.getPadresVenCalificaciones() != null ? req.getPadresVenCalificaciones() : true)
                .padresVenAsistencia(req.getPadresVenAsistencia() != null ? req.getPadresVenAsistencia() : true)
                .padresVenTareas(req.getPadresVenTareas() != null ? req.getPadresVenTareas() : true)
                .notificacionInasistencia(req.getNotificacionInasistencia() != null ? req.getNotificacionInasistencia() : true)
                .notificacionCalificacionBaja(req.getNotificacionCalificacionBaja() != null ? req.getNotificacionCalificacionBaja() : true)
                .umbralCalificacionBaja(req.getUmbralCalificacionBaja() != null ? req.getUmbralCalificacionBaja() : BigDecimal.valueOf(11.00))
                .horarioInicioClases(req.getHorarioInicioClases() != null ? req.getHorarioInicioClases() : LocalTime.of(7, 30))
                .horarioFinClases(req.getHorarioFinClases() != null ? req.getHorarioFinClases() : LocalTime.of(15, 0))
                .diasLaborables(req.getDiasLaborables() != null ? req.getDiasLaborables() : "lunes,martes,miercoles,jueves,viernes")
                .idiomaPrincipal(req.getIdiomaPrincipal() != null ? req.getIdiomaPrincipal() : "es")
                .zonaHoraria(req.getZonaHoraria() != null ? req.getZonaHoraria() : "America/Lima")
                .moneda(req.getMoneda() != null ? req.getMoneda() : "PEN")
                .createdAt(DateUtil.now())
                .updatedAt(DateUtil.now())
                .build();
    }

    public ConfiguracionInstitucionResponse toResponse(ConfiguracionInstitucion c) {
        return ConfiguracionInstitucionResponse.builder()
                .id(c.getId())
                .institucionId(c.getInstitucionId())
                .escalaCalificacionId(c.getEscalaCalificacionId())
                .temaColorPrimario(c.getTemaColorPrimario())
                .temaColorSecundario(c.getTemaColorSecundario())
                .logoUrl(c.getLogoUrl())
                .mantenerRegistrosAnos(c.getMantenerRegistrosAnos())
                .permitirRegistroPadres(c.getPermitirRegistroPadres())
                .padresVenCalificaciones(c.getPadresVenCalificaciones())
                .padresVenAsistencia(c.getPadresVenAsistencia())
                .padresVenTareas(c.getPadresVenTareas())
                .notificacionInasistencia(c.getNotificacionInasistencia())
                .notificacionCalificacionBaja(c.getNotificacionCalificacionBaja())
                .umbralCalificacionBaja(c.getUmbralCalificacionBaja())
                .horarioInicioClases(DateUtil.formatTime(c.getHorarioInicioClases()))
                .horarioFinClases(DateUtil.formatTime(c.getHorarioFinClases()))
                .diasLaborables(c.getDiasLaborables())
                .idiomaPrincipal(c.getIdiomaPrincipal())
                .zonaHoraria(c.getZonaHoraria())
                .moneda(c.getMoneda())
                .createdAt(DateUtil.formatDateTime(c.getCreatedAt()))
                .updatedAt(DateUtil.formatDateTime(c.getUpdatedAt()))
                .build();
    }

    public void updateModel(ConfiguracionInstitucion c, ConfiguracionInstitucionRequest req) {
        if (req.getEscalaCalificacionId() != null) c.setEscalaCalificacionId(req.getEscalaCalificacionId());
        if (req.getTemaColorPrimario() != null) c.setTemaColorPrimario(req.getTemaColorPrimario());
        if (req.getTemaColorSecundario() != null) c.setTemaColorSecundario(req.getTemaColorSecundario());
        if (req.getLogoUrl() != null) c.setLogoUrl(req.getLogoUrl());
        if (req.getMantenerRegistrosAnos() != null) c.setMantenerRegistrosAnos(req.getMantenerRegistrosAnos());
        if (req.getPermitirRegistroPadres() != null) c.setPermitirRegistroPadres(req.getPermitirRegistroPadres());
        if (req.getPadresVenCalificaciones() != null) c.setPadresVenCalificaciones(req.getPadresVenCalificaciones());
        if (req.getPadresVenAsistencia() != null) c.setPadresVenAsistencia(req.getPadresVenAsistencia());
        if (req.getPadresVenTareas() != null) c.setPadresVenTareas(req.getPadresVenTareas());
        if (req.getNotificacionInasistencia() != null) c.setNotificacionInasistencia(req.getNotificacionInasistencia());
        if (req.getNotificacionCalificacionBaja() != null) c.setNotificacionCalificacionBaja(req.getNotificacionCalificacionBaja());
        if (req.getUmbralCalificacionBaja() != null) c.setUmbralCalificacionBaja(req.getUmbralCalificacionBaja());
        if (req.getHorarioInicioClases() != null) c.setHorarioInicioClases(req.getHorarioInicioClases());
        if (req.getHorarioFinClases() != null) c.setHorarioFinClases(req.getHorarioFinClases());
        if (req.getDiasLaborables() != null) c.setDiasLaborables(req.getDiasLaborables());
        if (req.getIdiomaPrincipal() != null) c.setIdiomaPrincipal(req.getIdiomaPrincipal());
        if (req.getZonaHoraria() != null) c.setZonaHoraria(req.getZonaHoraria());
        if (req.getMoneda() != null) c.setMoneda(req.getMoneda());
        c.setUpdatedAt(DateUtil.now());
    }
}
