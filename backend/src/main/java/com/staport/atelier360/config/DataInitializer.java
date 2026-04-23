package com.staport.atelier360.config;

import com.staport.atelier360.entities.Engin;
import com.staport.atelier360.entities.Anomalie;
import com.staport.atelier360.entities.Intervention;
import com.staport.atelier360.enums.Criticite;
import com.staport.atelier360.repositories.EnginRepository;
import com.staport.atelier360.repositories.AnomalieRepository;
import com.staport.atelier360.repositories.InterventionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(EnginRepository enginRepository, 
                                 AnomalieRepository anomalieRepository,
                                 InterventionRepository interventionRepository) {
        return args -> {
            if (enginRepository.count() == 0) {
                System.out.println("Initializing Database with seed data...");

                // 1. Create Engins
                Engin e1 = Engin.builder()
                        .matricule("MAT-001")
                        .codeInterne("P-001")
                        .marque("JCB")
                        .modele("3CX")
                        .categorie("Engin")
                        .statut("ACTIF")
                        .compteurActuel(1250.0)
                        .build();
                
                Engin e2 = Engin.builder()
                        .matricule("MAT-042")
                        .codeInterne("C-042")
                        .marque("Mercedes")
                        .modele("Actros")
                        .categorie("Camion")
                        .statut("PANNE")
                        .compteurActuel(45000.0)
                        .build();

                enginRepository.saveAll(List.of(e1, e2));

                // 2. Create Anomalies
                Anomalie a1 = Anomalie.builder()
                        .engin(e2)
                        .description("Fuite hydraulique sur bras principal")
                        .criticite(Criticite.URGENTE)
                        .statut("Signalée")
                        .dateSignalement(LocalDateTime.now().minusDays(2))
                        .build();
                
                anomalieRepository.save(a1);

                // 3. Create Interventions
                Intervention i1 = Intervention.builder()
                        .engin(e1)
                        .type("Préventive")
                        .statut("Terminée")
                        .dateDebut(LocalDateTime.now().minusDays(5))
                        .dateFin(LocalDateTime.now().minusDays(5))
                        .dureeReelle(4.0)
                        .cout(1200.0)
                        .observations("Vidange standard effectuée")
                        .build();

                interventionRepository.save(i1);

                System.out.println("Database initialized successfully!");
            }
        };
    }
}
