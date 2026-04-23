package com.staport.atelier360.entities;

import com.staport.atelier360.enums.Criticite;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "anomalies")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Anomalie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAnomalie;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_engin")
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private Engin engin;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String enginDeclare;

    @Enumerated(EnumType.STRING)
    private Criticite criticite;

    private String statut;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime dateSignalement;
    
    private String photoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_declarant")
    private Utilisateur declarant;
}
