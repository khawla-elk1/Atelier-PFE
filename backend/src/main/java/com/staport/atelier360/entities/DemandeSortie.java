package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "demandes_sortie")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeSortie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDemande;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_intervention")
    private Intervention intervention;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_technicien")
    private Utilisateur technicien; // Le technicien qui demande la pièce

    private LocalDateTime dateDemande;

    // ex: "EN_ATTENTE_CHEF", "VALIDEE", "REJETEE"
    private String statut; 

    private String motifRejet;

    @OneToMany(mappedBy = "demandeSortie", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<LigneDemandeSortie> lignes;

}
