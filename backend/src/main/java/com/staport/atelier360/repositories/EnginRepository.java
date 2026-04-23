package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.Engin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnginRepository extends JpaRepository<Engin, Long> {
    List<Engin> findByChantierIdChantier(Long idChantier);
    Engin findByMatricule(String matricule);
    Optional<Engin> findByCodeMateriel(String codeMateriel);
}
