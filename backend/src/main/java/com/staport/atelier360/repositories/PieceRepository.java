package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.Piece;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PieceRepository extends JpaRepository<Piece, Long> {
    List<Piece> findByDesignationContainingIgnoreCase(String designation);
}
