package com.staport.atelier360.services;

import com.staport.atelier360.entities.PlanIntervention;
import com.staport.atelier360.entities.Intervention;
import com.staport.atelier360.entities.Anomalie;
import com.staport.atelier360.repositories.PlanInterventionRepository;
import com.staport.atelier360.repositories.InterventionRepository;
import com.staport.atelier360.repositories.AnomalieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class PlanInterventionService {

    private final PlanInterventionRepository planRepository;
    private final InterventionRepository interventionRepository;
    private final AnomalieRepository anomalieRepository;

    public List<PlanIntervention> getAllPlans() {
        return planRepository.findAll();
    }

    public Optional<PlanIntervention> getPlanById(Long id) {
        return planRepository.findById(id);
    }

    @Transactional
    public PlanIntervention createPlanFromAnomalie(Long idAnomalie, PlanIntervention plan) {
        if (idAnomalie != null && idAnomalie > 0) {
            Anomalie anomalie = anomalieRepository.findById(idAnomalie)
                    .orElseThrow(() -> new RuntimeException("Anomalie non trouvée"));
            
            plan.setAnomalie(anomalie);
            plan.setEngin(anomalie.getEngin());
            
            // Update anomaly status
            anomalie.setStatut("EN_PLANIFICATION");
            anomalieRepository.save(anomalie);
        }
        
        plan.setStatut("BROUILLON");
        return planRepository.save(plan);
    }

    @Transactional
    public PlanIntervention savePlan(PlanIntervention plan) {
        return planRepository.save(plan);
    }

    @Transactional
    public void deletePlan(Long id) {
        planRepository.deleteById(id);
    }

    @Transactional
    public Intervention addInterventionToPlan(Long idPlan, Intervention intervention) {
        PlanIntervention plan = planRepository.findById(idPlan)
                .orElseThrow(() -> new RuntimeException("Plan non trouvé"));
        
        intervention.setPlanIntervention(plan);
        intervention.setEngin(plan.getEngin());
        intervention.setAnomalie(plan.getAnomalie());
        
        if (intervention.getStatut() == null) {
            intervention.setStatut("PROGRAMMEE");
        }
        
        return interventionRepository.save(intervention);
    }
}
