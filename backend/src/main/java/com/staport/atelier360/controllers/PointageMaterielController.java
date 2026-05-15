package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.PointageMateriel;
import com.staport.atelier360.repositories.PointageMaterielRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pointages")
@CrossOrigin(origins = "*")
public class PointageMaterielController {

    @Autowired
    private PointageMaterielRepository pointageMaterielRepository;

    @GetMapping("/engin/{enginId}")
    public ResponseEntity<List<PointageMateriel>> getPointagesByEngin(@PathVariable Long enginId) {
        return ResponseEntity.ok(pointageMaterielRepository.findByEnginIdEnginOrderByDatePointageDesc(enginId));
    }

    @GetMapping("/chantier/{chantierId}/mois/{year}/{month}")
    public ResponseEntity<java.util.Map<Long, Double>> getPointageStatsByChantierAndMonth(
            @PathVariable Long chantierId,
            @PathVariable int year,
            @PathVariable int month) {
        java.time.LocalDate startDate = java.time.LocalDate.of(year, month, 1);
        java.time.LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        
        List<Object[]> results = pointageMaterielRepository.sumHeuresByChantierAndMonth(chantierId, startDate, endDate);
        java.util.Map<Long, Double> map = new java.util.HashMap<>();
        for (Object[] row : results) {
            Long enginId = ((Number) row[0]).longValue();
            Double hours = ((Number) row[1]).doubleValue();
            map.put(enginId, hours);
        }
        return ResponseEntity.ok(map);
    }
}
