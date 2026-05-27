package com.vg.auth.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import reactor.core.publisher.Mono;

@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@RequiredArgsConstructor
// DDD: Infrastructure — configuración de seguridad.
//
// Configura autenticación JWT stateless con Spring Security WebFlux.
// Define reglas de autorización por rutas HTTP y roles/permisos.
//
// Deshabilita CSRF, form login y HTTP basic por ser una API REST.
public class SecurityConfig {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .exceptionHandling(exceptionHandlingSpec -> exceptionHandlingSpec
                        .authenticationEntryPoint((swe, e) ->
                                Mono.fromRunnable(() -> swe.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED)))
                        .accessDeniedHandler((swe, e) ->
                                Mono.fromRunnable(() -> swe.getResponse().setStatusCode(HttpStatus.FORBIDDEN)))
                )
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .authenticationManager(authenticationManager)
                .securityContextRepository(securityContextRepository)
                .authorizeExchange(exchange -> exchange
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()
                        .pathMatchers(
                                "/api/v1/auth/login",
                                "/api/v1/auth/register",
                                "/api/v1/auth/refresh",
                                "/api/v1/auth/forgot-password",
                                "/api/v1/auth/reset-password"
                        ).permitAll()
                        .pathMatchers("/api/v1/dev/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/v1/audit-log/**").hasAnyAuthority("AUDIT_READ", "ROLE_SUPERROOT")
                        .pathMatchers("/api/v1/instituciones/**").hasAnyAuthority("ROLE_SUPERROOT", "INSTITUCIONES_CREATE", "INSTITUCIONES_UPDATE", "INSTITUCIONES_DELETE")
                        .pathMatchers("/api/v1/roles/**").hasAnyAuthority("ROLE_SUPERROOT", "ROLE_ADMIN", "ROLE_DIRECTOR", "ROLES_CREATE", "ROLES_UPDATE", "ROLES_DELETE")
                        .pathMatchers("/api/v1/permisos/**").hasAnyAuthority("ROLE_SUPERROOT", "PERMISOS_CREATE", "PERMISOS_UPDATE", "PERMISOS_DELETE")
                        .pathMatchers("/api/v1/usuario-roles/**").hasAnyAuthority("ROLE_SUPERROOT", "ROLE_ADMIN", "ROLE_DIRECTOR", "ROLES_UPDATE")
                        .pathMatchers("/api/v1/configuracion", "/api/v1/configuracion/**").hasAnyAuthority("ROLE_SUPERROOT", "ROLE_ADMIN", "ROLE_DIRECTOR", "CONFIGURACION_CREATE", "CONFIGURACION_UPDATE", "CONFIGURACION_DELETE")
                        .pathMatchers(HttpMethod.GET, "/api/v1/usuarios/**").hasAnyAuthority(
                                "ROLE_SUPERROOT", "ROLE_ADMIN", "ROLE_DIRECTOR",
                                "ROLE_TUTOR", "ROLE_PROFESOR", "ROLE_AUXILIAR", "ROLE_PADRE_DE_FAMILIA", "ROLE_PSICOLOGIA",
                                "USUARIOS_READ"
                        )
                        .pathMatchers("/api/v1/usuarios/**").hasAnyAuthority(
                                "ROLE_SUPERROOT", "ROLE_ADMIN", "ROLE_DIRECTOR",
                                "USUARIOS_CREATE", "USUARIOS_UPDATE", "USUARIOS_DELETE"
                        )
                        .anyExchange().authenticated()
                )
                .build();
    }
}
