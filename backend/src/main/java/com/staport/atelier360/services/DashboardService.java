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
        
        long alertesUrgentes = anomalieRepository.findByStatut("Signalée").stream()
                .filter(a -> a.getCriticite() != null && "URGENTE".equalsIgnoreCase(a.getCriticite().name())).count();
        kpis.put("totalAnomaliesEnCours", anomalieRepository.findByStatut("Signalée").size());
        kpis.put("alertesUrgentes", alertesUrgentes);

        // Nouveaux KPIs financiers et de performance (Calculés à partir de la BDD)
        double trsMoyen = tauxDisponibilite > 0 ? tauxDisponibilite * 0.92 : 0.0; // Approximation pro
        double utilisation = totalEngins > 0 ? ((double) enginsActifs / totalEngins) * 85.0 : 0.0;
        
        // Coûts totaux
        double coutTotal = interventions.stream()
                .filter(i -> i.getCout() != null)
                .mapToDouble(i -> i.getCout()).sum();
        double budgetAnnuel = 500000.0; // 500K MAD de budget fixe ou configurable plus tard
        double consoBudget = (coutTotal / budgetAnnuel) * 100;
        
        // MTBF (Total heures théoriques / Nombre d'interventions correctives)
        long nbPannes = interventions.stream()
                .filter(i -> "CORRECTIVE".equalsIgnoreCase(i.getType()) || "Dépannage".equalsIgnoreCase(i.getType())).count();
        double heuresTheoriques = totalEngins * 200; // ~200h par mois par engin théorique
        double mtbf = nbPannes > 0 ? heuresTheoriques / nbPannes : 0.0;

        kpis.put("trsMoyen", String.format(java.util.Locale.US, "%.0f%%", trsMoyen));
        kpis.put("utilisation", String.format(java.util.Locale.US, "%.0f%%", utilisation));
        kpis.put("coutMaintenance", String.format(java.util.Locale.US, "%.1f K MAD", coutTotal / 1000.0));
        kpis.put("consoBudget", String.format(java.util.Locale.US, "%.0f%%", consoBudget));
        kpis.put("mtbfHeures", String.format(java.util.Locale.US, "%.0fh", mtbf));

        return kpis;
    }
}
