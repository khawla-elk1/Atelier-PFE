package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "pieces_rechange")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Piece {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPiece;

    @Column(nullable = false)
    private String designation;

    private Double quantiteEnStock; // Le STOCK FINAL dans le fichier Excel

    private String emplacement; // R4/BB4 etc.
    
    // On pourrait rajouter Stock Initial, Entree, Sortie, mais pour la GMAO, le "Stock Actuel" est le plus important.
}
