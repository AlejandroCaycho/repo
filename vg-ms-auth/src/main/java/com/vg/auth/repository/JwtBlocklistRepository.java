package com.vg.auth.repository;

import com.vg.auth.domain.model.JwtBlocklist;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

// DDD: Repository — persistencia de tokens JWT bloqueados (logout).
//
// Mantiene la lista de tokens JWT invalidados para asegurar
// que no puedan ser reutilizados después del logout.
public interface JwtBlocklistRepository extends ReactiveCrudRepository<JwtBlocklist, Integer> {
    Mono<JwtBlocklist> findByJti(String jti);
    Mono<Boolean> existsByJti(String jti);
    Mono<Long> deleteByExpiraEnBefore(OffsetDateTime now);
}
