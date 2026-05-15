package com.staport.atelier360.services;

import com.staport.atelier360.entities.Engin;
import com.staport.atelier360.entities.PointageMateriel;
import com.staport.atelier360.entities.Vidange;
import com.staport.atelier360.repositories.EnginRepository;
import com.staport.atelier360.repositories.PointageMaterielRepository;
import com.staport.atelier360.repositories.VidangeRepository;
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
    private PointageMaterielRepository pointageMaterielRepository;

    public List<Map<String, Object>> getPredictiveAnalysis() {
        List<Map<String, Object>> results = new ArrayList<>();

        List<Engin> engins = enginRepository.findAll();
        if (engins.isEmpty()) return results;

        List<Long> enginIds = engins.stream()
                .map(Engin::getIdEngin)
                .collect(java.util.stream.Collectors.toList());

        // ── Pré-chargement groupé (évite N+1) ──────────────────────────────
        List<Vidange> allVidanges = vidangeRepository.findByEnginIdEnginIn(enginIds);
        Map<Long, List<Vidange>> vidangesByEngin = new HashMap<>();
        for (Vidange v : allVidanges) {
            vidangesByEngin
                .computeIfAbsent(v.getEngin().getIdEngin(), k -> new ArrayList<>())
                .add(v);
        }

        List<PointageMateriel> allPointages = pointageMaterielRepository
                .findByEnginIdEnginInOrderByDatePointageDesc(enginIds);
        Map<Long, List<PointageMateriel>> pointagesByEngin = new HashMap<>();
        for (PointageMateriel p : allPointages) {
            if (p.getEngin() != null) {
                pointagesByEngin
                    .computeIfAbsent(p.getEngin().getIdEngin(), k -> new ArrayList<>())
                    .add(p);
            }
        }
        // ───────────────────────────────────────────────────────────────────

        for (Engin engin : engins) {
            List<Vidange>         enginVidanges  = vidangesByEngin.getOrDefault(engin.getIdEngin(), new ArrayList<>());
            List<PointageMateriel> enginPointages = pointagesByEngin.getOrDefault(engin.getIdEngin(), new ArrayList<>());

            // ── Analyse de l'usage moyen depuis les pointages ────────────────
            double avgUsage = 8.0; // par défaut : 8 h/jour
            if (!enginPointages.isEmpty()) {
                double total = 0; int cnt = 0;
                for (int i = 0; i < Math.min(10, enginPointages.size()); i++) {
                    Double v = enginPointages.get(i).getHeuresTravaillees();
                    if (v != null && v > 0) { total += v; cnt++; }
                }
                if (cnt > 0) avgUsage = total / cnt;
            }
            // ───────────────────────────────────────────────────────────────

            Map<String, Object> prediction = predictNextMaintenance(engin, avgUsage, enginVidanges);
            analyzeGasoilConsumption(engin, prediction, enginPointages);
            results.add(prediction);
        }

        // Trier : CRITICAL en premier, puis HIGH, puis NORMAL
        results.sort(Comparator.comparing(m -> {
            String p = (String) ((Map<?,?>) m).get("priority");
            if ("CRITICAL".equals(p)) return 0;
            if ("HIGH".equals(p))     return 1;
            return 2;
        }));

        return results;
    }

    // ────────────────────────────────────────────────────────────────────────
    //  Prédiction Vidange
    // ────────────────────────────────────────────────────────────────────────
    private Map<String, Object> predictNextMaintenance(Engin engin, double avgUsagePerDay, List<Vidange> vidanges) {
        Map<String, Object> data = new HashMap<>();
        data.put("idEngin",        engin.getIdEngin());
        data.put("codeMateriel",   engin.getCodeMateriel());
        data.put("matricule",      engin.getMatricule());
        data.put("marque",         engin.getMarque());
        data.put("modele",         engin.getModele());
        data.put("categorie",      engin.getCategorie());
        data.put("compteurActuel", engin.getCompteurActuel() != null ? engin.getCompteurActuel() : 0.0);
        data.put("heuresProductionCumulees", engin.getCompteurActuel());
        data.put("uniteCompteur",  "h"); // Toujours des heures pour la production ERP
        data.put("usageQuotidien", Math.round(avgUsagePerDay * 10.0) / 10.0);

        double frequence = getFrequenceVidange(engin);
        data.put("frequenceVidange", frequence);

        if (vidanges == null || vidanges.isEmpty()) {
            data.put("priority",              "HIGH");
            data.put("status",                "AUCUNE_HISTORIQUE");
            data.put("recommendation",        "Aucune vidange enregistrée — planifier immédiatement.");
            data.put("heuresRestantes",       0.0);
            data.put("prochainSeuil",         frequence);
            data.put("dateEstimee",           LocalDate.now().plusDays(3).toString());
            data.put("derniereVidangeDate",   null);
            data.put("derniereVidangeCompteur", null);
            return data;
        }

        vidanges.sort(Comparator.comparing(Vidange::getDateVidange));
        Vidange last = vidanges.get(vidanges.size() - 1);

        double seuil = (last.getProchainSeuil() != null && last.getProchainSeuil() > 0)
                       ? last.getProchainSeuil()
                       : (last.getCompteurEffectue() != null ? last.getCompteurEffectue() : 0) + frequence;

        double current = (engin.getCompteurActuel() != null) ? engin.getCompteurActuel() : 0.0;
        double diff    = seuil - current;
        String unite   = data.get("uniteCompteur").toString();

        data.put("heuresRestantes",           Math.round(diff * 10.0) / 10.0);
        data.put("prochainSeuil",             seuil);
        data.put("derniereVidangeDate",       last.getDateVidange().toString());
        data.put("derniereVidangeCompteur",   last.getCompteurEffectue());
        data.put("dateEstimee",               estimateDate(diff, avgUsagePerDay));

        // Seuil d'alerte = 10% de la fréquence si non configuré
        double seuilAlerte = (engin.getSeuilAlerteVidange() != null && engin.getSeuilAlerteVidange() > 0)
                             ? engin.getSeuilAlerteVidange()
                             : frequence * 0.10;

        if (diff <= 0) {
            data.put("priority",       "CRITICAL");
            data.put("status",         "DÉPASSÉ");
            data.put("recommendation", "Vidange urgente ! Dépassement de " + Math.abs(Math.round(diff)) + " " + unite + " — Risque de casse moteur.");
        } else if (diff <= seuilAlerte) {
            data.put("priority",       "HIGH");
            data.put("status",         "PROCHE");
            data.put("recommendation", "Planifier une vidange rapidement (reste " + Math.round(diff) + " " + unite + ").");
        } else {
            data.put("priority",       "NORMAL");
            data.put("status",         "OK");
            data.put("recommendation", "Optimal — prochain entretien estimé le " + data.get("dateEstimee") + ".");
        }

        return data;
    }

    /**
     * Fréquence de vidange : utilise la valeur BDD, sinon défaut industriel.
     * Engins TP : 250 h | Camions / Véhicules : 10 000 km
     */
    private double getFrequenceVidange(Engin engin) {
        if (engin.getFrequenceVidange() != null && engin.getFrequenceVidange() > 0) {
            return engin.getFrequenceVidange();
        }
        String unite = (engin.getUniteCompteur() != null) ? engin.getUniteCompteur().toLowerCase() : "h";
        if ("km".equals(unite)) return 10000.0;
        return 250.0;
    }

    // ────────────────────────────────────────────────────────────────────────
    //  Analyse Gasoil
    // ────────────────────────────────────────────────────────────────────────
    private void analyzeGasoilConsumption(Engin engin, Map<String, Object> data, List<PointageMateriel> pointages) {
        if (pointages == null || pointages.isEmpty()) {
            data.put("gasoilStatus", "INCONNU");
            data.put("consommationMoyenne", 0.0);
            return;
        }

        double totalGasoil = 0.0, totalTravail = 0.0;
        int count = 0;

        for (PointageMateriel pm : pointages) {
            if (pm.getGasoilConsomme() != null && pm.getHeuresTravaillees() != null
                    && pm.getHeuresTravaillees() > 0) {
                totalGasoil  += pm.getGasoilConsomme();
                totalTravail += pm.getHeuresTravaillees();
                count++;
                if (count >= 10) break;
            }
        }

        if (count > 0 && totalTravail > 0) {
            double ratio = totalGasoil / totalTravail;
            data.put("consommationMoyenne", Math.round(ratio * 100.0) / 100.0);

            if (engin.getConsommationGasoilNorme() != null && engin.getConsommationGasoilNorme() > 0) {
                double norme = engin.getConsommationGasoilNorme();
                if (ratio > norme * 1.20) {
                    data.put("gasoilStatus", "SURCONSOMMATION_CRITIQUE");
                    data.put("gasoilAlert",  "Fuite ou défaut moteur (+" + Math.round(((ratio / norme) - 1) * 100) + "%)");
                } else if (ratio > norme) {
                    data.put("gasoilStatus", "SURCONSOMMATION_LEGERE");
                } else {
                    data.put("gasoilStatus", "OPTIMAL");
                }
            } else {
                data.put("gasoilStatus", "NON_EVALUE");
            }
        } else {
            data.put("gasoilStatus", "INCONNU");
            data.put("consommationMoyenne", 0.0);
        }
    }

    private String estimateDate(double heuresRestantes, double avgUsage) {
        if (heuresRestantes <= 0) return LocalDate.now().toString();
        long days = (long) Math.max(1, Math.ceil(heuresRestantes / Math.max(1.0, avgUsage)));
        return LocalDate.now().plusDays(days).format(DateTimeFormatter.ISO_DATE);
    }
}
