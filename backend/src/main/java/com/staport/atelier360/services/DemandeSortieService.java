package com.staport.atelier360.services;

import com.staport.atelier360.entities.DemandeSortie;
import com.staport.atelier360.entities.LigneDemandeSortie;
import com.staport.atelier360.repositories.DemandeSortieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DemandeSortieService {

    @Autowired
    private DemandeSortieRepository demandeSortieRepository;

    @Autowired
    private PieceService pieceService;

    public List<DemandeSortie> getAllDemandes() {
        return demandeSortieRepository.findAll();
    }

    public List<DemandeSortie> getDemandesEnAttente() {
        return demandeSortieRepository.findByStatut("EN_ATTENTE_CHEF");
    }

    @Transactional
    public DemandeSortie creerDemande(DemandeSortie demande) {
        if (demande.getDateDemande() == null) {
            demande.setDateDemande(LocalDateTime.now());
        }
        demande.setStatut("EN_ATTENTE_CHEF");
        
        if (demande.getLignes() != null) {
            for (LigneDemandeSortie ligne : demande.getLignes()) {
                ligne.setDemandeSortie(demande);
            }
        }
        return demandeSortieRepository.save(demande);
    }

    @Transactional
    public DemandeSortie validerDemande(@NonNull Long idDemande, String quantiteParLigne) {
        // quantiteParLigne can be used if chef wants to override delivered amount, here we just do Full Validation
        Optional<DemandeSortie> optDemande = demandeSortieRepository.findById(idDemande);
        if (optDemande.isPresent()) {
            DemandeSortie demande = optDemande.get();
            demande.setStatut("VALIDEE");
            
            // Deduct stock
            if (demande.getLignes() != null) {
                for (LigneDemandeSortie ligne : demande.getLignes()) {
                    // Set quantite livree equal to demandee by default for simple validation
                    ligne.setQuantiteLivree(ligne.getQuantiteDemandee());
                    pieceService.updateStock(ligne.getPiece().getIdPiece(), ligne.getQuantiteLivree());
                }
            }
            return demandeSortieRepository.save(demande);
        }
        throw new RuntimeException("Demande de sortie introuvable");
    }

    public DemandeSortie rejeterDemande(@NonNull Long idDemande, String motif) {
        Optional<DemandeSortie> optDemande = demandeSortieRepository.findById(idDemande);
        if (optDemande.isPresent()) {
            DemandeSortie demande = optDemande.get();
            demande.setStatut("REJETEE");
            demande.setMotifRejet(motif);
            return demandeSortieRepository.save(demande);
        }
        throw new RuntimeException("Demande de sortie introuvable");
    }
}
