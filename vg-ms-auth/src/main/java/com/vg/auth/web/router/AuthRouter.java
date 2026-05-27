package com.vg.auth.web.router;

import com.vg.auth.web.handler.AuthHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
// DDD: Infrastructure — router HTTP para endpoints de autenticación.
//
// Configura las rutas REST para login, registro, refresh token,
// forgot/reset password y cambio de contraseña.
public class AuthRouter {

    @Bean
    public RouterFunction<ServerResponse> authRoutes(AuthHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/auth", builder -> builder
                        .POST("/login", handler::login)
                        .POST("/refresh", handler::refreshToken)
                        .POST("/logout", handler::logout)
                        .POST("/register", handler::register)
                        .POST("/forgot-password", handler::forgotPassword)
                        .POST("/reset-password", handler::resetPassword)
                        .POST("/change-password", handler::changePassword)
                )
                .build();
    }
}
