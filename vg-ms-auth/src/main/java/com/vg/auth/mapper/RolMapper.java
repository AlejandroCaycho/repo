package com.vg.auth.mapper;

import com.vg.auth.domain.dto.RolRequest;
import com.vg.auth.domain.dto.RolResponse;
import com.vg.auth.domain.model.Rol;
import org.springframework.stereotype.Component;

@Component
public class RolMapper {

    public Rol toModel(RolRequest req) {
        return Rol.builder()
                .nombre(req.getNombre())
                .descripcion(req.getDescripcion())
                .esSistema(req.getEsSistema() != null ? req.getEsSistema() : false)
                .build();
    }

    public RolResponse toResponse(Rol r) {
        return RolResponse.builder()
                .id(r.getId())
                .nombre(r.getNombre())
                .descripcion(r.getDescripcion())
                .esSistema(r.getEsSistema())
                .build();
    }

    public void updateModel(Rol rol, RolRequest req) {
        rol.setNombre(req.getNombre());
        rol.setDescripcion(req.getDescripcion());
        rol.setEsSistema(req.getEsSistema() != null ? req.getEsSistema() : false);
    }
}
