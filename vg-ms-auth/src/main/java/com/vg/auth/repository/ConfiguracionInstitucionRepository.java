package com.vg.auth.repository;

import com.vg.auth.domain.model.ConfiguracionInstitucion;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

// DDD: Repository — persistencia de configuración por institución.
//
// Almacena parámetros de configuración específicos de cada institución
// educativa (personalización, límites, preferencias).
public interface ConfiguracionInstitucionRepository extends ReactiveCrudRepository<ConfiguracionInstitucion, Integer> {

    Mono<ConfiguracionInstitucion> findByInstitucionId(Integer institucionId);
    Mono<Boolean> existsByInstitucionId(Integer institucionId);
}