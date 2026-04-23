package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.DemandeSortie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeSortieRepository extends JpaRepository<DemandeSortie, Long> {
    List<DemandeSortie> findByStatut(String statut);
    List<DemandeSortie> findByInterventionIdIntervention(Long idIntervention);
}
