package com.vg.auth.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vg.auth.domain.model.Usuario;
import com.vg.auth.repository.AuditLogRepository;
import com.vg.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditHelper {

    private final AuditLogRepository auditLogRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    private Mono<Integer> getAuthenticatedUserId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication().getName())
                .flatMap(email -> usuarioRepository.findByInstitucionIdAndEmail(1, email).map(Usuario::getId))
                .defaultIfEmpty(0);
    }

    public <T> Mono<T> audit(String tabla, Integer registroId, String accion, Object datosAnteriores, Object datosNuevos, T resultValue) {
        return audit(tabla, registroId, accion, datosAnteriores, datosNuevos)
                .thenReturn(resultValue);
    }

    public Mono<Void> audit(String tabla, Integer registroId, String accion, Object datosAnteriores, Object datosNuevos) {
        String strAnt = serialize(datosAnteriores);
        String strNue = serialize(datosNuevos);

        return getAuthenticatedUserId()
                .flatMap(usuarioId -> 
                    ReactiveRequestContextHolder.getExchange()
                        .map(exchange -> {
                            String ip = exchange.getRequest().getRemoteAddress() != null 
                                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress() 
                                    : "unknown";
                            String ua = exchange.getRequest().getHeaders().getFirst(HttpHeaders.USER_AGENT);
                            return new String[]{ip, ua};
                        })
                        .defaultIfEmpty(new String[]{"unknown", "unknown"})
                        .flatMap(arr -> auditLogRepository.registrar(
                                usuarioId == 0 ? null : usuarioId,
                                tabla,
                                registroId,
                                accion,
                                strAnt,
                                strNue,
                                arr[0],
                                arr[1],
                                OffsetDateTime.now()
                        ))
                )
                .onErrorResume(e -> {
                    log.error("Error al registrar auditoria automatica para la accion " + accion + " en la tabla " + tabla, e);
                    return Mono.empty();
                })
                .then();
    }

    public String serialize(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String) return (String) obj;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.warn("Error al serializar objeto para auditoria: " + obj, e);
            return obj.toString();
        }
    }
}
