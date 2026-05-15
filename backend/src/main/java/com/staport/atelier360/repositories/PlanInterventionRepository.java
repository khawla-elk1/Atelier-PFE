package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.PlanIntervention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanInterventionRepository extends JpaRepository<PlanIntervention, Long> {
    List<PlanIntervention> findByStatut(String statut);
    List<PlanIntervention> findByEnginIdEngin(Long idEngin);
}
