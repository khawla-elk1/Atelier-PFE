package com.staport.atelier360.services;

import com.staport.atelier360.entities.Chantier;
import com.staport.atelier360.repositories.ChantierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.logging.Logger;

/**
 * Service de synchronisation des Chantiers depuis l'ERP WinDev STAPORT.
 * Stratégie : L'ERP est la source de vérité pour la liste des chantiers.
 * Atelier360 enrichit les données avec des informations locales (statut, localisation...).
 */
@Service
@SuppressWarnings({"null", "rawtypes", "unchecked"})
public class ChantierSyncService {

    private static final Logger log = Logger.getLogger(ChantierSyncService.class.getName());
    private static final String ERP_CHANTIERS_URL = "http://staport.dyndns.org/webServiceBS/getChantiers";

    @Autowired
    private ChantierRepository chantierRepository;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Synchronise les chantiers depuis l'ERP.
     * Crée les nouveaux, met à jour le nom des existants.
     * Ne supprime JAMAIS un chantier local (données GMAO préservées).
     *
     * @return Map avec statistiques de synchronisation
     */
    public Map<String, Object> syncFromErp() {
        Map<String, Object> result = new HashMap<>();
        int created = 0, updated = 0, errors = 0;

        try {
            // Appel ERP
            List<Map> erpChantiers = Arrays.asList(
                Objects.requireNonNull(restTemplate.getForObject(ERP_CHANTIERS_URL, Map[].class))
            );

            log.info("[ERP SYNC] " + erpChantiers.size() + " chantiers reçus depuis l'ERP.");

            // Liste des chantiers actifs fournie par la direction (LES CHANTIERS.xlsx)
            Set<String> activeCodes = new HashSet<>(Arrays.asList(
                "C057", "C129", "C184", "C198", "C184A", "C168", "C168A3", "C168A", "C168B", 
                "C186A", "C186", "C186C", "C190", "C189", "C167", "C194", "C196", "C204", 
                "C155", "203", "208", "205", "C176B", "206", "C097", "C177"
            ));

            // Récupérer tous les chantiers locaux pour les mettre par défaut à TERMINE 
            // et on mettra à jour ceux qui sont dans la liste.
            List<Chantier> allLocalChantiers = chantierRepository.findAll();
            for (Chantier c : allLocalChantiers) {
                if (!activeCodes.contains(c.getCodeErp()) && "ACTIF".equals(c.getStatut())) {
                    c.setStatut("TERMINE");
                    chantierRepository.save(c);
                    updated++;
                }
            }

            for (Map erpRow : erpChantiers) {
                try {
                    String code = (String) erpRow.get("code");
                    String designation = (String) erpRow.get("designation");
                    Integer codeErreur = (Integer) erpRow.get("CodeErreur");

                    // Ignorer les lignes en erreur ou sans code
                    if (code == null || code.isBlank() || (codeErreur != null && codeErreur != 0)) {
                        continue;
                    }

                    // Nettoyer designation (peut contenir des espaces/retours à la ligne)
                    designation = designation != null ? designation.trim().replaceAll("\\s+", " ") : code;

                    // id_chantier de l'ERP (peut être un long)
                    Long idErp = null;
                    Object rawId = erpRow.get("id_chantier");
                    if (rawId instanceof Number) {
                        idErp = ((Number) rawId).longValue();
                    }

                    Optional<Chantier> existingOpt = chantierRepository.findByCodeErp(code);

                    if (existingOpt.isPresent()) {
                        // Mise à jour du nom ERP uniquement (on ne touche pas aux données locales)
                        Chantier existing = existingOpt.get();
                        boolean changed = false;
                        if (!designation.equals(existing.getDesignationErp())) {
                            existing.setDesignationErp(designation);
                            changed = true;
                        }
                        if (idErp != null && !idErp.equals(existing.getIdChantierErp())) {
                            existing.setIdChantierErp(idErp);
                            changed = true;
                        }
                        // Nom visible = désignation ERP si pas de nom local
                        if (existing.getNom() == null || existing.getNom().isBlank()) {
                            existing.setNom(designation.length() > 80 ? designation.substring(0, 80) + "..." : designation);
                            changed = true;
                        }
                        String correctStatus = activeCodes.contains(code) ? "ACTIF" : "TERMINE";
                        if (!correctStatus.equals(existing.getStatut())) {
                            existing.setStatut(correctStatus);
                            changed = true;
                        }

                        if (changed) {
                            chantierRepository.save(existing);
                            updated++;
                        }
                    } else {
                        // Nouveau chantier ERP → créer dans Atelier360
                        String nom = designation.length() > 100 ? designation.substring(0, 97) + "..." : designation;
                        String correctStatus = activeCodes.contains(code) ? "ACTIF" : "TERMINE";
                        Chantier nouveau = Chantier.builder()
                                .codeErp(code)
                                .idChantierErp(idErp)
                                .designationErp(designation)
                                .nom(nom)
                                .statut(correctStatus)
                                .build();
                        chantierRepository.save(nouveau);
                        created++;
                    }
                } catch (Exception rowEx) {
                    log.warning("[ERP SYNC] Erreur sur ligne chantier: " + rowEx.getMessage());
                    errors++;
                }
            }

            result.put("status", "SUCCESS");
            result.put("totalErp", erpChantiers.size());
            result.put("created", created);
            result.put("updated", updated);
            result.put("errors", errors);
            result.put("totalLocal", chantierRepository.count());

        } catch (Exception e) {
            log.severe("[ERP SYNC] Erreur connexion ERP chantiers: " + e.getMessage());
            result.put("status", "ERROR");
            result.put("message", "Impossible de contacter l'ERP: " + e.getMessage());
        }

        return result;
    }
}
