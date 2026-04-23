package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.Intervention;
import com.staport.atelier360.services.InterventionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/interventions")
@CrossOrigin(origins = "*")
public class InterventionController {

    @Autowired
    private InterventionService interventionService;

    @GetMapping
    public ResponseEntity<List<Intervention>> getAllInterventions() {
        return ResponseEntity.ok(interventionService.getAllInterventions());
    }

    @GetMapping("/engin/{enginId}")
    public ResponseEntity<List<Intervention>> getInterventionsByEngin(@PathVariable Long enginId) {
        return ResponseEntity.ok(interventionService.getInterventionsByEngin(enginId));
    }

    @PostMapping
    public ResponseEntity<Intervention> createIntervention(@RequestBody Intervention intervention) {
        return ResponseEntity.ok(interventionService.createIntervention(intervention));
    }

    @PutMapping("/{id}/cloturer")
    public ResponseEntity<Intervention> cloturerIntervention(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFin,
            @RequestParam(required = false) Double dureeReelle,
            @RequestParam(required = false) Double cout,
            @RequestParam(required = false) String observations) {
        try {
            return ResponseEntity.ok(interventionService.cloturerIntervention(id, dateFin, dureeReelle, cout, observations));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/attente-pieces")
    public ResponseEntity<Intervention> mettreEnAttentePieces(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(interventionService.mettreEnAttentePieces(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/assigner-technicien")
    public ResponseEntity<Intervention> assignerTechnicien(@PathVariable Long id, @RequestParam Long technicienId) {
        try {
            return ResponseEntity.ok(interventionService.assignerTechnicien(id, technicienId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIntervention(@PathVariable Long id) {
        try {
            interventionService.deleteIntervention(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
