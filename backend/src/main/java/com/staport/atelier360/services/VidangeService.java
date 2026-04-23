package com.staport.atelier360.services;

import com.staport.atelier360.entities.Vidange;
import com.staport.atelier360.entities.Engin;
import com.staport.atelier360.repositories.VidangeRepository;
import com.staport.atelier360.repositories.EnginRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import org.springframework.lang.NonNull;

@Service
public class VidangeService {

    @Autowired
    private VidangeRepository vidangeRepository;

    @Autowired
    private EnginRepository enginRepository;

    public List<Vidange> getAllVidanges() {
        return vidangeRepository.findAll();
    }

    public List<Vidange> getVidangesByEngin(Long enginId) {
        return vidangeRepository.findByEnginIdEngin(enginId);
    }

    public Vidange enregistrerVidange(Vidange vidange) {
        if (vidange.getDateVidange() == null) {
            vidange.setDateVidange(java.time.LocalDate.now());
        }

        // Calculer le prochain seuil si non fourni
        if (vidange.getProchainSeuil() == null && vidange.getCompteurEffectue() != null) {
            // Par défaut, disons que la vidange se fait tous les 10000 kms ou heures
            vidange.setProchainSeuil(vidange.getCompteurEffectue() + 10000.0);
        }

        return vidangeRepository.save(vidange);
    }
    
    // Fonction d'alerte pour vérifier si l'engin est proche de la vidange
    public boolean verifierAlerteVidange(@NonNull Long enginId) {
        Optional<Engin> enginOpt = enginRepository.findById(enginId);
        if (enginOpt.isPresent()) {
            Engin engin = enginOpt.get();
            List<Vidange> vidanges = vidangeRepository.findByEnginIdEngin(enginId);
            
            if (!vidanges.isEmpty()) {
                // Trouver la dernière vidange (simplifié en prenant la dernière ajoutée)
                Vidange derniere = vidanges.get(vidanges.size() - 1);
                
                // Si compteur actuel >= prochain_seuil - 500 (comme défini dans le CDC)
                if (engin.getCompteurActuel() != null && derniere.getProchainSeuil() != null &&
                    engin.getCompteurActuel() >= (derniere.getProchainSeuil() - 500)) {
                    System.out.println("ALERTE VIDANGE pour l'engin : " + engin.getMatricule());
                    return true;
                }
            }
        }
        return false;
    }
}
