package com.staport.atelier360.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> welcome() {
        return Map.of(
            "status", "UP",
            "message", "Atelier360 Backend API is running",
            "timestamp", LocalDateTime.now(),
            "version", "1.0.0-PFE"
        );
    }
}
