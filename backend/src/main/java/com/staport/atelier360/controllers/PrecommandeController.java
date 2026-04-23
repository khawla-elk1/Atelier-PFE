package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.Precommande;
import com.staport.atelier360.enums.StatutPrecommande;
import com.staport.atelier360.services.PrecommandeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/precommandes")
@CrossOrigin(origins = "*") // À ajuster plus tard pour la sécurité Angular
public class PrecommandeController {

    @Autowired
    private PrecommandeService precommandeService;

    @GetMapping
    public ResponseEntity<List<Precommande>> getAllPrecommandes() {
        return ResponseEntity.ok(precommandeService.getAllPrecommandes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Precommande> getPrecommandeById(@PathVariable @NonNull Long id) {
        return precommandeService.getPrecommandeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Precommande> createPrecommande(@RequestBody Precommande precommande) {
        return ResponseEntity.ok(precommandeService.createPrecommande(precommande));
    }

    // Endpoint spécifique pour générer le XML vers l'ERP
    @PostMapping("/{id}/generer-erp")
    public ResponseEntity<?> genererPrecommandeERP(@PathVariable @NonNull Long id) {
        try {
            Precommande p = precommandeService.genererPrecommandeERP(id);
            return ResponseEntity.ok(p);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur lors de la génération XML : " + e.getMessage());
        }
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<Precommande> updateStatutERP(@PathVariable @NonNull Long id, @RequestParam StatutPrecommande statut) {
        try {
            return ResponseEntity.ok(precommandeService.updateStatutERP(id, statut));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
