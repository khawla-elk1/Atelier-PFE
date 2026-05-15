package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Entity
@Table(name = "interventions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idIntervention;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_engin")
    @NotFound(action = NotFoundAction.IGNORE)
    private Engin engin;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_anomalie")
    @NotFound(action = NotFoundAction.IGNORE)
    private Anomalie anomalie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_plan_intervention")
    @JsonIgnoreProperties("interventions")
    private PlanIntervention planIntervention;

    private String enginDeclare;

    private String type; // ex: PREVENTIVE, CORRECTIVE
    private String metier; // MECANIQUE, ELECTRICITE, PLOMBERIE, PNEUMATIQUE...
    private String priorite; // BASSE, MOYENNE, HAUTE, CRITIQUE

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String statut; // PROGRAMMEE, EN_COURS, EN_ATTENTE_PIECES, CLOTUREE
    private Double dureeReelle;
    private Double cout;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_technicien")
    private Utilisateur technicien;

    @Column(columnDefinition = "TEXT")
    private String observations;
}
