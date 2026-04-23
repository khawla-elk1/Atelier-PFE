package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.Vidange;
import com.staport.atelier360.services.VidangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;

import java.util.List;

@RestController
@RequestMapping("/api/vidanges")
@CrossOrigin(origins = "*")
public class VidangeController {

    @Autowired
    private VidangeService vidangeService;

    @GetMapping
    public ResponseEntity<List<Vidange>> getAllVidanges() {
        return ResponseEntity.ok(vidangeService.getAllVidanges());
    }

    @GetMapping("/engin/{enginId}")
    public ResponseEntity<List<Vidange>> getVidangesByEngin(@PathVariable @NonNull Long enginId) {
        return ResponseEntity.ok(vidangeService.getVidangesByEngin(enginId));
    }

    @PostMapping
    public ResponseEntity<Vidange> enregistrerVidange(@RequestBody Vidange vidange) {
        return ResponseEntity.ok(vidangeService.enregistrerVidange(vidange));
    }

    @GetMapping("/engin/{enginId}/alerte")
    public ResponseEntity<Boolean> verifierAlerte(@PathVariable @NonNull Long enginId) {
        return ResponseEntity.ok(vidangeService.verifierAlerteVidange(enginId));
    }
}
