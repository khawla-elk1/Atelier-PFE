package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.LignePrecom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LignePrecomRepository extends JpaRepository<LignePrecom, Long> {
    List<LignePrecom> findByPrecommandeIdPrecom(Long precommandeId);
}
