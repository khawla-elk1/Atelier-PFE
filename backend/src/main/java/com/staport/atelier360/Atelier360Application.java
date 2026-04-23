package com.staport.atelier360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class Atelier360Application {

	public static void main(String[] args) {
		SpringApplication.run(Atelier360Application.class, args);
	}

}
