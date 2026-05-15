package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "plans_intervention")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PlanIntervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPlan;

    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_engin")
    private Engin engin;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_anomalie")
    private Anomalie anomalie;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime datePrevue;

    private String statut; // BROUILLON, EN_COURS, TERMINE, ANNULE

    @OneToMany(mappedBy = "planIntervention", cascade = CascadeType.ALL)
    private List<Intervention> interventions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_responsable")
    private Utilisateur responsable;
}
