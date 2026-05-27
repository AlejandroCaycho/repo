package com.vg.auth.repository;

import com.vg.auth.domain.model.Usuario;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

// DDD: Repository — persistencia de Aggregate Root Usuario.
//
// Define las consultas específicas del dominio para la entidad Usuario.
// Implementado por Spring Data R2DBC (infrastructure adapter).
public interface UsuarioRepository extends ReactiveCrudRepository<Usuario, Integer> {

    Mono<Usuario> findByUuid(UUID uuid);
    Flux<Usuario> findByInstitucionId(Integer institucionId);
    Flux<Usuario> findByInstitucionIdAndEstado(Integer institucionId, String estado);
    Mono<Usuario> findByInstitucionIdAndEmail(Integer institucionId, String email);
    Mono<Boolean> existsByInstitucionIdAndEmail(Integer institucionId, String email);
    Flux<Usuario> findByEstado(String estado);
    Mono<Boolean> existsByInstitucionId(Integer institucionId);
    Mono<Usuario> findByEmail(String email);
}
