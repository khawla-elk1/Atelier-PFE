package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@Entity
@Table(name = "chantiers")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "engins"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chantier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idChantier;

    // Données locales ATELIER360
    private String nom;
    private String localisation;
    private String statut; // ACTIF, TERMINE, EN_ATTENTE

    // Données synchronisées depuis l'ERP WinDev
    @Column(name = "id_chantier_erp")
    private Long idChantierErp;       // id_chantier retourné par l'ERP

    @Column(name = "code_erp", unique = true)
    private String codeErp;           // code retourné par l'ERP (ex: C186, C194...)

    @Column(name = "designation_erp", columnDefinition = "TEXT")
    private String designationErp;    // Nom complet du projet depuis l'ERP

    // Relation : liste des engins affectés à ce chantier
    @OneToMany(mappedBy = "chantier", fetch = FetchType.LAZY)
    private List<Engin> engins;
}

