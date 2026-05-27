package com.vg.auth.config;

import io.r2dbc.spi.ConnectionFactory;
import io.r2dbc.spi.Option;
import org.springframework.boot.autoconfigure.r2dbc.ConnectionFactoryOptionsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.config.EnableR2dbcAuditing;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;
import org.springframework.r2dbc.connection.R2dbcTransactionManager;
import org.springframework.transaction.ReactiveTransactionManager;

@Configuration
@EnableR2dbcAuditing
@EnableR2dbcRepositories(basePackages = "com.vg.auth.repository")
// DDD: Infrastructure — configuración de R2DBC.
//
// Configura la conexión a base de datos reactiva (R2DBC),
// el gestor de transacciones y la desactivación del caché
// de prepared statements para entornos de alto rendimiento.
public class R2dbcConfig {

    @Bean
    public ConnectionFactoryOptionsBuilderCustomizer disablePreparedStatementCache() {
        return builder -> builder.option(Option.valueOf("preparedStatementCacheQueries"), 0);
    }

    @Bean
    public ReactiveTransactionManager transactionManager(ConnectionFactory connectionFactory) {
        return new R2dbcTransactionManager(connectionFactory);
    }
}
