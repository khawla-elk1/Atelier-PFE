package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "ligne_demandes_sortie")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneDemandeSortie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLigne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_demande", nullable = false)
    @JsonBackReference
    private DemandeSortie demandeSortie;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_piece", nullable = false)
    private Piece piece;

    @Column(nullable = false)
    private Double quantiteDemandee;

    private Double quantiteLivree; // Au cas où le chef d'atelier ne valide qu'une partie
}
