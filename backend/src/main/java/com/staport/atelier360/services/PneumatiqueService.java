package com.staport.atelier360.services;

import com.staport.atelier360.entities.Pneumatique;
import com.staport.atelier360.repositories.PneumatiqueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class PneumatiqueService {

    @Autowired
    private PneumatiqueRepository pneumatiqueRepository;

    public List<Pneumatique> getPneusByEngin(Long enginId) {
        return pneumatiqueRepository.findByEnginIdEngin(enginId);
    }

    public Pneumatique enregistrerPneu(Pneumatique pneu) {
        if (pneu.getDatePose() == null) {
            pneu.setDatePose(java.time.LocalDate.now());
        }
        return pneumatiqueRepository.save(pneu);
    }

    public Pneumatique verifierUsure(Long idPneu, Double nouvelUsure) {
        return pneumatiqueRepository.findById(idPneu).map(pneu -> {
            pneu.setEtatUsurePourcent(nouvelUsure);
            if (nouvelUsure >= 80.0) {
                System.out.println("ALERTE: Pneu " + pneu.getPositionEssieu() + " usé à plus de 80%");
            }
            return pneumatiqueRepository.save(pneu);
        }).orElseThrow(() -> new RuntimeException("Pneu non trouvé"));
    }
}
