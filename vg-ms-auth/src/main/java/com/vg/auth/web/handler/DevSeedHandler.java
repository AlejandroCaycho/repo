package com.vg.auth.web.handler;

import com.vg.auth.domain.model.Institucion;
import com.vg.auth.domain.model.Rol;
import com.vg.auth.domain.model.Usuario;
import com.vg.auth.repository.InstitucionRepository;
import com.vg.auth.repository.RolRepository;
import com.vg.auth.repository.UsuarioRepository;
import com.vg.auth.repository.UsuarioRolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
// DDD: Infrastructure — handler de seed para desarrollo (solo entornos dev).
//
// Crea datos iniciales de prueba: institución, rol SUPERROOT
// y usuario administrador. Deshabilitar en producción.
public class DevSeedHandler {

    private final InstitucionRepository institucionRepository;
    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public Mono<ServerResponse> seed(ServerRequest request) {
        return usuarioRepository.count()
                .flatMap(count -> {
                    if (count > 0) {
                        return ServerResponse.badRequest().bodyValue(Map.of(
                                "error", "Seed ya ejecutado",
                                "message", "Ya existen usuarios en la base de datos. Este endpoint solo funciona con BD vacia."
                        ));
                    }
                    return ejecutarSeed();
                });
    }

    private Mono<ServerResponse> ejecutarSeed() {
        log.warn("Ejecutando seed de desarrollo - Creando usuario SUPERROOT...");

        Institucion institucion = Institucion.builder()
                .uuid(UUID.randomUUID())
                .nombre("Sistema Valle Grande")
                .nombreCorto("SVG")
                .email("sistema@vallegrande.edu.pe")
                .telefono("+51064281000")
                .direccion("Canete, Lima")
                .ciudad("Canete")
                .departamento("Lima")
                .pais("Peru")
                .tipoInstitucion("SISTEMA")
                .activa(true)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        return institucionRepository.save(institucion)
                .flatMap(savedInstitucion -> {
                    log.info("Institucion creada: {} (id={})", savedInstitucion.getNombre(), savedInstitucion.getId());

                    return rolRepository.findByNombre("SUPERROOT")
                            .switchIfEmpty(Mono.defer(() -> rolRepository.save(Rol.builder()
                                    .nombre("SUPERROOT")
                                    .descripcion("Acceso total al sistema")
                                    .esSistema(true)
                                    .build())))
                            .flatMap(savedRol -> {
                                log.info("Rol SUPERROOT cargado: {} (id={})", savedRol.getNombre(), savedRol.getId());

                                Usuario usuario = Usuario.builder()
                                        .uuid(UUID.randomUUID())
                                        .institucionId(savedInstitucion.getId())
                                        .nombre("Super Administrador")
                                        .email("carlos.caycho.casas@vallegrande.edu.pe")
                                        .contrasenaHash(passwordEncoder.encode("Admin2024!"))
                                        .telefono("+51999999999")
                                        .estado("activo")
                                        .requiereCambioPwd(false)
                                        .intentosFallidos((short) 0)
                                        .createdAt(OffsetDateTime.now())
                                        .updatedAt(OffsetDateTime.now())
                                        .build();

                                return usuarioRepository.save(usuario)
                                        .flatMap(savedUsuario -> {
                                            log.info("Usuario creado: {} (id={})", savedUsuario.getEmail(), savedUsuario.getId());

                                            return usuarioRolRepository.insert(
                                                    savedUsuario.getId(),
                                                    savedRol.getId(),
                                                    savedUsuario.getId(),
                                                    OffsetDateTime.now()
                                            ).then(ServerResponse.ok().bodyValue(Map.of(
                                                    "message", "Seed ejecutado correctamente",
                                                    "institucion", Map.of(
                                                            "id", savedInstitucion.getId(),
                                                            "nombre", savedInstitucion.getNombre()
                                                    ),
                                                    "rol", Map.of(
                                                            "id", savedRol.getId(),
                                                            "nombre", savedRol.getNombre()
                                                    ),
                                                    "usuario", Map.of(
                                                            "id", savedUsuario.getId(),
                                                            "uuid", savedUsuario.getUuid().toString(),
                                                            "email", savedUsuario.getEmail(),
                                                            "contrasena", "Admin2024!"
                                                    ),
                                                    "instrucciones", "Usa POST /api/v1/auth/login con email y contrasena para obtener tu token JWT"
                                            )));
                                        });
                             });
                });
    }
}
