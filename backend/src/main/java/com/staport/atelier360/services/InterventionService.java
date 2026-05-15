package com.staport.atelier360.services;

import com.staport.atelier360.entities.Intervention;
import com.staport.atelier360.entities.Utilisateur;
import com.staport.atelier360.repositories.InterventionRepository;
import com.staport.atelier360.repositories.AnomalieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@SuppressWarnings("null")
public class InterventionService {

    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private AnomalieRepository anomalieRepository;

    public List<Intervention> getAllInterventions() {
        return interventionRepository.findAll();
    }

    public List<Intervention> getInterventionsByEngin(Long enginId) {
        return interventionRepository.findByEnginIdEngin(enginId);
    }

    public Optional<Intervention> getInterventionById(Long id) {
        return interventionRepository.findById(id);
    }

    public Intervention createIntervention(Intervention intervention) {
        if (intervention.getDateDebut() == null) {
            intervention.setDateDebut(LocalDateTime.now());
        }
        if (intervention.getStatut() == null) {
            intervention.setStatut("PROGRAMMEE");
        }
        
        Intervention savedIntervention = interventionRepository.save(intervention);
        
        // Mettre à jour le statut de l'anomalie liée si elle existe
        if (savedIntervention.getAnomalie() != null && savedIntervention.getAnomalie().getIdAnomalie() != null) {
            anomalieRepository.findById(savedIntervention.getAnomalie().getIdAnomalie()).ifPresent(anomalie -> {
                anomalie.setStatut("EN_COURS");
                anomalieRepository.save(anomalie);
            });
        }
        
        return savedIntervention;
    }

    public Intervention cloturerIntervention(Long id, LocalDateTime dateFin, Double dureeReelle, Double cout, String observations) {
        return interventionRepository.findById(id).map(intervention -> {
            intervention.setDateFin(dateFin != null ? dateFin : LocalDateTime.now());
            intervention.setDureeReelle(dureeReelle);
            intervention.setCout(cout);
            intervention.setObservations(observations);
            intervention.setStatut("Clôturée");
            
            if (intervention.getEngin() != null) {
                intervention.getEngin().setStatut("ACTIF");
            }
            
            if (intervention.getAnomalie() != null) {
                 anomalieRepository.findById(intervention.getAnomalie().getIdAnomalie()).ifPresent(anomalie -> {
                     anomalie.setStatut("RESOLUE");
                     anomalieRepository.save(anomalie);
                 });
            }

            return interventionRepository.save(intervention);
        }).orElseThrow(() -> new RuntimeException("Intervention introuvable avec l'ID: " + id));
    }

    public Intervention mettreEnAttentePieces(Long id) {
        return interventionRepository.findById(id).map(intervention -> {
            intervention.setStatut("En Attente Pièces");
            return interventionRepository.save(intervention);
        }).orElseThrow(() -> new RuntimeException("Intervention introuvable avec l'ID: " + id));
    }

    public Intervention assignerTechnicien(Long id, Long technicienId) {
        return interventionRepository.findById(id).map(intervention -> {
            Utilisateur tech = new Utilisateur();
            tech.setIdUser(technicienId);
            intervention.setTechnicien(tech);
            
            String currentStatut = intervention.getStatut();
            if (currentStatut == null || 
                currentStatut.equalsIgnoreCase("Programmée") || 
                currentStatut.equalsIgnoreCase("PROGRAMMEE") || 
                currentStatut.equalsIgnoreCase("EN_ATTENTE")) {
                intervention.setStatut("EN_COURS");
            }
            
            return interventionRepository.save(intervention);
        }).orElseThrow(() -> new RuntimeException("Intervention introuvable avec l'ID: " + id));
    }

    public void deleteIntervention(Long id) {
        interventionRepository.deleteById(id);
    }
}
