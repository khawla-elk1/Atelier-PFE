package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.DemandeSortie;
import com.staport.atelier360.entities.Piece;
import com.staport.atelier360.services.DemandeSortieService;
import com.staport.atelier360.services.PieceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;

import java.util.List;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "*")
public class StockController {

    @Autowired
    private PieceService pieceService;

    @Autowired
    private DemandeSortieService demandeSortieService;

    // --- PIECES ---
    
    @GetMapping("/pieces")
    public ResponseEntity<List<Piece>> getAllPieces() {
        return ResponseEntity.ok(pieceService.getAllPieces());
    }
    
    @GetMapping("/pieces/search")
    public ResponseEntity<List<Piece>> searchPieces(@RequestParam String q) {
        return ResponseEntity.ok(pieceService.searchPieces(q));
    }

    // --- DEMANDES DE SORTIE ---

    @GetMapping("/demandes")
    public ResponseEntity<List<DemandeSortie>> getAllDemandes() {
        return ResponseEntity.ok(demandeSortieService.getAllDemandes());
    }

    @GetMapping("/demandes/en-attente")
    public ResponseEntity<List<DemandeSortie>> getDemandesEnAttente() {
        return ResponseEntity.ok(demandeSortieService.getDemandesEnAttente());
    }

    @PostMapping("/demandes")
    public ResponseEntity<DemandeSortie> creerDemande(@RequestBody DemandeSortie demande) {
        return ResponseEntity.ok(demandeSortieService.creerDemande(demande));
    }

    @PutMapping("/demandes/{id}/valider")
    public ResponseEntity<DemandeSortie> validerDemande(@PathVariable @NonNull Long id) {
        try {
            return ResponseEntity.ok(demandeSortieService.validerDemande(id, ""));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/demandes/{id}/rejeter")
    public ResponseEntity<DemandeSortie> rejeterDemande(@PathVariable @NonNull Long id, @RequestParam String motif) {
        try {
            return ResponseEntity.ok(demandeSortieService.rejeterDemande(id, motif));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
