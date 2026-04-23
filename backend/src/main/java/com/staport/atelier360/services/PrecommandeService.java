package com.staport.atelier360.services;

import com.staport.atelier360.entities.Precommande;
import com.staport.atelier360.enums.StatutPrecommande;
import com.staport.atelier360.repositories.PrecommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.lang.NonNull;

@Service
public class PrecommandeService {

    @Autowired
    private PrecommandeRepository precommandeRepository;

    @Autowired
    private ErpExportService erpExportService;

    public List<Precommande> getAllPrecommandes() {
        return precommandeRepository.findAll();
    }

    public Optional<Precommande> getPrecommandeById(@NonNull Long id) {
        return precommandeRepository.findById(id);
    }

    public Precommande createPrecommande(Precommande precommande) {
        if (precommande.getDateCreation() == null) {
            precommande.setDateCreation(LocalDateTime.now());
        }
        precommande.setStatutErp(StatutPrecommande.EN_ATTENTE);
        
        // Generate a reference if empty
        if (precommande.getRefPrecom() == null || precommande.getRefPrecom().isEmpty()) {
            precommande.setRefPrecom("PRC-" + System.currentTimeMillis());
        }

        if (precommande.getLignes() != null) {
            precommande.getLignes().forEach(ligne -> ligne.setPrecommande(precommande));
        }

        return precommandeRepository.save(precommande);
    }

    public Precommande genererPrecommandeERP(@NonNull Long id) throws IOException {
        Optional<Precommande> precommandeOpt = precommandeRepository.findById(id);
        if (precommandeOpt.isPresent()) {
            Precommande precommande = precommandeOpt.get();
            String path = erpExportService.genererXml(precommande);
            // On pourrai stocker le chemin ou changer le statut
            precommande.setFichierXmlUrl(path);
            return precommandeRepository.save(precommande);
        }
        throw new RuntimeException("Precommande introuvable avec l'ID: " + id);
    }

    public Precommande updateStatutERP(@NonNull Long id, StatutPrecommande statut) {
        Optional<Precommande> precommandeOpt = precommandeRepository.findById(id);
        if (precommandeOpt.isPresent()) {
            Precommande precommande = precommandeOpt.get();
            precommande.setStatutErp(statut);
            if (statut == StatutPrecommande.VALIDE) {
                precommande.setDateValidationErp(LocalDateTime.now());
            }
            return precommandeRepository.save(precommande);
        }
        throw new RuntimeException("Precommande introuvable avec l'ID: " + id);
    }
}
