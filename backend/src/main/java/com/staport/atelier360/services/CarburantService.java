package com.staport.atelier360.services;

import com.staport.atelier360.entities.ConsommationCarburant;
import com.staport.atelier360.repositories.ConsommationCarburantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CarburantService {

    @Autowired
    private ConsommationCarburantRepository carburantRepository;

    public List<ConsommationCarburant> getLogsByEngin(Long enginId) {
        return carburantRepository.findByEnginIdEngin(enginId);
    }

    public List<ConsommationCarburant> getAllLogs() {
        return carburantRepository.findAll();
    }

    public ConsommationCarburant addLog(ConsommationCarburant log) {
        if (log.getDatePlein() == null) {
            log.setDatePlein(LocalDateTime.now());
        }
        
        // On pourrait mettre à jour le compteur de l'engin ici si `log.getCompteurAuPlein()` est plus grand que le compteur actuel de l'engin
        if (log.getEngin() != null && log.getCompteurAuPlein() != null) {
           if (log.getEngin().getCompteurActuel() == null || log.getEngin().getCompteurActuel() < log.getCompteurAuPlein()) {
               log.getEngin().setCompteurActuel(log.getCompteurAuPlein());
           }
        }
        
        return carburantRepository.save(log);
    }

    // Calcul de ratio optionnel :  (L / 100km) ou (L / heure)
    public Double calculerConsoMoyenne(Long enginId) {
        List<ConsommationCarburant> logs = carburantRepository.findByEnginIdEngin(enginId);
        if (logs.size() < 2) return 0.0;
        
        logs.sort((a, b) -> a.getDatePlein().compareTo(b.getDatePlein()));
        
        Double totalLitres = logs.stream().mapToDouble(c -> c.getQuantiteLitres() != null ? c.getQuantiteLitres() : 0.0).sum();
        
        Double firstCompteur = logs.get(0).getCompteurAuPlein();
        Double lastCompteur = logs.get(logs.size() - 1).getCompteurAuPlein();
        
        if (firstCompteur != null && lastCompteur != null && lastCompteur > firstCompteur) {
            return (totalLitres / (lastCompteur - firstCompteur)) * 100; // Si en km, L/100km
        }
        
        return 0.0;
    }
}
