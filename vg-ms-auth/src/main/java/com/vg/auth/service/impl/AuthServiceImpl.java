package com.vg.auth.service.impl;

import com.vg.auth.domain.dto.LoginRequest;
import com.vg.auth.domain.dto.TokenResponse;
import com.vg.auth.domain.dto.UsuarioRequest;
import com.vg.auth.domain.dto.UsuarioResponse;
import com.vg.auth.domain.model.DomainEventPublisher;
import com.vg.auth.domain.model.LoginFallidoEvent;
import com.vg.auth.domain.model.RolAsignadoEvent;
import com.vg.auth.domain.model.UsuarioRegistradoEvent;
import com.vg.auth.domain.model.JwtBlocklist;
import com.vg.auth.domain.model.RefreshToken;
import com.vg.auth.domain.model.Rol;
import com.vg.auth.domain.model.TokenSeguridad;
import com.vg.auth.domain.model.ContrasenaHash;
import com.vg.auth.domain.model.Email;
import com.vg.auth.domain.model.EstadoUsuario;
import com.vg.auth.exception.ConflictException;
import com.vg.auth.exception.NotFoundException;
import com.vg.auth.exception.UnauthorizedException;
import com.vg.auth.repository.*;
import com.vg.auth.config.JwtProvider;
import com.vg.auth.service.AuthService;
import com.vg.auth.service.EmailService;
import com.vg.auth.util.AuditHelper;
import com.vg.auth.util.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// DDD: Domain Service — lógica de autenticación.
//
// Implementa los casos de uso de autenticación del dominio:
// login con control de intentos fallidos y bloqueo, registro
// con asignación de rol por defecto, refresh token con rotación,
// recuperación de contraseña mediante tokens de un solo uso.
//
// Utiliza Value Objects (Email, ContrasenaHash, EstadoUsuario)
// para validación y Domain Events para efectos secundarios.
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtBlocklistRepository jwtBlocklistRepository;
    private final TokenSeguridadRepository tokenSeguridadRepository;
    private final RolRepository rolRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final AuditLogRepository auditLogRepository;
    private final JwtProvider jwtProvider;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuditHelper auditHelper;
    private final EmailService emailService;
    private final DomainEventPublisher eventPublisher;

    @Value("${jwt.expiration}")
    private Long expiration;

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public Mono<Map<String, Object>> login(LoginRequest request, String ipAddress, String userAgent) {
        // DDD: Value Object Email valida el formato
        Email emailVO = new Email(request.getEmail());
        return usuarioRepository.findByInstitucionIdAndEmail(1, emailVO.value())
                .switchIfEmpty(Mono.defer(() -> 
                        auditLogRepository.registrar(
                                null,
                                "usuarios",
                                0,
                                "LOGIN_FAILED",
                                null,
                                "{\"email\":\"" + emailVO.value() + "\",\"motivo\":\"Usuario no encontrado\"}",
                                ipAddress,
                                userAgent,
                                DateUtil.now()
                        ).then(Mono.error(new UnauthorizedException("Credenciales invalidas")))
                ))
                .flatMap(user -> {
                    // DDD: Usar comportamiento de entidad Usuario para verificar bloqueo
                    if (user.bloqueoExpiro(DateUtil.now())) {
                        user.desbloquear();
                    } else if ("bloqueado".equals(user.getEstado())) {
                        String blockReason = "Usuario bloqueado temporalmente";
                        eventPublisher.publish(new LoginFallidoEvent(
                                user.getEmail(), user.getId(), blockReason, user.getIntentosFallidos()));
                        return auditLogRepository.registrar(
                                user.getId(),
                                "usuarios",
                                user.getId(),
                                "LOGIN_FAILED",
                                null,
                                "{\"email\":\"" + user.getEmail() + "\",\"motivo\":\"" + blockReason + "\"}",
                                ipAddress,
                                userAgent,
                                DateUtil.now()
                        ).then(Mono.error(new UnauthorizedException("Usuario temporalmente bloqueado. Intente mas tarde.")));
                    }

                    // DDD: Value Object EstadoUsuario valida si permite login
                    EstadoUsuario estado = new EstadoUsuario(user.getEstado());
                    if (!estado.permiteLogin()) {
                        return auditLogRepository.registrar(
                                user.getId(),
                                "usuarios",
                                user.getId(),
                                "LOGIN_FAILED",
                                null,
                                "{\"email\":\"" + user.getEmail() + "\",\"motivo\":\"Usuario " + user.getEstado() + "\"}",
                                ipAddress,
                                userAgent,
                                DateUtil.now()
                        ).then(Mono.error(new UnauthorizedException("Usuario inactivo o suspendido")));
                    }

                    if (!passwordEncoder.matches(request.getContrasena(), user.getContrasenaHash())) {
                        // DDD: Comportamiento de entidad — incrementar intentos y bloquear si corresponde
                        boolean debeBloquear = user.incrementarIntentosFallidos();
                        String motivo = "Contrasena incorrecta";
                        if (debeBloquear) {
                            user.bloquear(DateUtil.now().plusMinutes(15));
                            motivo = "Usuario bloqueado por superar intentos fallidos";
                        }
                        // DDD: Domain Event — LoginFallidoEvent
                        eventPublisher.publish(new LoginFallidoEvent(
                                user.getEmail(), user.getId(), motivo, user.getIntentosFallidos()));
                        final String finalMotivo = motivo;
                        return usuarioRepository.save(user)
                                .flatMap(savedUser -> auditLogRepository.registrar(
                                        savedUser.getId(),
                                        "usuarios",
                                        savedUser.getId(),
                                        "LOGIN_FAILED",
                                        null,
                                        "{\"email\":\"" + savedUser.getEmail() + "\",\"motivo\":\"" + finalMotivo + "\"}",
                                        ipAddress,
                                        userAgent,
                                        DateUtil.now()
                                ))
                                .then(Mono.error(new UnauthorizedException("Credenciales invalidas")));
                    }

                    // DDD: Login exitoso — reiniciar contadores y registrar acceso
                    user.reiniciarIntentosFallidos();
                    user.registrarAcceso(DateUtil.now());

                    String accessToken = jwtProvider.generateToken(user.getEmail());
                    String refreshTokenString = UUID.randomUUID().toString();

                    RefreshToken refreshToken = RefreshToken.builder()
                            .usuarioId(user.getId())
                            .token(refreshTokenString)
                            .expiraEn(DateUtil.now().plus(refreshExpiration, ChronoUnit.MILLIS))
                            .revocado(false)
                            .ipOrigen(ipAddress)
                            .userAgent(userAgent)
                            .createdAt(DateUtil.now())
                            .build();

                    return usuarioRepository.save(user)
                            .then(refreshTokenRepository.save(refreshToken))
                            .flatMap(savedToken -> auditLogRepository.registrar(
                                    user.getId(),
                                    "usuarios",
                                    user.getId(),
                                    "LOGIN",
                                    null,
                                    "{\"email\":\"" + user.getEmail() + "\"}",
                                    ipAddress,
                                    userAgent,
                                    DateUtil.now()
                            ).then(rolRepository.findRolesByUserEmail(user.getEmail())
                                    .map(Rol::getNombre)
                                    .collect(Collectors.toList())
                                    .map(roles -> {
                                        Map<String, Object> response = new HashMap<>();
                                        response.put("accessToken", accessToken);
                                        response.put("refreshToken", savedToken.getToken());
                                        response.put("tokenType", "Bearer");
                                        response.put("expiresIn", expiration);

                                        Map<String, Object> usuarioData = new HashMap<>();
                                        usuarioData.put("id", user.getId());
                                        usuarioData.put("uuid", user.getUuid() != null ? user.getUuid().toString() : null);
                                        usuarioData.put("nombre", user.getNombre());
                                        usuarioData.put("email", user.getEmail());
                                        usuarioData.put("fotoUrl", user.getFotoUrl());
                                        usuarioData.put("rol", roles.isEmpty() ? "" : roles.get(0));
                                        usuarioData.put("roles", roles);
                                        response.put("usuario", usuarioData);
                                        return response;
                                    })));
                });
    }

    @Override
    public Mono<TokenResponse> refreshToken(String token, String ipAddress, String userAgent) {
        return refreshTokenRepository.findByToken(token)
                .switchIfEmpty(Mono.error(new UnauthorizedException("Refresh token invalido")))
                .flatMap(rt -> {
                    // DDD: Comportamiento de entidad RefreshToken — verificar expiración
                    if (rt.getRevocado() || rt.expirado(DateUtil.now())) {
                        return Mono.error(new UnauthorizedException("Refresh token expirado o revocado"));
                    }
                    // DDD: Rotación de tokens — revocar el viejo y crear uno nuevo
                    String nuevoTokenStr = UUID.randomUUID().toString();
                    rt.revocar(nuevoTokenStr);

                    return refreshTokenRepository.save(rt)
                            .flatMap(savedRt -> usuarioRepository.findById(savedRt.getUsuarioId()))
                            .flatMap(user -> {
                                String newAccessToken = jwtProvider.generateToken(user.getEmail());
                                RefreshToken newRefreshToken = RefreshToken.builder()
                                        .usuarioId(user.getId())
                                        .token(nuevoTokenStr)
                            .expiraEn(DateUtil.now().plus(refreshExpiration, ChronoUnit.MILLIS))
                                        .revocado(false)
                                        .ipOrigen(ipAddress)
                                        .userAgent(userAgent)
                            .createdAt(DateUtil.now())
                                        .build();

                                return refreshTokenRepository.save(newRefreshToken)
                                        .map(newSavedToken -> TokenResponse.builder()
                                                .accessToken(newAccessToken)
                                                .refreshToken(newSavedToken.getToken())
                                                .tokenType("Bearer")
                                                .expiresIn(expiration)
                                                .build());
                            });
                });
    }

    @Override
    public Mono<Void> logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            String jti = jwtProvider.extractJti(jwt);
            JwtBlocklist blocklist = JwtBlocklist.builder()
                    .jti(jti)
                    .expiraEn(DateUtil.now().plus(expiration, ChronoUnit.MILLIS))
                    .creadoEn(DateUtil.now())
                    .build();
            return jwtBlocklistRepository.save(blocklist).then();
        }
        return Mono.empty();
    }

    @Override
    public Mono<UsuarioResponse> register(UsuarioRequest request) {
        // DDD: Value Object Email valida el formato
        Email emailVO = new Email(request.getEmail());
        request.setNombre(request.getNombre() == null ? null : request.getNombre().trim());
        request.setEmail(emailVO.value());
        request.setTelefono(request.getTelefono() == null ? null : request.getTelefono().trim());

        return usuarioRepository.existsByInstitucionIdAndEmail(request.getInstitucionId(), request.getEmail())
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new ConflictException("Email ya registrado en esta institucion"));
                    }
                    // DDD: Value Object ContrasenaHash encapsula el hash BCrypt
                    String hash = passwordEncoder.encode(request.getContrasena());
                    ContrasenaHash contrasenaHash = new ContrasenaHash(hash);
                    com.vg.auth.domain.model.Usuario newUser = com.vg.auth.domain.model.Usuario.builder()
                            .institucionId(request.getInstitucionId())
                            .nombre(request.getNombre())
                            .email(request.getEmail())
                            .contrasenaHash(contrasenaHash.value())
                            .telefono(request.getTelefono())
                            .estado("activo")
                            .intentosFallidos((short) 0)
                            .createdAt(DateUtil.now())
                            .build();

                    return usuarioRepository.save(newUser)
                            .flatMap(savedUser -> 
                                rolRepository.findByNombre("ESTUDIANTE")
                                        .switchIfEmpty(Mono.error(new NotFoundException("Rol por defecto ESTUDIANTE no encontrado")))
                                        .flatMap(rol -> {
                                            // DDD: Domain Event — RolAsignadoEvent
                                            eventPublisher.publish(new RolAsignadoEvent(
                                                    savedUser.getId(), rol.getId(), rol.getNombre(), 1));
                                            return usuarioRolRepository.insert(savedUser.getId(), rol.getId(), 1, DateUtil.now());
                                        })
                                        .then(auditHelper.audit("usuarios", savedUser.getId(), "INSERT", null, savedUser))
                                        .then(Mono.fromRunnable(() -> {
                                            // DDD: Domain Event — UsuarioRegistradoEvent
                                            eventPublisher.publish(new UsuarioRegistradoEvent(
                                                    savedUser.getId(),
                                                    savedUser.getEmail(),
                                                    savedUser.getNombre(),
                                                    savedUser.getInstitucionId(),
                                                    "ESTUDIANTE"));
                                        }))
                                        .thenReturn(UsuarioResponse.builder()
                                                .id(savedUser.getId())
                                                .uuid(savedUser.getUuid())
                                                .institucionId(savedUser.getInstitucionId())
                                                .nombre(savedUser.getNombre())
                                                .email(savedUser.getEmail())
                                                .telefono(savedUser.getTelefono())
                                                .estado(savedUser.getEstado())
                                                .intentosFallidos((short) 0)
                                                .requiereCambioPwd(false)
                                                .createdAt(DateUtil.formatDateTime(savedUser.getCreatedAt()))
                                                .build())
                            );
                });
    }

    @Override
    public Mono<String> forgotPassword(String email) {
        // DDD: Value Object Email valida el formato
        Email emailVO = new Email(email);
        return usuarioRepository.findByEmail(emailVO.value())
                .switchIfEmpty(Mono.error(new NotFoundException("Usuario no encontrado")))
                .flatMap(user -> {
                    String tokenString = UUID.randomUUID().toString().replace("-", "");
                    TokenSeguridad tokenSeguridad = TokenSeguridad.builder()
                            .usuarioId(user.getId())
                            .token(tokenString)
                            .tipo("recuperacion_pwd")
                            .expiraEn(DateUtil.now().plusHours(1))
                            .usado(false)
                            .createdAt(DateUtil.now())
                            .build();
                    
                    return tokenSeguridadRepository.save(tokenSeguridad)
                            .flatMap(savedToken -> auditHelper.audit("usuarios", user.getId(), "UPDATE", 
                                    null, "{\"email\":\"" + email + "\",\"accion\":\"solicitud_recuperacion_contrasena\"}")
                                    .then(emailService.sendPasswordResetEmail(
                                            user.getEmail(),
                                            user.getNombre(),
                                            buildResetPasswordUrl(savedToken.getToken())
                                    ))
                                    .thenReturn(savedToken.getToken()));
                });
    }

    private String buildResetPasswordUrl(String token) {
        String baseUrl = frontendUrl == null ? "" : frontendUrl.replaceAll("/+$", "");
        return baseUrl + "/auth/reset-password?token=" + token;
    }

    @Override
    public Mono<Void> resetPassword(String token, String newPassword) {
        return tokenSeguridadRepository.findByToken(token)
                .switchIfEmpty(Mono.error(new NotFoundException("Token de recuperacion invalido")))
                .flatMap(t -> {
                    // DDD: Comportamiento de entidad TokenSeguridad — verificar si es válido
                    if (!t.esValido(DateUtil.now())) {
                        return Mono.error(new ConflictException("Token de recuperacion expirado o ya usado"));
                    }
                    t.marcarUsado();
                    return tokenSeguridadRepository.save(t)
                            .flatMap(savedToken -> usuarioRepository.findById(savedToken.getUsuarioId()))
                            .flatMap(user -> {
                                // DDD: Value Object ContrasenaHash encapsula el nuevo hash
                                ContrasenaHash hash = new ContrasenaHash(passwordEncoder.encode(newPassword));
                                user.setContrasenaHash(hash.value());
                                user.setIntentosFallidos((short) 0);
                                user.setEstado("activo");
                                user.setUpdatedAt(DateUtil.now());
                                return usuarioRepository.save(user)
                                        .flatMap(savedUser -> auditHelper.audit("usuarios", savedUser.getId(), "UPDATE",
                                                "{\"email\":\"" + user.getEmail() + "\",\"accion\":\"previo_reseteo_contrasena\"}",
                                                "{\"email\":\"" + user.getEmail() + "\",\"accion\":\"reseteo_contrasena_exitoso\"}"));
                            });
                })
                .then();
    }

    @Override
    public Mono<Void> changePassword(String email, String currentPassword, String newPassword) {
        // DDD: Value Object Email valida el formato
        Email emailVO = new Email(email);
        return usuarioRepository.findByEmail(emailVO.value())
                .switchIfEmpty(Mono.error(new NotFoundException("Usuario no encontrado")))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(currentPassword, user.getContrasenaHash())) {
                        return Mono.error(new UnauthorizedException("Contrasena actual incorrecta"));
                    }
                    // DDD: Value Object ContrasenaHash encapsula el nuevo hash
                    ContrasenaHash hash = new ContrasenaHash(passwordEncoder.encode(newPassword));
                    user.setContrasenaHash(hash.value());
                    user.setUpdatedAt(DateUtil.now());
                    return usuarioRepository.save(user)
                            .flatMap(savedUser -> auditHelper.audit("usuarios", savedUser.getId(), "UPDATE",
                                    "{\"email\":\"" + email + "\",\"accion\":\"intento_cambio_contrasena\"}",
                                    "{\"email\":\"" + email + "\",\"accion\":\"cambio_contrasena_exitoso\"}"));
                })
                .then();
    }
}
