package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "vidanges")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vidange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idVidange;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_engin")
    private Engin engin;

    private String typeHuile;
    private Double quantiteL;
    
    private Double compteurEffectue;
    private Double prochainSeuil;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_technicien")
    private Utilisateur technicien;

    private LocalDate dateVidange;
}
