package com.vg.auth.config;

import com.vg.auth.repository.JwtBlocklistRepository;
import com.vg.auth.repository.PermisoRepository;
import com.vg.auth.repository.RolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticationManager implements ReactiveAuthenticationManager {

    private final JwtProvider jwtProvider;
    private final JwtBlocklistRepository jwtBlocklistRepository;
    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        String authToken = authentication.getCredentials().toString();
        
        String tempUsername;
        String tempJti;
        try {
            tempUsername = jwtProvider.extractUsername(authToken);
            tempJti = jwtProvider.extractJti(authToken);
        } catch (Exception e) {
            tempUsername = null;
            tempJti = null;
        }

        final String username = tempUsername;
        final String jti = tempJti;

        if (username != null && jti != null && jwtProvider.validateToken(authToken)) {
            return jwtBlocklistRepository.existsByJti(jti)
                    .flatMap(isBlocked -> {
                        if (Boolean.TRUE.equals(isBlocked)) {
                            log.warn("Token JWT bloqueado: {}", jti);
                            return Mono.empty();
                        }

                        Mono<List<SimpleGrantedAuthority>> rolesMono = rolRepository.findRolesByUserEmail(username)
                                .map(rol -> new SimpleGrantedAuthority("ROLE_" + rol.getNombre()))
                                .collectList();

                        Mono<List<SimpleGrantedAuthority>> permissionsMono = permisoRepository.findPermissionsByUserEmail(username)
                                .map(permiso -> new SimpleGrantedAuthority(permiso.getModulo() + "_" + permiso.getAccion()))
                                .collectList();

                        return Mono.zip(rolesMono, permissionsMono)
                                .map(tuple -> {
                                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                                    authorities.addAll(tuple.getT1());
                                    authorities.addAll(tuple.getT2());
                                    log.debug("Usuario autenticado: {} con roles y permisos: {}", username, authorities);
                                    return new UsernamePasswordAuthenticationToken(username, null, authorities);
                                });
                    });
        } else {
            return Mono.empty();
        }
    }
}
