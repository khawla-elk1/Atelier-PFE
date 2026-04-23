package com.staport.atelier360.entities;

import com.staport.atelier360.enums.StatutPrecommande;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "precommandes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Precommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPrecom;

    @Column(unique = true, nullable = false)
    private String refPrecom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_intervention")
    private Intervention intervention;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime dateCreation;

    @Enumerated(EnumType.STRING)
    private StatutPrecommande statutErp;

    private String fichierXmlUrl;
    
    private LocalDateTime dateValidationErp;

    @OneToMany(mappedBy = "precommande", cascade = CascadeType.ALL)
    private java.util.List<LignePrecom> lignes;
}
