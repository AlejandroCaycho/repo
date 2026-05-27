package com.vg.auth.service;

import com.vg.auth.domain.dto.LoginRequest;
import com.vg.auth.domain.dto.TokenResponse;
import com.vg.auth.domain.dto.UsuarioRequest;
import com.vg.auth.domain.dto.UsuarioResponse;
import reactor.core.publisher.Mono;

import java.util.Map;

// DDD: Domain Service — lógica de negocio de autenticación.
//
// Define los contratos para login, registro, refresh token,
// recuperación de contraseña y cambio de contraseña.
//
// Esta interfaz pertenece a la capa de dominio (puerto de salida).
public interface AuthService {
    Mono<Map<String, Object>> login(LoginRequest request, String ipAddress, String userAgent);
    Mono<TokenResponse> refreshToken(String refreshToken, String ipAddress, String userAgent);
    Mono<Void> logout(String token);
    Mono<UsuarioResponse> register(UsuarioRequest request);
    Mono<String> forgotPassword(String email);
    Mono<Void> resetPassword(String token, String newPassword);
    Mono<Void> changePassword(String email, String currentPassword, String newPassword);
}
