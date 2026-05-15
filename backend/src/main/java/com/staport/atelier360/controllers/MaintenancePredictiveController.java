package com.staport.atelier360.controllers;

import com.staport.atelier360.services.MaintenancePredictiveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance-predictive")
@CrossOrigin(origins = "*") // Autoriser le frontend à s'y connecter
public class MaintenancePredictiveController {

    @Autowired
    private MaintenancePredictiveService maintenancePredictiveService;

    @GetMapping("/predictions")
    public List<Map<String, Object>> getPredictions() {
        System.out.println("API REST appelée : /api/maintenance-predictive/predictions");
        return maintenancePredictiveService.getPredictiveAnalysis();
    }
}
