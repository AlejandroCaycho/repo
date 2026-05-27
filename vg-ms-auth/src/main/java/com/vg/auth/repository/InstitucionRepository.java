package com.vg.auth.repository;

import com.vg.auth.domain.model.Institucion;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

// DDD: Repository — persistencia de Aggregate Root Institucion.
//
// Define consultas específicas del dominio para instituciones,
// incluyendo validación de unicidad de nombre y código modular.
public interface InstitucionRepository extends ReactiveCrudRepository<Institucion, Integer> {

    Flux<Institucion> findByActivaTrue();
    Flux<Institucion> findByActivaFalse();
    Mono<Institucion> findByUuid(UUID uuid);
    Mono<Boolean> existsByNombre(String nombre);
    Mono<Boolean> existsByCodigoModular(String codigoModular);
    Mono<Boolean> existsByNombreAndIdNot(String nombre, Integer id);
    Mono<Boolean> existsByCodigoModularAndIdNot(String codigoModular, Integer id);
}
