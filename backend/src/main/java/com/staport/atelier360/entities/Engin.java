package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "engins")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
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
    private String type; // Genre: Bulldozer, Pelle, Niveleuse...
    private String categorie; // Voiture, Engin, Camion, Remorque...
    private String poids;
    private String serieChassis;
    private String typeMoteur;
    private String serieMoteur;
    private String immatriculation;
    private String dateAcquisition;
    private String dateMiseEnCirculation;
    private String codeInterne; // Ancien code Ex: "Pelle Doosan N°12"
    private String codeMateriel; // Nouveau code: E570, C825...

    @Column(name = "id_materiel_erp", unique = true)
    private Long idMaterielErp; // ID stable venant de l'ERP (clé de dédup)

    private String uniteCompteur; // "km" ou "h"
    private Double compteurActuel;
    private Double heuresProductionCumulees; // Cumul des heures de production de pointages
    private String statut; // ACTIF, EN_PANNE, VENDU, FERRAILLE

    // -- Nouvelles colonnes pour la maintenance prédictive --
    private Double frequenceVidange; // ex: 250 (heures) ou 10000 (km)
    private Double dernierCompteurVidange; // Valeur du compteur lors de la dernière vidange
    private Double seuilAlerteVidange; // ex: 50 heures avant la vidange

    private Double consommationGasoilNorme; // Consommation normale (L/heure ou L/100km)

    // Prix Moyen Pondéré pour la facturation interne
    private Double prixMoyenPondere;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_chantier")
    private Chantier chantier;
}
