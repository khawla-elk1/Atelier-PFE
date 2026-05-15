package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "pointages_materiel")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointageMateriel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // L'ID matériel venant de l'ERP
    private Long idMaterielErp;
    
    // L'ID unique du pointage dans l'ERP (pour la déduplication)
    @Column(name = "sync_id", unique = true)
    private String syncId;
    
    // Si on le lie à l'engin local :
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_engin")
    private Engin engin;

    private LocalDate datePointage;
    
    // -- Nouvelles colonnes pour la maintenance prédictive --
    // Compteurs (Heures ou KM)
    private Double compteurDebut;
    private Double compteurFin;
    private Double heuresTravaillees; // Durée travaillée (via ERP)
    
    // Heures de shift (format HHMM ou HH:MM)
    private String heureDebut;
    private String heureFin;
    
    // Carburant
    private Double gasoilConsomme; // en litres
    
    // Vidange / Maintenance
    private Boolean vidangeEffectuee; // Si l'opérateur a fait une vidange ce jour-là
    private Boolean graissageEffectue; // Si un graissage a été fait
    
    // Chantier où le matériel a travaillé
    private Long idChantierErp;
    private String codeChantierErp;     // code_chantier ERP (ex: "C206")

    // Identification ERP du matériel
    private String codeMateriel;        // code_materiel ERP (ex: "E504")
    private String designationMateriel; // designation_materiel ERP

    private String statutPointage;

    // ── Facturation journalière ─────────────────────────────────────────────
    /**
     * Coût journalier calculé selon la règle :
     *   - heures >= seuil plein (ex: 5h) → prixMoyenPondere de l'engin (tarif plein)
     *   - heures < seuil plein            → prixMoyenPondere / 2       (demi-tarif)
     * Unité : DH
     */
    private Double coutJournalier;

    /**
     * Nombre d'heures effectives cumulées sur la journée
     * (après agrégation de toutes les tranches horaires du jour).
     */
    private Double heuresEffectives;
}
