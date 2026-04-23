package com.staport.atelier360.services;

import com.staport.atelier360.entities.Anomalie;
import com.staport.atelier360.repositories.AnomalieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class AnomalieService {

    @Autowired
    private AnomalieRepository anomalieRepository;

    @Autowired
    private com.staport.atelier360.repositories.InterventionRepository interventionRepository;

    public List<Anomalie> getAllAnomalies() {
        return anomalieRepository.findAll();
    }

    public List<Anomalie> getAnomaliesByEngin(Long idEngin) {
        return anomalieRepository.findByEnginIdEngin(idEngin);
    }

    public Optional<Anomalie> getAnomalieById(Long id) {
        return anomalieRepository.findById(id);
    }

    public Anomalie createAnomalie(Anomalie anomalie) {
        if (anomalie.getDateSignalement() == null) {
            anomalie.setDateSignalement(LocalDateTime.now());
        }
        if (anomalie.getStatut() == null) {
            anomalie.setStatut("Signalée");
        }
        
        // Logique métier : Si criticite est urgent, déclencher notification au chef (à implémenter)
        if (anomalie.getCriticite() != null && anomalie.getCriticite().name().equals("URGENT")) {
            System.out.println("ALERTE URGENTE: Envoi d'une notification au chef d'atelier pour l'engin " 
                + (anomalie.getEngin() != null ? anomalie.getEngin().getMatricule() : "inconnu"));
        }

        return anomalieRepository.save(anomalie);
    }

    public Anomalie updateStatut(Long id, String statut) {
        Optional<Anomalie> anomalieOpt = anomalieRepository.findById(id);
        if (anomalieOpt.isPresent()) {
            Anomalie anomalie = anomalieOpt.get();
            anomalie.setStatut(statut);
            return anomalieRepository.save(anomalie);
        }
        throw new RuntimeException("Anomalie introuvable avec l'ID: " + id);
    }

    public void deleteAnomalie(Long id) {
        com.staport.atelier360.entities.Intervention linkedInt = interventionRepository.findByAnomalieIdAnomalie(id);
        if (linkedInt != null) {
            interventionRepository.delete(linkedInt);
        }
        anomalieRepository.deleteById(id);
    }
}
