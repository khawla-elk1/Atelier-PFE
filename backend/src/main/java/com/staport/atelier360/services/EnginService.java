package com.staport.atelier360.services;

import com.staport.atelier360.entities.Engin;
import com.staport.atelier360.repositories.EnginRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class EnginService {

    @Autowired
    private EnginRepository enginRepository;

    public List<Engin> getAllEngins() {
        return enginRepository.findAll();
    }

    public Optional<Engin> getEnginById(@NonNull Long id) {
        return enginRepository.findById(id);
    }

    public Engin createEngin(@NonNull Engin engin) {
        return enginRepository.save(engin);
    }

    public Optional<Engin> updateEngin(@NonNull Long id, Engin updated) {
        return enginRepository.findById(id).map(existing -> {
            existing.setMatricule(updated.getMatricule());
            existing.setMarque(updated.getMarque());
            existing.setModele(updated.getModele());
            existing.setType(updated.getType());
            existing.setCategorie(updated.getCategorie());
            existing.setPoids(updated.getPoids());
            existing.setSerieChassis(updated.getSerieChassis());
            existing.setTypeMoteur(updated.getTypeMoteur());
            existing.setSerieMoteur(updated.getSerieMoteur());
            existing.setImmatriculation(updated.getImmatriculation());
            existing.setDateAcquisition(updated.getDateAcquisition());
            existing.setDateMiseEnCirculation(updated.getDateMiseEnCirculation());
            existing.setCodeInterne(updated.getCodeInterne());
            existing.setCodeMateriel(updated.getCodeMateriel());
            existing.setUniteCompteur(updated.getUniteCompteur());
            existing.setCompteurActuel(updated.getCompteurActuel());
            existing.setStatut(updated.getStatut());
            return enginRepository.save(existing);
        });
    }

    public boolean deleteEngin(@NonNull Long id) {
        if (enginRepository.existsById(id)) {
            enginRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Map<String, Object> getStats() {
        List<Engin> all = enginRepository.findAll();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", all.size());
        stats.put("actifs", all.stream().filter(e -> "ACTIF".equals(e.getStatut())).count());

        // Par catégorie
        Map<String, Long> parCategorie = all.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategorie() != null ? e.getCategorie() : "Autre",
                        Collectors.counting()));
        stats.put("parCategorie", parCategorie);

        // Par marque (top 10)
        Map<String, Long> parMarque = all.stream()
                .filter(e -> e.getMarque() != null && !e.getMarque().isBlank())
                .collect(Collectors.groupingBy(Engin::getMarque, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (a, b) -> a, LinkedHashMap::new));
        stats.put("topMarques", parMarque);

        return stats;
    }
}
