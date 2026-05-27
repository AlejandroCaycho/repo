package com.vg.auth.service;

import reactor.core.publisher.Mono;

// DDD: Domain Service — envío de correos electrónicos.
//
// Define el contrato para notificaciones por email del dominio,
// como el envío de enlaces de recuperación de contraseña.
//
// Esta interfaz pertenece a la capa de dominio (puerto de salida).
public interface EmailService {
    Mono<Void> sendPasswordResetEmail(String to, String name, String resetUrl);
}
