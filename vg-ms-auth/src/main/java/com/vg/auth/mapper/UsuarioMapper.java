package com.vg.auth.mapper;

import com.vg.auth.domain.dto.UsuarioRequest;
import com.vg.auth.domain.dto.UsuarioResponse;
import com.vg.auth.domain.model.Usuario;
import com.vg.auth.util.DateUtil;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
// DDD: Infrastructure — mapeo entre dominio y DTOs de aplicación.
//
// Convierte objetos del dominio (Usuario) a DTOs (UsuarioRequest/Response)
// y viceversa. Aísla la capa de dominio de los formatos de entrada/salida.
public class UsuarioMapper {

    public Usuario toModel(UsuarioRequest req, String contrasenaHash) {
        return Usuario.builder()
                .uuid(UUID.randomUUID())
                .institucionId(req.getInstitucionId())
                .nombre(req.getNombre())
                .email(req.getEmail())
                .contrasenaHash(contrasenaHash)
                .telefono(req.getTelefono())
                .fotoUrl(req.getFotoUrl())
                .estado("activo")
                .intentosFallidos((short) 0)
                .requiereCambioPwd(false)
                .createdAt(DateUtil.now())
                .updatedAt(DateUtil.now())
                .build();
    }

    public UsuarioResponse toResponse(Usuario u) {
        return UsuarioResponse.builder()
                .id(u.getId())
                .uuid(u.getUuid())
                .institucionId(u.getInstitucionId())
                .nombre(u.getNombre())
                .email(u.getEmail())
                .telefono(u.getTelefono())
                .fotoUrl(u.getFotoUrl())
                .estado(u.getEstado())
                .ultimoAcceso(DateUtil.formatDateTime(u.getUltimoAcceso()))
                .requiereCambioPwd(u.getRequiereCambioPwd())
                .intentosFallidos(u.getIntentosFallidos())
                .bloqueadoHasta(DateUtil.formatDateTime(u.getBloqueadoHasta()))
                .createdAt(DateUtil.formatDateTime(u.getCreatedAt()))
                .updatedAt(DateUtil.formatDateTime(u.getUpdatedAt()))
                .build();
    }

    public void updateModel(Usuario u, UsuarioRequest req) {
        u.setInstitucionId(req.getInstitucionId());
        u.setNombre(req.getNombre());
        u.setEmail(req.getEmail());
        u.setTelefono(req.getTelefono());
        u.setFotoUrl(req.getFotoUrl());
        u.setUpdatedAt(DateUtil.now());
    }
}
