package com.vg.auth.mapper;

import com.vg.auth.domain.dto.PermisoRequest;
import com.vg.auth.domain.dto.PermisoResponse;
import com.vg.auth.domain.model.Permiso;
import org.springframework.stereotype.Component;

@Component
public class PermisoMapper {

    public Permiso toModel(PermisoRequest req) {
        return Permiso.builder()
                .modulo(req.getModulo())
                .accion(req.getAccion())
                .descripcion(req.getDescripcion())
                .build();
    }

    public PermisoResponse toResponse(Permiso p) {
        return PermisoResponse.builder()
                .id(p.getId())
                .modulo(p.getModulo())
                .accion(p.getAccion())
                .descripcion(p.getDescripcion())
                .estado(p.getEstado())
                .build();
    }

    public void updateModel(Permiso permiso, PermisoRequest req) {
        permiso.setModulo(req.getModulo());
        permiso.setAccion(req.getAccion());
        permiso.setDescripcion(req.getDescripcion());
    }
}