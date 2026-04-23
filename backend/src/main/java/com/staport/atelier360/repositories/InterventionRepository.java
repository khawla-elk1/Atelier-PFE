package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.Intervention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    List<Intervention> findByEnginIdEngin(Long enginId);
    List<Intervention> findByTechnicienIdUser(Long technicienId);
    Intervention findByAnomalieIdAnomalie(Long anomalieId);
}
