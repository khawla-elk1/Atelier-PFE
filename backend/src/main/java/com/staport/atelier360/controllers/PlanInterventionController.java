package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.PlanIntervention;
import com.staport.atelier360.entities.Intervention;
import com.staport.atelier360.services.PlanInterventionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plans-intervention")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PlanInterventionController {

    private final PlanInterventionService planService;

    @GetMapping
    public List<PlanIntervention> getAllPlans() {
        return planService.getAllPlans();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanIntervention> getPlanById(@PathVariable Long id) {
        return planService.getPlanById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/from-anomalie/{idAnomalie}")
    public PlanIntervention createFromAnomalie(@PathVariable Long idAnomalie, @RequestBody PlanIntervention plan) {
        return planService.createPlanFromAnomalie(idAnomalie, plan);
    }

    @PostMapping
    public PlanIntervention createPlan(@RequestBody PlanIntervention plan) {
        return planService.savePlan(plan);
    }

    @PutMapping("/{id}")
    public PlanIntervention updatePlan(@PathVariable Long id, @RequestBody PlanIntervention plan) {
        plan.setIdPlan(id);
        return planService.savePlan(plan);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{idPlan}/interventions")
    public Intervention addIntervention(@PathVariable Long idPlan, @RequestBody Intervention intervention) {
        return planService.addInterventionToPlan(idPlan, intervention);
    }
}
