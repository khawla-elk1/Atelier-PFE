package com.staport.atelier360.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consommations_carburant")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsommationCarburant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_engin")
    private Engin engin;

    private LocalDateTime datePlein;
    private Double quantiteLitres;
    private Double compteurAuPlein;
    private Double coutTotal;
    private String nomStation;
    
    @Column(columnDefinition = "TEXT")
    private String observations;
}
