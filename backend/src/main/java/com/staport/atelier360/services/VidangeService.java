package com.staport.atelier360.services;

import com.staport.atelier360.entities.Vidange;
import com.staport.atelier360.entities.Engin;
import com.staport.atelier360.repositories.VidangeRepository;
import com.staport.atelier360.repositories.EnginRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.lang.NonNull;

@Service
@SuppressWarnings("null")
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

    /**
     * Enregistre une nouvelle vidange et calcule automatiquement le prochain seuil
     * selon la fréquence configurée sur l'engin (ou le défaut industriel).
     */
    public Vidange enregistrerVidange(Vidange vidange) {
        if (vidange.getDateVidange() == null) {
            vidange.setDateVidange(LocalDate.now());
        }

        // Calcul automatique du prochain seuil si non fourni
        if (vidange.getProchainSeuil() == null && vidange.getCompteurEffectue() != null) {
            double frequence = getFrequenceVidange(vidange.getEngin());
            vidange.setProchainSeuil(vidange.getCompteurEffectue() + frequence);
        }

        // Mise à jour du compteur de l'engin si nécessaire
        if (vidange.getEngin() != null && vidange.getCompteurEffectue() != null) {
            Optional<Engin> enginOpt = enginRepository.findById(vidange.getEngin().getIdEngin());
            enginOpt.ifPresent(engin -> {
                if (engin.getCompteurActuel() == null || vidange.getCompteurEffectue() > engin.getCompteurActuel()) {
                    engin.setCompteurActuel(vidange.getCompteurEffectue());
                    enginRepository.save(engin);
                }
            });
        }

        return vidangeRepository.save(vidange);
    }

    /**
     * Vérifie si l'engin approche du seuil de vidange.
     * Utilise le seuil d'alerte configuré sur l'engin (défaut = 10% de la fréquence).
     */
    public boolean verifierAlerteVidange(@NonNull Long enginId) {
        Optional<Engin> enginOpt = enginRepository.findById(enginId);
        if (enginOpt.isEmpty()) return false;

        Engin engin = enginOpt.get();
        List<Vidange> vidanges = vidangeRepository.findByEnginIdEngin(enginId);

        if (vidanges.isEmpty() || engin.getCompteurActuel() == null) return false;

        // Dernière vidange (la plus récente par date)
        Vidange derniere = vidanges.stream()
            .max(Comparator.comparing(Vidange::getDateVidange))
            .orElse(null);

        if (derniere == null || derniere.getProchainSeuil() == null) return false;

        double seuilAlerte = (engin.getSeuilAlerteVidange() != null && engin.getSeuilAlerteVidange() > 0)
                             ? engin.getSeuilAlerteVidange()
                             : getFrequenceVidange(engin) * 0.10;

        double restant = derniere.getProchainSeuil() - engin.getCompteurActuel();
        boolean alerte = restant <= seuilAlerte;

        if (alerte) {
            System.out.println("ALERTE VIDANGE : " + engin.getCodeMateriel()
                + " — reste " + Math.round(restant) + " " + (engin.getUniteCompteur() != null ? engin.getUniteCompteur() : "unités"));
        }
        return alerte;
    }

    /** Fréquence de vidange : valeur BDD ou défaut industriel (250h / 10 000 km) */
    private double getFrequenceVidange(Engin engin) {
        if (engin == null) return 250.0;
        if (engin.getFrequenceVidange() != null && engin.getFrequenceVidange() > 0) {
            return engin.getFrequenceVidange();
        }
        String unite = (engin.getUniteCompteur() != null) ? engin.getUniteCompteur().toLowerCase() : "h";
        return "km".equals(unite) ? 10000.0 : 250.0;
    }
}
