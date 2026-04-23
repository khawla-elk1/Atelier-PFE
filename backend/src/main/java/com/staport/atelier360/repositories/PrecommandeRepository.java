package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.Precommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrecommandeRepository extends JpaRepository<Precommande, Long> {
    List<Precommande> findByInterventionIdIntervention(Long interventionId);
    List<Precommande> findByStatutErp(com.staport.atelier360.enums.StatutPrecommande statut);
}
