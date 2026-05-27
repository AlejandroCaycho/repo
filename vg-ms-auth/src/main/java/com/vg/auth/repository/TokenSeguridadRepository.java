package com.vg.auth.repository;

import com.vg.auth.domain.model.TokenSeguridad;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

// DDD: Repository — persistencia de tokens de seguridad (reset pwd, etc).
//
// Almacena tokens de un solo uso para operaciones sensibles
// como restablecimiento de contraseña.
public interface TokenSeguridadRepository extends ReactiveCrudRepository<TokenSeguridad, Integer> {
    Mono<TokenSeguridad> findByToken(String token);
}
