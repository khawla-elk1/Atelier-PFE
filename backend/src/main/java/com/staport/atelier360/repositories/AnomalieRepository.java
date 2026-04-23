package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.Anomalie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnomalieRepository extends JpaRepository<Anomalie, Long> {
    List<Anomalie> findByEnginIdEngin(Long idEngin);
    List<Anomalie> findByStatut(String statut);
    List<Anomalie> findByCriticite(com.staport.atelier360.enums.Criticite criticite);
}
