package com.vg.auth.service.impl;

import com.vg.auth.repository.JwtBlocklistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtBlocklistCleanupTask {

    private final JwtBlocklistRepository repository;

    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredTokens() {
        log.info("Iniciando tarea de limpieza de tokens JWT expirados en la blocklist...");
        repository.deleteByExpiraEnBefore(OffsetDateTime.now())
                .subscribe(
                        deletedCount -> log.info("Limpieza completada. Se eliminaron {} registros expirados.", deletedCount),
                        error -> log.error("Error durante la limpieza de tokens expirados: ", error)
                );
    }
}
