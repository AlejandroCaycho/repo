package com.vg.auth.mapper;

import com.vg.auth.domain.dto.UsuarioRolRequest;
import com.vg.auth.domain.dto.UsuarioRolResponse;
import com.vg.auth.domain.model.UsuarioRol;
import com.vg.auth.util.DateUtil;
import org.springframework.stereotype.Component;

@Component
public class UsuarioRolMapper {

    public UsuarioRol toModel(UsuarioRolRequest req) {
        return UsuarioRol.builder()
                .usuarioId(req.getUsuarioId())
                .rolId(req.getRolId())
                .asignadoPor(req.getAsignadoPor())
                .asignadoEn(DateUtil.now())
                .build();
    }

    public UsuarioRolResponse toResponse(UsuarioRol ur) {
        return UsuarioRolResponse.builder()
                .usuarioId(ur.getUsuarioId())
                .rolId(ur.getRolId())
                .asignadoPor(ur.getAsignadoPor())
                .asignadoEn(DateUtil.formatDateTime(ur.getAsignadoEn()))
                .build();
    }
}
