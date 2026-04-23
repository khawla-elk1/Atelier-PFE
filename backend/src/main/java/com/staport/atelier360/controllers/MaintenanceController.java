package com.staport.atelier360.controllers;

import com.staport.atelier360.services.MaintenancePredictiveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    @Autowired
    private MaintenancePredictiveService maintenanceService;

    @GetMapping("/predict")
    public List<Map<String, Object>> getPredictions() {
        return maintenanceService.getPredictiveAnalysis();
    }
}
