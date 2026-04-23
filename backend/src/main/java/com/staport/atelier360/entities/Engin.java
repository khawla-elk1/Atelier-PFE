package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "engins")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Engin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idEngin;

    @Column(unique = true, nullable = false)
    private String matricule;

    private String marque;
    private String modele;
    private String type;           // Genre: Bulldozer, Pelle, Niveleuse...
    private String categorie;      // Voiture, Engin, Camion, Remorque...
    private String poids;
    private String serieChassis;
    private String typeMoteur;
    private String serieMoteur;
    private String immatriculation;
    private String dateAcquisition;
    private String dateMiseEnCirculation;
    private String codeInterne;    // Ancien code Ex: "Pelle Doosan N°12"
    private String codeMateriel;   // Nouveau code: E570, C825...
    private String uniteCompteur;  // "km" ou "h"
    
    private Double compteurActuel;
    private String statut;         // ACTIF, EN_PANNE, VENDU, FERRAILLE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_chantier")
    private Chantier chantier;
}
