package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lignes_precom")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LignePrecom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLigne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_precom")
    private Precommande precommande;

    private String refPiece;
    private String designation;
    private Integer quantite;
    private String fournisseur;
}
