package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.Engin;
import com.staport.atelier360.services.EnginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/engins")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class EnginController {

    @Autowired
    private EnginService enginService;

    @GetMapping
    public ResponseEntity<List<Engin>> getAllEngins() {
        return ResponseEntity.ok(enginService.getAllEngins());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Engin> getEnginById(@PathVariable @NonNull Long id) {
        return enginService.getEnginById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Engin> createEngin(@RequestBody Engin engin) {
        return ResponseEntity.ok(enginService.createEngin(engin));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Engin> updateEngin(@PathVariable @NonNull Long id, @RequestBody Engin engin) {
        return enginService.updateEngin(id, engin)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEngin(@PathVariable @NonNull Long id) {
        if (enginService.deleteEngin(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(enginService.getStats());
    }
}
