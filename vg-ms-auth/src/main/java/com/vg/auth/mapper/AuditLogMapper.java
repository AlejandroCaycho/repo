package com.vg.auth.mapper;

import com.vg.auth.domain.dto.AuditLogRequest;
import com.vg.auth.domain.dto.AuditLogResponse;
import com.vg.auth.domain.model.AuditLog;
import com.vg.auth.util.DateUtil;
import org.springframework.stereotype.Component;

@Component
public class AuditLogMapper {

    public AuditLog toModel(AuditLogRequest req) {
        return AuditLog.builder()
                .usuarioId(req.getUsuarioId())
                .tabla(req.getTabla())
                .registroId(req.getRegistroId())
                .accion(req.getAccion())
                .datosAnteriores(req.getDatosAnteriores())
                .datosNuevos(req.getDatosNuevos())
                .ipOrigen(req.getIpOrigen())
                .userAgent(req.getUserAgent())
                .createdAt(DateUtil.now())
                .build();
    }

    public AuditLogResponse toResponse(AuditLog a) {
        return AuditLogResponse.builder()
                .id(a.getId())
                .usuarioId(a.getUsuarioId())
                .tabla(a.getTabla())
                .registroId(a.getRegistroId())
                .accion(a.getAccion())
                .datosAnteriores(a.getDatosAnteriores())
                .datosNuevos(a.getDatosNuevos())
                .ipOrigen(a.getIpOrigen())
                .userAgent(a.getUserAgent())
                .createdAt(DateUtil.formatDateTime(a.getCreatedAt()))
                .build();
    }
}
