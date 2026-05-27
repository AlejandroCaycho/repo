package com.vg.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
// DDD: Application — entry point del microservicio de autenticación.
//
// Inicializa el contexto de Spring Boot y arranca el servidor
// web reactivo (Netty). Habilita la programación de tareas
// programadas con @EnableScheduling.
public class VgMsAuthApplication {

	public static void main(String[] args) {
		SpringApplication.run(VgMsAuthApplication.class, args);
	}

}
