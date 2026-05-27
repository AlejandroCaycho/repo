package com.vg.auth.web.handler;

import com.vg.auth.domain.dto.LoginRequest;
import com.vg.auth.domain.dto.UsuarioRequest;
import com.vg.auth.service.AuthService;
import com.vg.auth.util.RequestValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
@RequiredArgsConstructor
// DDD: Application Layer — handler HTTP para autenticación (inbound port adapter).
//
// Recibe peticiones HTTP de login, registro, refresh token,
// recuperación de contraseña y las delega al Domain Service AuthService.
public class AuthHandler {

    private final AuthService authService;
    private final RequestValidator validator;

    public Mono<ServerResponse> login(ServerRequest request) {
        String ipAddress = request.remoteAddress().map(addr -> addr.getAddress().getHostAddress()).orElse("unknown");
        String userAgent = request.headers().firstHeader(HttpHeaders.USER_AGENT);

        return request.bodyToMono(LoginRequest.class)
                .doOnNext(validator::validate)
                .flatMap(req -> authService.login(req, ipAddress, userAgent))
                .flatMap(res -> ServerResponse.ok().bodyValue(res));
    }

    public Mono<ServerResponse> refreshToken(ServerRequest request) {
        String ipAddress = request.remoteAddress().map(addr -> addr.getAddress().getHostAddress()).orElse("unknown");
        String userAgent = request.headers().firstHeader(HttpHeaders.USER_AGENT);
        
        return request.bodyToMono(Map.class)
                .map(body -> (String) body.get("refreshToken"))
                .flatMap(rt -> authService.refreshToken(rt, ipAddress, userAgent))
                .flatMap(res -> ServerResponse.ok().bodyValue(res));
    }

    public Mono<ServerResponse> logout(ServerRequest request) {
        String token = request.headers().firstHeader(HttpHeaders.AUTHORIZATION);
        return authService.logout(token)
                .then(ServerResponse.ok().build());
    }

    public Mono<ServerResponse> register(ServerRequest request) {
        return request.bodyToMono(UsuarioRequest.class)
                .doOnNext(validator::validate)
                .flatMap(authService::register)
                .flatMap(res -> ServerResponse.ok().bodyValue(res));
    }

    public Mono<ServerResponse> forgotPassword(ServerRequest request) {
        return request.bodyToMono(Map.class)
                .map(body -> (String) body.get("email"))
                .flatMap(authService::forgotPassword)
                .flatMap(token -> ServerResponse.ok().bodyValue(Map.of(
                        "message", "Token de recuperacion generado con exito",
                        "token", token
                )));
    }

    public Mono<ServerResponse> resetPassword(ServerRequest request) {
        return request.bodyToMono(Map.class)
                .flatMap(body -> {
                    String token = (String) body.get("token");
                    String newPassword = (String) body.get("newPassword");
                    return authService.resetPassword(token, newPassword);
                })
                .then(ServerResponse.ok().bodyValue(Map.of("message", "Contrasena restablecida con exito")));
    }

    public Mono<ServerResponse> changePassword(ServerRequest request) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication().getName())
                .flatMap(email -> request.bodyToMono(Map.class)
                        .flatMap(body -> {
                            String currentPassword = (String) body.get("currentPassword");
                            String newPassword = (String) body.get("newPassword");
                            return authService.changePassword(email, currentPassword, newPassword);
                        }))
                .then(ServerResponse.ok().bodyValue(Map.of("message", "Contrasena actualizada con exito")));
    }
}
