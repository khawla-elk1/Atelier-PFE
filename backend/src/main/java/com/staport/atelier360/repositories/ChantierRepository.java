package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.Chantier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChantierRepository extends JpaRepository<Chantier, Long> {
    Optional<Chantier> findByCodeErp(String codeErp);
    boolean existsByCodeErp(String codeErp);
    Optional<Chantier> findByIdChantierErp(Long idChantierErp);
}

