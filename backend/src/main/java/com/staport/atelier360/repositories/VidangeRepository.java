package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.Vidange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VidangeRepository extends JpaRepository<Vidange, Long> {
    List<Vidange> findByEnginIdEngin(Long enginId);
    List<Vidange> findByEnginIdEnginIn(List<Long> enginIds);
}
