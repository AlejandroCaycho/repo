package com.vg.auth.web.router;

import com.vg.auth.web.handler.ConfiguracionInstitucionHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
@RequiredArgsConstructor
// DDD: Infrastructure — router HTTP para endpoints de configuración.
//
// Configura las rutas REST para gestionar la configuración
// específica de cada institución educativa.
public class ConfiguracionInstitucionRouter {

    private final ConfiguracionInstitucionHandler handler;

    @Bean
    public RouterFunction<ServerResponse> configuracionRoutes() {
        return RouterFunctions.route()
                .POST("/api/v1/configuracion",                          handler::crear)
                .GET("/api/v1/configuracion",                           handler::listarTodas)
                .GET("/api/v1/configuracion/{institucionId}",           handler::buscarPorInstitucionId)
                .PUT("/api/v1/configuracion/{institucionId}",           handler::actualizar)
                .DELETE("/api/v1/configuracion/{institucionId}",        handler::eliminar)
                .build();
    }
}
