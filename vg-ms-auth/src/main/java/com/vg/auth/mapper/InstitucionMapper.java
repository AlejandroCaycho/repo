package com.vg.auth.mapper;

import com.vg.auth.domain.dto.InstitucionRequest;
import com.vg.auth.domain.dto.InstitucionResponse;
import com.vg.auth.domain.model.Institucion;
import com.vg.auth.util.DateUtil;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class InstitucionMapper {

    public Institucion toModel(InstitucionRequest req) {
        return Institucion.builder()
                .uuid(UUID.randomUUID())
                .nombre(req.getNombre())
                .nombreCorto(req.getNombreCorto())
                .email(req.getEmail())
                .emailSecundario(req.getEmailSecundario())
                .telefono(req.getTelefono())
                .telefonoSecundario(req.getTelefonoSecundario())
                .sitioWeb(req.getSitioWeb())
                .direccion(req.getDireccion())
                .ciudad(req.getCiudad())
                .departamento(req.getDepartamento())
                .pais(req.getPais() != null ? req.getPais() : "Perú")
                .codigoPostal(req.getCodigoPostal())
                .logoUrl(req.getLogoUrl())
                .tipoInstitucion(req.getTipoInstitucion())
                .codigoModular(req.getCodigoModular())
                .resolucionCreacion(req.getResolucionCreacion())
                .activa(true)
                .createdAt(DateUtil.now())
                .updatedAt(DateUtil.now())
                .build();
    }

    public InstitucionResponse toResponse(Institucion i) {
        return InstitucionResponse.builder()
                .id(i.getId())
                .uuid(i.getUuid())
                .nombre(i.getNombre())
                .nombreCorto(i.getNombreCorto())
                .email(i.getEmail())
                .emailSecundario(i.getEmailSecundario())
                .telefono(i.getTelefono())
                .telefonoSecundario(i.getTelefonoSecundario())
                .sitioWeb(i.getSitioWeb())
                .direccion(i.getDireccion())
                .ciudad(i.getCiudad())
                .departamento(i.getDepartamento())
                .pais(i.getPais())
                .codigoPostal(i.getCodigoPostal())
                .logoUrl(i.getLogoUrl())
                .tipoInstitucion(i.getTipoInstitucion())
                .codigoModular(i.getCodigoModular())
                .resolucionCreacion(i.getResolucionCreacion())
                .activa(i.getActiva())
                .createdAt(DateUtil.formatDateTime(i.getCreatedAt()))
                .updatedAt(DateUtil.formatDateTime(i.getUpdatedAt()))
                .build();
    }

    public void updateModel(Institucion inst, InstitucionRequest req) {
        inst.setNombre(req.getNombre());
        inst.setNombreCorto(req.getNombreCorto());
        inst.setEmail(req.getEmail());
        inst.setEmailSecundario(req.getEmailSecundario());
        inst.setTelefono(req.getTelefono());
        inst.setTelefonoSecundario(req.getTelefonoSecundario());
        inst.setSitioWeb(req.getSitioWeb());
        inst.setDireccion(req.getDireccion());
        inst.setCiudad(req.getCiudad());
        inst.setDepartamento(req.getDepartamento());
        inst.setPais(req.getPais() != null ? req.getPais() : "Perú");
        inst.setCodigoPostal(req.getCodigoPostal());
        inst.setLogoUrl(req.getLogoUrl());
        inst.setTipoInstitucion(req.getTipoInstitucion());
        inst.setCodigoModular(req.getCodigoModular());
        inst.setResolucionCreacion(req.getResolucionCreacion());
        inst.setUpdatedAt(DateUtil.now());
    }
}
