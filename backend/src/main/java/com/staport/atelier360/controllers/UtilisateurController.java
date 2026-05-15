package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.Utilisateur;
import com.staport.atelier360.enums.Role;
import com.staport.atelier360.services.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/utilisateurs")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class UtilisateurController {

    @Autowired
    private UtilisateurService utilisateurService;

    @GetMapping
    public ResponseEntity<List<Utilisateur>> getAllUtilisateurs() {
        return ResponseEntity.ok(utilisateurService.getAllUtilisateurs());
    }

    @GetMapping("/techniciens")
    public ResponseEntity<List<Utilisateur>> getTechniciens() {
        List<Utilisateur> techniciens = utilisateurService.getAllUtilisateurs()
            .stream()
            .filter(u -> u.getRole() == Role.TECH && u.isActif() && !"REJETE".equals(u.getStatutValidation()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(techniciens);
    }

    // --- SAISIE ET VALIDATION TECHNICIEN ---

    @PostMapping("/saisie-technicien")
    public ResponseEntity<Utilisateur> saisieTechnicien(@RequestBody Utilisateur user) {
        return ResponseEntity.ok(utilisateurService.createTechnicienSaisi(user));
    }

    @GetMapping("/techniciens-en-attente")
    public ResponseEntity<List<Utilisateur>> getTechniciensEnAttente() {
        return ResponseEntity.ok(utilisateurService.getTechniciensEnAttente());
    }

    @PutMapping("/technicien-validation/{id}")
    public ResponseEntity<Utilisateur> validerTechnicien(@PathVariable Long id, @RequestParam String statutValidation) {
        Utilisateur updated = utilisateurService.validerTechnicien(id, statutValidation);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }
}
