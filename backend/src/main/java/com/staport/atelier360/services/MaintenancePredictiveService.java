package com.staport.atelier360.services;

import com.staport.atelier360.entities.Engin;
import com.staport.atelier360.entities.Vidange;
import com.staport.atelier360.repositories.EnginRepository;
import com.staport.atelier360.repositories.VidangeRepository;
import com.staport.atelier360.services.providers.ExcelPointageProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class MaintenancePredictiveService {

    @Autowired
    private EnginRepository enginRepository;

    @Autowired
    private VidangeRepository vidangeRepository;

    @Autowired
    private ExcelPointageProvider pointageProvider;

    public List<Map<String, Object>> getPredictiveAnalysis() {
        List<Map<String, Object>> results = new ArrayList<>();
        
        // 1. Lire les statistiques de pointage (compteur et utilisation moyenne)
        Map<String, Map<String, Double>> pointageStats = pointageProvider.getPointageStats();
        
        // 2. Analyser chaque Engin
        List<Engin> engins = enginRepository.findAll();
        for (Engin engin : engins) {
            String code = (engin.getCodeMateriel() != null) ? engin.getCodeMateriel().trim() : engin.getMatricule();
            Map<String, Double> stats = pointageStats.get(code);
            
            // Try matricule if codeMateriel fails
            if (stats == null && engin.getMatricule() != null) {
                stats = pointageStats.get(engin.getMatricule().trim());
            }

            double avgUsage = 8.0; // Default
            if (stats != null) {
                Double pointageFile = stats.get("latestMeter");
                avgUsage = stats.getOrDefault("avgUsage", 8.0);

                if (pointageFile != null) {
                    if (engin.getCompteurActuel() == null || pointageFile > engin.getCompteurActuel()) {
                        engin.setCompteurActuel(pointageFile);
                        enginRepository.save(engin);
                    }
                }
            }

            // Calcul de prédiction avec l'usage moyen détecté
            Map<String, Object> prediction = predictNextMaintenance(engin, avgUsage);
            results.add(prediction);
        }
        
        return results;
    }

    private Map<String, Object> predictNextMaintenance(Engin engin, double avgUsagePerDay) {
        Map<String, Object> data = new HashMap<>();
        data.put("idEngin", engin.getIdEngin());
        data.put("codeMateriel", engin.getCodeMateriel());
        data.put("matricule", engin.getMatricule());
        data.put("compteurActuel", engin.getCompteurActuel());
        data.put("usageQuotidien", avgUsagePerDay);
        
        // Trouver la dernière vidange pour cet engin
        List<Vidange> vidanges = vidangeRepository.findByEnginIdEngin(engin.getIdEngin());
        if (vidanges.isEmpty()) {
            data.put("status", "AUCUNE_HISTORIQUE");
            data.put("recommendation", "Planifier une maintenance initiale");
            data.put("heuresRestantes", 0.0);
            data.put("dateEstimated", LocalDate.now().toString());
            return data;
        }

        Vidange last = vidanges.get(vidanges.size() - 1);
        double seuil = last.getProchainSeuil() != null ? last.getProchainSeuil() : (last.getCompteurEffectue() + 500);
        
        double currentCompteur = (engin.getCompteurActuel() != null) ? engin.getCompteurActuel() : 0.0;
        double diff = seuil - currentCompteur;
        
        data.put("heuresRestantes", diff);
        data.put("dateEstimated", estimateDate(diff, avgUsagePerDay));
        
        if (diff <= 0) {
            data.put("priority", "CRITICAL");
            data.put("status", "DÉPASSÉ");
        } else if (diff < 50) {
            data.put("priority", "HIGH");
            data.put("status", "PROCHE");
        } else {
            data.put("priority", "NORMAL");
            data.put("status", "OK");
        }
        
        return data;
    }

    private String estimateDate(double heuresRestantes, double avgUsage) {
        if (heuresRestantes <= 0) return LocalDate.now().toString();
        // Estimation basée sur l'usage réel constaté
        long days = (long) Math.max(1, Math.ceil(heuresRestantes / Math.max(1.0, avgUsage)));
        return LocalDate.now().plusDays(days).format(DateTimeFormatter.ISO_DATE);
    }
}
