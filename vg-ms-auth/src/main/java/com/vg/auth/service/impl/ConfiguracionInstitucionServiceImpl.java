package com.vg.auth.service.impl;

import com.vg.auth.domain.dto.ConfiguracionInstitucionRequest;
import com.vg.auth.domain.dto.ConfiguracionInstitucionResponse;
import com.vg.auth.exception.ConflictException;
import com.vg.auth.exception.NotFoundException;
import com.vg.auth.mapper.ConfiguracionInstitucionMapper;
import com.vg.auth.repository.ConfiguracionInstitucionRepository;
import com.vg.auth.repository.InstitucionRepository;
import com.vg.auth.service.ConfiguracionInstitucionService;
import com.vg.auth.util.AuditHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
// DDD: Domain Service — gestión de configuración por institución.
//
// Implementa los casos de uso del dominio para gestionar
// la configuración específica de cada institución educativa,
// con validación de existencia de la institución.
public class ConfiguracionInstitucionServiceImpl implements ConfiguracionInstitucionService {

    private final ConfiguracionInstitucionRepository repository;
    private final InstitucionRepository institucionRepository;
    private final ConfiguracionInstitucionMapper mapper;
    private final AuditHelper auditHelper;

    @Override
    public Mono<ConfiguracionInstitucionResponse> crear(ConfiguracionInstitucionRequest request) {
        return institucionRepository.existsById(request.getInstitucionId())
                .flatMap(institucionExiste -> {
                    if (!institucionExiste) return Mono.error(new NotFoundException("Institucion no encontrada"));
                    return repository.existsByInstitucionId(request.getInstitucionId());
                })
                .flatMap(exists -> {
                    if (exists) return Mono.error(new ConflictException("Ya existe configuracion para esta institucion"));
                    return repository.save(mapper.toModel(request));
                })
                .flatMap(saved -> auditHelper.audit("configuracion_institucion", saved.getId(), "INSERT", null, saved, saved))
                .map(mapper::toResponse);
    }

    @Override
    public Flux<ConfiguracionInstitucionResponse> listarTodas() {
        return repository.findAll()
                .map(mapper::toResponse);
    }

    @Override
    public Mono<ConfiguracionInstitucionResponse> buscarPorInstitucionId(Integer institucionId) {
        return repository.findByInstitucionId(institucionId)
                .switchIfEmpty(Mono.error(new NotFoundException("Configuracion no encontrada")))
                .map(mapper::toResponse);
    }

    @Override
    public Mono<ConfiguracionInstitucionResponse> actualizar(Integer institucionId, ConfiguracionInstitucionRequest request) {
        return repository.findByInstitucionId(institucionId)
                .switchIfEmpty(Mono.error(new NotFoundException("Configuracion no encontrada")))
                .flatMap(config -> {
                    ConfiguracionInstitucionResponse snapshotBefore = mapper.toResponse(config);
                    request.setInstitucionId(institucionId);
                    mapper.updateModel(config, request);
                    return repository.save(config)
                            .flatMap(saved -> auditHelper.audit("configuracion_institucion", saved.getId(), "UPDATE", snapshotBefore, saved, saved));
                })
                .map(mapper::toResponse);
    }

    @Override
    public Mono<Void> eliminar(Integer institucionId) {
        return repository.findByInstitucionId(institucionId)
                .switchIfEmpty(Mono.error(new NotFoundException("Configuracion no encontrada")))
                .flatMap(config -> {
                    ConfiguracionInstitucionResponse snapshotBefore = mapper.toResponse(config);
                    return repository.delete(config)
                            .then(auditHelper.audit("configuracion_institucion", config.getId(), "DELETE", snapshotBefore, null));
                });
    }
}
