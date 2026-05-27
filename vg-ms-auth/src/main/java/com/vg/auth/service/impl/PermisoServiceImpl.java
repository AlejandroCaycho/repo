package com.vg.auth.service.impl;

import com.vg.auth.domain.dto.PermisoRequest;
import com.vg.auth.domain.dto.PermisoResponse;
import com.vg.auth.exception.ConflictException;
import com.vg.auth.exception.NotFoundException;
import com.vg.auth.mapper.PermisoMapper;
import com.vg.auth.repository.PermisoRepository;
import com.vg.auth.repository.RolPermisoRepository;
import com.vg.auth.repository.RolRepository;
import com.vg.auth.service.PermisoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Domain Service — gestión de entidades Permiso.
//
// Implementa los casos de uso del dominio para permisos:
// CRUD con validación de unicidad por módulo/acción,
// y asignación/remoción de permisos a roles.
@Service
@RequiredArgsConstructor
public class PermisoServiceImpl implements PermisoService {

    private final PermisoRepository repository;
    private final RolRepository rolRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final PermisoMapper mapper;

    // DDD: Comando de negocio — crear un nuevo permiso.
    @Override
    public Mono<PermisoResponse> crear(PermisoRequest request) {
        normalizar(request);
        return repository.existsByModuloAndAccion(request.getModulo(), request.getAccion())
                .flatMap(exists -> {
                    if (exists) return Mono.error(new ConflictException("Ya existe ese permiso para este modulo"));
                    return repository.save(mapper.toModel(request));
                })
                .map(mapper::toResponse);
    }

    // DDD: Consulta — listar todos los permisos.
    @Override
    public Flux<PermisoResponse> listarTodos() {
        return repository.findAll()
                .map(mapper::toResponse);
    }

    // DDD: Consulta — listar permisos por módulo.
    @Override
    public Flux<PermisoResponse> listarPorModulo(String modulo) {
        return repository.findByModulo(modulo.trim().toUpperCase())
                .map(mapper::toResponse);
    }

    // DDD: Consulta — listar permisos asignados a un rol.
    @Override
    public Flux<PermisoResponse> listarPorRol(Integer rolId) {
        return rolRepository.existsById(rolId)
                .flatMapMany(existe -> {
                    if (!existe) return Flux.error(new NotFoundException("Rol no encontrado"));
                    return repository.findByRolId(rolId);
                })
                .map(mapper::toResponse);
    }

    // DDD: Consulta — buscar permiso por ID.
    @Override
    public Mono<PermisoResponse> buscarPorId(Integer id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Permiso no encontrado")))
                .map(mapper::toResponse);
    }

    // DDD: Comando de negocio — actualizar datos del permiso.
    @Override
    public Mono<PermisoResponse> actualizar(Integer id, PermisoRequest request) {
        normalizar(request);
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Permiso no encontrado")))
                .flatMap(permiso -> repository.existsByModuloAndAccionAndIdNot(request.getModulo(), request.getAccion(), id)
                        .flatMap(exists -> {
                            if (exists) return Mono.error(new ConflictException("Ya existe ese permiso para este modulo"));
                            mapper.updateModel(permiso, request);
                            return repository.save(permiso);
                        }))
                .map(mapper::toResponse);
    }

    // DDD: Comando de negocio — cambiar estado del permiso.
    @Override
    public Mono<PermisoResponse> cambiarEstado(Integer id, String estado) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Permiso no encontrado")))
                .flatMap(permiso -> {
                    permiso.setEstado(estado);
                    return repository.save(permiso);
                })
                .map(mapper::toResponse);
    }

    // DDD: Comando de negocio — eliminar un permiso.
    @Override
    public Mono<Void> eliminar(Integer id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Permiso no encontrado")))
                .flatMap(permiso -> rolPermisoRepository.deleteByPermisoId(id)
                        .then(repository.delete(permiso)))
                .then();
    }

    // DDD: Comando de negocio — asignar un permiso a un rol.
    @Override
    public Mono<Void> asignarPermiso(Integer rolId, Integer permisoId) {
        return rolRepository.existsById(rolId)
                .flatMap(rolExiste -> {
                    if (!rolExiste) return Mono.error(new NotFoundException("Rol no encontrado"));
                    return repository.existsById(permisoId);
                })
                .flatMap(permisoExiste -> {
                    if (!permisoExiste) return Mono.error(new NotFoundException("Permiso no encontrado"));
                    return rolPermisoRepository.existsByRolIdAndPermisoId(rolId, permisoId);
                })
                .flatMap(yaAsignado -> {
                    if (yaAsignado) return Mono.error(new ConflictException("El permiso ya esta asignado a este rol"));
                    return rolPermisoRepository.insert(rolId, permisoId);
                })
                .then();
    }

    // DDD: Comando de negocio — quitar un permiso de un rol.
    @Override
    public Mono<Void> quitarPermiso(Integer rolId, Integer permisoId) {
        return rolPermisoRepository.existsByRolIdAndPermisoId(rolId, permisoId)
                .flatMap(existe -> {
                    if (!existe) return Mono.error(new NotFoundException("Asignacion no encontrada"));
                    return rolPermisoRepository.deleteByRolIdAndPermisoId(rolId, permisoId);
                })
                .then();
    }

    private void normalizar(PermisoRequest request) {
        request.setModulo(request.getModulo() == null ? null : request.getModulo().trim().toUpperCase());
        request.setAccion(request.getAccion() == null ? null : request.getAccion().trim().toUpperCase());
        request.setDescripcion(request.getDescripcion() == null ? null : request.getDescripcion().trim());
    }
}
