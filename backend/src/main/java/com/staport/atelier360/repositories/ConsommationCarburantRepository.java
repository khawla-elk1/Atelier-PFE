package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.ConsommationCarburant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConsommationCarburantRepository extends JpaRepository<ConsommationCarburant, Long> {
    List<ConsommationCarburant> findByEnginIdEngin(Long enginId);
    List<ConsommationCarburant> findByDatePleinBetween(LocalDateTime debut, LocalDateTime fin);
}
