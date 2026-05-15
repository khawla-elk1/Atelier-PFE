package com.staport.atelier360.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").permitAll()
                .anyRequest().permitAll()
            );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:4200",        // Angular web app
            "http://localhost:3000",        // Dev alternative
            "http://localhost:8100",        // Ionic mobile dev server
            "http://localhost:8081",        // Backend direct (dev)
            "http://192.168.1.36:4200",
            "http://192.168.1.36:8100",
            "http://192.168.8.178:4200",   // PC Khawla — Angular
            "http://192.168.8.178:8100",   // PC Khawla — Ionic serve
            "http://192.168.8.178:8081",   // PC Khawla — Backend
            "capacitor://localhost",        // Ionic sur Android (Capacitor)
            "ionic://localhost"             // Ionic sur iOS
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /** RestTemplate partagé pour tous les services ERP (ChantierSyncService, ErpSyncService...) */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

