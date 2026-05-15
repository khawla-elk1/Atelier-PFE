
package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.ConsommationCarburant;
import com.staport.atelier360.services.CarburantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carburant")
@CrossOrigin(origins = "*")
public class CarburantController {

    @Autowired
    private CarburantService carburantService;

    @GetMapping
    public ResponseEntity<List<ConsommationCarburant>> getAllLogs() {
        return ResponseEntity.ok(carburantService.getAllLogs());
    }

    @GetMapping("/engin/{enginId}")
    public ResponseEntity<List<ConsommationCarburant>> getLogsByEngin(@PathVariable Long enginId) {
        return ResponseEntity.ok(carburantService.getLogsByEngin(enginId));
    }

    @PostMapping
    public ResponseEntity<ConsommationCarburant> addLog(@RequestBody ConsommationCarburant log) {
        return ResponseEntity.ok(carburantService.addLog(log));
    }

    @GetMapping("/engin/{enginId}/moyenne")
    public ResponseEntity<Double> getMoyenne(@PathVariable Long enginId) {
        return ResponseEntity.ok(carburantService.calculerConsoMoyenne(enginId));
    }
}
