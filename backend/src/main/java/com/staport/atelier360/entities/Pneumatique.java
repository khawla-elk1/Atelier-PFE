package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "pneumatiques")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pneumatique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPneu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_engin")
    private Engin engin;

    private String positionEssieu;
    private String dimension;
    private Double pressionActuelle;
    private Double etatUsurePourcent;

    private LocalDate datePose;
    private LocalDate dateRemplacement;
}
