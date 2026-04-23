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

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_anomalie")
    @NotFound(action = NotFoundAction.IGNORE)
    private Anomalie anomalie;

    private String enginDeclare;

    private String type; // ex: PPREVENTIVE, CORRECTIVE

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String statut; // PROGRAMMEE, EN_ATTENTE_PIECES, CLOTUREE
    private Double dureeReelle;
    private Double cout;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_technicien")
    private Utilisateur technicien;

    @Column(columnDefinition = "TEXT")
    private String observations;
}
