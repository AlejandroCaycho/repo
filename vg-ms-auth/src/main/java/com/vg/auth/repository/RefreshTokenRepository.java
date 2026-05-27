package com.vg.auth.repository;

import com.vg.auth.domain.model.RefreshToken;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Repository — persistencia de tokens de refresco JWT.
//
// Almacena los tokens de refresco para permitir la rotación segura
// de tokens JWT sin requerir autenticación frecuente del usuario.
public interface RefreshTokenRepository extends ReactiveCrudRepository<RefreshToken, Integer> {
    Mono<RefreshToken> findByToken(String token);
    Flux<RefreshToken> findByUsuarioIdAndRevocadoFalse(Integer usuarioId);
}
