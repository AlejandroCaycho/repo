package com.vg.auth.exception;

import org.springframework.http.HttpStatus;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
// DDD: Infrastructure — manejo global de excepciones HTTP.
//
// Implementa un adapter de presentación que transforma excepciones
// del dominio (NotFoundException, ConflictException, BadRequestException)
// en respuestas HTTP con formato JSON estándar.
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public Mono<Map<String, Object>> handleNotFound(NotFoundException ex, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND);
        return Mono.just(Map.of(
                "status", 404,
                "error", ex.getMessage(),
                "timestamp", OffsetDateTime.now().toString()
        ));
    }

    @ExceptionHandler(ConflictException.class)
    public Mono<Map<String, Object>> handleConflict(ConflictException ex, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.CONFLICT);
        return Mono.just(Map.of(
                "status", 409,
                "error", ex.getMessage(),
                "timestamp", OffsetDateTime.now().toString()
        ));
    }

    @ExceptionHandler({BadRequestException.class, IllegalArgumentException.class})
    public Mono<Map<String, Object>> handleBadRequest(RuntimeException ex, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
        return Mono.just(Map.of(
                "status", 400,
                "error", ex.getMessage(),
                "timestamp", OffsetDateTime.now().toString()
        ));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public Mono<Map<String, Object>> handleUnauthorized(UnauthorizedException ex, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return Mono.just(Map.of(
                "status", 401,
                "error", ex.getMessage(),
                "timestamp", OffsetDateTime.now().toString()
        ));
    }

    @ExceptionHandler(DataAccessResourceFailureException.class)
    public Mono<Map<String, Object>> handleDatabaseUnavailable(DataAccessResourceFailureException ex, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
        return Mono.just(Map.of(
                "status", 503,
                "error", "Base de datos no disponible",
                "detail", ex.getMostSpecificCause().getMessage(),
                "timestamp", OffsetDateTime.now().toString()
        ));
    }

    @ExceptionHandler(WebExchangeBindException.class)
    public Mono<Map<String, Object>> handleValidation(WebExchangeBindException ex, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
        List<String> errors = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .toList();
        return Mono.just(Map.of(
                "status", 400,
                "errores", errors,
                "timestamp", OffsetDateTime.now().toString()
        ));
    }
}
