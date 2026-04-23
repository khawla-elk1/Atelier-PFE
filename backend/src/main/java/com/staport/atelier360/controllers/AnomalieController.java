package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.Anomalie;
import com.staport.atelier360.services.AnomalieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/anomalies")
@CrossOrigin(origins = "*")
public class AnomalieController {

    @Autowired
    private AnomalieService anomalieService;

    @GetMapping
    public ResponseEntity<List<Anomalie>> getAllAnomalies() {
        return ResponseEntity.ok(anomalieService.getAllAnomalies());
    }

    @GetMapping("/engin/{enginId}")
    public ResponseEntity<List<Anomalie>> getAnomaliesByEngin(@PathVariable Long enginId) {
        return ResponseEntity.ok(anomalieService.getAnomaliesByEngin(enginId));
    }

    @PostMapping
    public ResponseEntity<Anomalie> createAnomalie(@RequestBody Anomalie anomalie) {
        return ResponseEntity.ok(anomalieService.createAnomalie(anomalie));
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<Anomalie> updateStatut(@PathVariable Long id, @RequestParam String statut) {
        try {
            return ResponseEntity.ok(anomalieService.updateStatut(id, statut));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnomalie(@PathVariable Long id) {
        try {
            anomalieService.deleteAnomalie(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
