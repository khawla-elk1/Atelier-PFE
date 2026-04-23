package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.Pneumatique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PneumatiqueRepository extends JpaRepository<Pneumatique, Long> {
    List<Pneumatique> findByEnginIdEngin(Long enginId);
}
