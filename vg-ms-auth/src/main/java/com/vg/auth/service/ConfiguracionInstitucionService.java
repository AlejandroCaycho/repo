package com.vg.auth.service;

import com.vg.auth.domain.dto.ConfiguracionInstitucionRequest;
import com.vg.auth.domain.dto.ConfiguracionInstitucionResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

// DDD: Domain Service — contrato para gestión de configuración por institución.
//
// Define operaciones de negocio para gestionar la configuración
// específica de cada institución educativa.
//
// Esta interfaz pertenece a la capa de dominio (puerto de salida).
public interface ConfiguracionInstitucionService {
    Mono<ConfiguracionInstitucionResponse> crear(ConfiguracionInstitucionRequest request);
    Flux<ConfiguracionInstitucionResponse> listarTodas();
    Mono<ConfiguracionInstitucionResponse> buscarPorInstitucionId(Integer institucionId);
    Mono<ConfiguracionInstitucionResponse> actualizar(Integer institucionId, ConfiguracionInstitucionRequest request);
    Mono<Void> eliminar(Integer institucionId);
}
