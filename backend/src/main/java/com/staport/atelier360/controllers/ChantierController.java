package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.Chantier;
import com.staport.atelier360.entities.Engin;
import com.staport.atelier360.repositories.ChantierRepository;
import com.staport.atelier360.repositories.EnginRepository;
import com.staport.atelier360.services.ChantierSyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chantiers")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class ChantierController {

    @Autowired
    private ChantierRepository chantierRepository;

    @Autowired
    private EnginRepository enginRepository;

    @Autowired
    private ChantierSyncService chantierSyncService;

    /** Liste tous les chantiers (locaux + synchronisés ERP) */
    @GetMapping
    public ResponseEntity<List<Chantier>> getAllChantiers() {
        return ResponseEntity.ok(chantierRepository.findAll());
    }

    /** Détail d'un chantier */
    @GetMapping("/{id}")
    public ResponseEntity<Chantier> getChantierById(@PathVariable Long id) {
        return chantierRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Liste des engins affectés à un chantier */
    @GetMapping("/{id}/engins")
    public ResponseEntity<List<Engin>> getEnginsByChantier(@PathVariable Long id) {
        if (!chantierRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(enginRepository.findByChantierIdChantier(id));
    }

    /**
     * Affecter un engin à un chantier.
     * Si chantierIdBody = null → désaffecter l'engin (retour au parc).
     */
    @PutMapping("/affecter-engin/{enginId}")
    public ResponseEntity<Engin> affecterEnginAuChantier(
            @PathVariable Long enginId,
            @RequestBody Map<String, Object> body) {

        Optional<Engin> enginOpt = enginRepository.findById(enginId);
        if (enginOpt.isEmpty()) return ResponseEntity.notFound().build();

        Engin engin = enginOpt.get();

        Object chantierIdRaw = body.get("chantierId");
        if (chantierIdRaw == null) {
            // Désaffectation → retour au parc
            engin.setChantier(null);
        } else {
            Long chantierId = Long.valueOf(chantierIdRaw.toString());
            Optional<Chantier> chantierOpt = chantierRepository.findById(chantierId);
            if (chantierOpt.isEmpty()) return ResponseEntity.notFound().build();
            engin.setChantier(chantierOpt.get());
        }

        return ResponseEntity.ok(enginRepository.save(engin));
    }

    /**
     * Synchroniser les chantiers depuis l'ERP WinDev.
     * Appelé manuellement ou via scheduler.
     */
    @PostMapping("/sync-erp")
    public ResponseEntity<Map<String, Object>> syncFromErp() {
        Map<String, Object> result = chantierSyncService.syncFromErp();
        return ResponseEntity.ok(result);
    }

    /** Créer un chantier manuellement (cas sans ERP) */
    @PostMapping
    public ResponseEntity<Chantier> createChantier(@RequestBody Chantier chantier) {
        return ResponseEntity.ok(chantierRepository.save(chantier));
    }

    /** Modifier un chantier local */
    @PutMapping("/{id}")
    public ResponseEntity<Chantier> updateChantier(@PathVariable Long id, @RequestBody Chantier chantier) {
        return chantierRepository.findById(id).map(existing -> {
            if (chantier.getNom() != null) existing.setNom(chantier.getNom());
            if (chantier.getLocalisation() != null) existing.setLocalisation(chantier.getLocalisation());
            if (chantier.getStatut() != null) existing.setStatut(chantier.getStatut());
            return ResponseEntity.ok(chantierRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }
}

