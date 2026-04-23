package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.Pneumatique;
import com.staport.atelier360.services.PneumatiqueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pneumatiques")
@CrossOrigin(origins = "*")
public class PneumatiqueController {

    @Autowired
    private PneumatiqueService pneumatiqueService;

    @GetMapping("/engin/{enginId}")
    public ResponseEntity<List<Pneumatique>> getPneusByEngin(@PathVariable Long enginId) {
        return ResponseEntity.ok(pneumatiqueService.getPneusByEngin(enginId));
    }

    @PostMapping
    public ResponseEntity<Pneumatique> enregistrerPneu(@RequestBody Pneumatique pneu) {
        return ResponseEntity.ok(pneumatiqueService.enregistrerPneu(pneu));
    }

    @PutMapping("/{id}/usure")
    public ResponseEntity<Pneumatique> mettreAjourUsure(@PathVariable Long id, @RequestParam Double usure) {
        try {
            return ResponseEntity.ok(pneumatiqueService.verifierUsure(id, usure));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
