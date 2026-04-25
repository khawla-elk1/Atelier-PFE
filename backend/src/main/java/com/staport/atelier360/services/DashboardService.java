package com.staport.atelier360.services;

import com.staport.atelier360.repositories.EnginRepository;
import com.staport.atelier360.repositories.InterventionRepository;
import com.staport.atelier360.repositories.AnomalieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {

    @Autowired
    private EnginRepository enginRepository;

    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private AnomalieRepository anomalieRepository;

    public Map<String, Object> getKpisGlobaux() {
        Map<String, Object> kpis = new HashMap<>();
        
        var allEngins = enginRepository.findAll();
        long totalEngins = allEngins.size();
        
        long enginsActifs = allEngins.stream()
                .filter(e -> "ACTIF".equalsIgnoreCase(e.getStatut())).count();

        long countEngins = 0;
        long countCamions = 0;
        long countVoitures = 0;

        for (var e : allEngins) {
            String typeStr = e.getType() != null ? e.getType().toLowerCase() : "";
            String catStr = e.getCategorie() != null ? e.getCategorie().toLowerCase() : "";
            
            String categorie = e.getCategorie();
            
            if (catStr.equals("accessoire") || catStr.equals("organe") || catStr.contains("accessoire / organe")) {
                categorie = "Accessoire / Organe";
            } else if (typeStr.contains("brise roche") || typeStr.contains("brh") || typeStr.contains("organe") || 
                       typeStr.contains("accessoire") || typeStr.contains("godet") || typeStr.contains("marteau")) {
                categorie = "Accessoire / Organe";
            } else if ((categorie == null || categorie.isEmpty()) && typeStr.contains("pelle")) {
                categorie = "Engin";
            }
            
            if (categorie == null) categorie = "Engin";
            
            if ("Engin".equalsIgnoreCase(categorie)) {
                countEngins++;
            } else if ("Camion".equalsIgnoreCase(categorie)) {
                countCamions++;
            } else if ("Voiture".equalsIgnoreCase(categorie)) {
                countVoitures++;
            }
        }

        double tauxDisponibilite = totalEngins > 0 ? ((double) enginsActifs / totalEngins) * 100 : 0.0;
        
        kpis.put("totalEngins", totalEngins);
        kpis.put("enginsActifs", enginsActifs);
        kpis.put("countEngins", countEngins);
        kpis.put("countCamions", countCamions);
        kpis.put("countVoitures", countVoitures);
        kpis.put("tauxDisponibilite", String.format(java.util.Locale.US, "%.1f%%", tauxDisponibilite));
        
        // MTTR (Mean Time To Repair)
        var interventions = interventionRepository.findAll();
        double totalDuree = interventions.stream()
                .filter(i -> i.getDureeReelle() != null)
                .mapToDouble(i -> i.getDureeReelle()).sum();
        long interventionsTerminees = interventions.stream()
                .filter(i -> i.getDureeReelle() != null).count();
        double mttr = interventionsTerminees > 0 ? totalDuree / interventionsTerminees : 0.0;
        
        kpis.put("mttrHeures", String.format(java.util.Locale.US, "%.1f h", mttr));
        kpis.put("totalAnomaliesEnCours", anomalieRepository.findByStatut("Signalée").size());

        return kpis;
    }
}
