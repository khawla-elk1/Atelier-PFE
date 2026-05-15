package com.staport.atelier360.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.staport.atelier360.entities.PointageMateriel;
import com.staport.atelier360.entities.Vidange;
import com.staport.atelier360.repositories.PointageMaterielRepository;
import com.staport.atelier360.repositories.VidangeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import com.staport.atelier360.entities.Engin;
import com.staport.atelier360.entities.Chantier;
import com.staport.atelier360.repositories.EnginRepository;
import com.staport.atelier360.repositories.ChantierRepository;

@Service
@SuppressWarnings("null")
public class ErpSyncService {

    @Autowired
    private PointageMaterielRepository pointageMaterielRepository;

    @Autowired
    private VidangeRepository vidangeRepository;

    @Autowired
    private EnginRepository enginRepository;

    @Autowired
    private ChantierRepository chantierRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    // Endpoint pour les compteurs (vidange)
    private final String PONTAGE_BASE_URL = "http://staport.dyndns.org/webServiceBS/getPontageMateriel";
    // Endpoint pour les statuts et heures travaillées (totalHeure, heureDebut,
    // heureFin)
    private final String STATUS_BASE_URL = "http://staport.dyndns.org/webServiceBS/getMaterielStatus";
    // Endpoint registre complet des matériels (code + immatricule + désignation)
    private final String MATERIEL_URL = "http://staport.dyndns.org/webServiceBS/getMateriel";

    // ── État de la synchronisation (pour le polling frontend) ──────────────
    public enum SyncStatus {
        IDLE, RUNNING, SUCCESS, ERROR
    }

    private volatile SyncStatus currentSyncStatus = SyncStatus.IDLE;
    private volatile String lastSyncMessage = "Aucune synchronisation effectuée.";
    private volatile LocalDateTime lastSyncTime = null;
    private volatile int lastSyncEnginsMisAJour = 0;
    private volatile int lastSyncNouveauxPointages = 0;
    private volatile boolean syncInProgress = false;

    /** Retourne l'état actuel de la synchronisation (pour polling frontend) */
    public Map<String, Object> getSyncState() {
        Map<String, Object> state = new HashMap<>();
        state.put("status", currentSyncStatus.name());
        state.put("message", lastSyncMessage);
        state.put("lastSyncTime", lastSyncTime != null ? lastSyncTime.toString() : null);
        state.put("enginsMisAJour", lastSyncEnginsMisAJour);
        state.put("nouveauxPointages", lastSyncNouveauxPointages);
        state.put("inProgress", syncInProgress);
        return state;
    }

    private String buildPontageUrl(LocalDate dateD, LocalDate dateF) {
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd");
        return PONTAGE_BASE_URL + "/" + dateD.format(formatter) + "/" + dateF.format(formatter);
    }

    @Scheduled(fixedRate = 3600000) // 1 heure en millisecondes
    public void syncPointagesFromErp() {
        // Synchro horaire : fenêtre glissante de 3 jours (hier → aujourd'hui + 1 jour
        // de sécurité)
        LocalDate dateD = LocalDate.now().minusDays(2);
        LocalDate dateF = LocalDate.now();
        syncPointagesBetween(dateD, dateF);
    }

    @Scheduled(cron = "0 0 1 * * *") // Chaque nuit à 01h00 : synchro complète du mois courant
    public void syncPointagesMoisCourant() {
        LocalDate dateD = LocalDate.now().withDayOfMonth(1);
        LocalDate dateF = LocalDate.now();
        syncPointagesBetween(dateD, dateF);
    }

    /**
     * Lance la synchronisation en arrière-plan (non-bloquante).
     * Permet au frontend de lancer une synchro et de revenir vérifier l'état via
     * getSyncState().
     */
    public boolean startAsyncSync(LocalDate dateD, LocalDate dateF) {
        if (syncInProgress) {
            return false; // Synchro déjà en cours
        }
        new Thread(() -> {
            syncPointagesBetween(dateD, dateF);
        }, "ErpAsyncSyncThread-" + System.currentTimeMillis()).start();
        return true;
    }

    /**
     * Exécuté automatiquement au démarrage de l'application.
     * Effectue une synchronisation "profonde" (6 derniers mois) en arrière-plan
     * pour corriger toutes les affectations de chantiers de manière exacte, sans
     * bloquer.
     */
    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void onStartupDeepSync() {
        new Thread(() -> {
            try {
                System.out.println(
                        "[INIT] Démarrage de la synchronisation automatique profonde (Depuis 01/01/2025) des pointages...");
                LocalDate dateD = LocalDate.of(2025, 1, 1);
                LocalDate dateF = LocalDate.now();
                syncPointagesBetween(dateD, dateF);
                System.out.println("[INIT] Synchronisation automatique terminée avec succès.");
            } catch (Exception e) {
                System.err.println("[INIT] Erreur lors de la synchronisation automatique : " + e.getMessage());
            }
        }, "ErpDeepSyncThread").start();
    }

    /**
     * Synchronise les pointages matériel depuis le nouvel ERP endpoint
     * paramétrique.
     * URL cible : GET /webServiceBS/webServiceBS/getPontageMateriel/{dateD}/{dateF}
     *
     * OPTIMISATION PRO : La synchronisation est maintenant découpée par mois
     * pour éviter les timeouts du serveur ERP et la consommation excessive de
     * mémoire.
     *
     * @param dateD Date de début (incluse)
     * @param dateF Date de fin (incluse)
     */
    public void syncPointagesBetween(LocalDate dateD, LocalDate dateF) {
        if (syncInProgress && currentSyncStatus == SyncStatus.RUNNING) {
            System.out.println("[ERP SYNC] Synchro déjà en cours, ignorée.");
            return;
        }

        syncInProgress = true;
        currentSyncStatus = SyncStatus.RUNNING;
        lastSyncEnginsMisAJour = 0;
        lastSyncNouveauxPointages = 0;
        lastSyncMessage = "Initialisation de la synchronisation (" + dateD + " → " + dateF + ")...";

        System.out.println("Début de la synchronisation PROFESSIONNELLE des pointages...");
        System.out.println("  Plage : " + dateD + " → " + dateF);

        try {
            // ── ÉTAPE 1 : Découpage par mois ─────────────────────────────────────
            List<LocalDate[]> chunks = new ArrayList<>();
            LocalDate current = dateD;
            while (current.isBefore(dateF) || current.isEqual(dateF)) {
                LocalDate endOfMonth = current.withDayOfMonth(current.lengthOfMonth());
                if (endOfMonth.isAfter(dateF))
                    endOfMonth = dateF;
                chunks.add(new LocalDate[] { current, endOfMonth });
                current = endOfMonth.plusDays(1);
            }

            System.out.println("  La synchro sera effectuée en " + chunks.size() + " étapes (blocs mensuels).");

            for (int i = 0; i < chunks.size(); i++) {
                LocalDate d1 = chunks.get(i)[0];
                LocalDate d2 = chunks.get(i)[1];
                lastSyncMessage = String.format("Synchro en cours : étape %d/%d (%s → %s)...", i + 1, chunks.size(), d1,
                        d2);
                System.out.println("  [Etape " + (i + 1) + "/" + chunks.size() + "] " + d1 + " -> " + d2);

                processSyncChunk(d1, d2);
            }

            currentSyncStatus = SyncStatus.SUCCESS;
            lastSyncMessage = String.format(
                    "Sync OK : %d nouveaux pointages, %d engins mis à jour. Plage totale : %s → %s",
                    lastSyncNouveauxPointages, lastSyncEnginsMisAJour, dateD, dateF);
            lastSyncTime = LocalDateTime.now();

        } catch (Exception e) {
            System.err.println("Erreur fatale lors de la synchronisation : " + e.getMessage());
            e.printStackTrace();
            currentSyncStatus = SyncStatus.ERROR;
            lastSyncMessage = "Erreur fatale ERP : " + e.getMessage();
            lastSyncTime = LocalDateTime.now();
        } finally {
            syncInProgress = false;
        }
    }

    /**
     * Traite un bloc de dates (chunk) de manière atomique.
     */
    @org.springframework.transaction.annotation.Transactional
    private void processSyncChunk(LocalDate dateD, LocalDate dateF) {
        try {
            // ── Indexation (à chaque chunk pour avoir les données fraîches) ────
            List<Engin> localEngins = enginRepository.findAll();
            Map<Long, Engin> erpIdToEngin = new HashMap<>();
            Map<String, Engin> codeToEngin = new HashMap<>();
            for (Engin e : localEngins) {
                if (e.getIdMaterielErp() != null)
                    erpIdToEngin.put(e.getIdMaterielErp(), e);
                // On indexe prioritairement par code_interne (Cxxx/Exxx) pour un matching exact
                if (e.getCodeInterne() != null && !e.getCodeInterne().isBlank())
                    codeToEngin.put(e.getCodeInterne().trim().toUpperCase(), e);
                else if (e.getCodeMateriel() != null && !e.getCodeMateriel().isBlank())
                    codeToEngin.put(e.getCodeMateriel().trim().toUpperCase(), e);
            }

            List<Chantier> localChantiers = chantierRepository.findAll();
            Map<String, Chantier> codeErpToChantier = new HashMap<>();
            Map<Long, Chantier> erpIdToChantier = new HashMap<>();
            for (Chantier c : localChantiers) {
                if (c.getCodeErp() != null && !c.getCodeErp().isBlank()) {
                    String code = c.getCodeErp().trim().toUpperCase();
                    if (!codeErpToChantier.containsKey(code) || "ACTIF".equals(c.getStatut()))
                        codeErpToChantier.put(code, c);
                }
                if (c.getIdChantierErp() != null) {
                    if (!erpIdToChantier.containsKey(c.getIdChantierErp()) || "ACTIF".equals(c.getStatut()))
                        erpIdToChantier.put(c.getIdChantierErp(), c);
                }
            }

            // ── Appel API ──
            java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd");
            String dDStr = dateD.format(dtf);
            String dFStr = dateF.format(dtf);

            String pontageUrl = PONTAGE_BASE_URL + "/" + dDStr + "/" + dFStr;
            String statusUrl = STATUS_BASE_URL + "/" + dDStr + "/" + dFStr;

            JsonNode[] pointagesJson = null;
            JsonNode[] statusJson = null;

            try {
                pointagesJson = restTemplate.getForObject(pontageUrl, JsonNode[].class);
            } catch (Exception e) {
                System.err.println("Erreur appel PONTAGE_BASE_URL: " + e.getMessage());
            }

            try {
                statusJson = restTemplate.getForObject(statusUrl, JsonNode[].class);
            } catch (Exception e) {
                System.err.println("Erreur appel STATUS_BASE_URL: " + e.getMessage());
            }

            if ((pointagesJson == null || pointagesJson.length == 0) && (statusJson == null || statusJson.length == 0))
                return;

            // ── Préparer les données Status (heures travaillées) ──
            Map<Long, Double> totalHeureMap = new HashMap<>();
            Map<Long, String> heureDebutMap = new HashMap<>();
            Map<Long, String> heureFinMap = new HashMap<>();

            if (statusJson != null) {
                for (JsonNode node : statusJson) {
                    if (node.has("idPmateriel") && !node.get("idPmateriel").isNull()) {
                        Long idPm = node.get("idPmateriel").asLong();
                        Double total = parseDoubleSafe(node, "totalHeure");
                        if (total > 0)
                            totalHeureMap.put(idPm, total);

                        if (node.has("heureDebut") && !node.get("heureDebut").isNull())
                            heureDebutMap.put(idPm, node.get("heureDebut").asText());
                        if (node.has("heureFin") && !node.get("heureFin").isNull())
                            heureFinMap.put(idPm, node.get("heureFin").asText());
                    }
                }
            }

            // ── Déduplication & Traitement ──
            // Au lieu d'utiliser juste des IDs, récupérons les entités existantes pour
            // pouvoir les mettre à jour
            List<PointageMateriel> existingEntities = pointageMaterielRepository.findAll();
            Map<String, PointageMateriel> pointagesExistantsMap = new HashMap<>();
            for (PointageMateriel pm : existingEntities) {
                if (pm.getSyncId() != null) {
                    pointagesExistantsMap.put(pm.getSyncId(), pm);
                }
            }

            List<PointageMateriel> pointagesToSave = new ArrayList<>();
            Map<Long, LocalDate> enginLatestPointageDate = new HashMap<>();
            Map<Long, Chantier> enginLatestChantier = new HashMap<>();
            Map<Long, Double> enginLatestCompteur = new HashMap<>();

            // Traiter en priorité pointagesJson (qui contient les compteurs de vidange)
            // Si jamais statusJson a des pointages absents de pointagesJson, on pourrait
            // les traiter,
            // mais idPmateriel lie les deux, donc on boucle sur pointagesJson.
            if (pointagesJson != null) {

                for (JsonNode node : pointagesJson) {
                    Long idPmateriel = node.has("idPmateriel") ? node.get("idPmateriel").asLong() : null;
                    Long idMaterielErp = node.has("idmateriel") ? node.get("idmateriel").asLong() : null;
                    Long idChantierErp = node.has("id_chantier") ? node.get("id_chantier").asLong() : null;
                    String codeChantierErp = (node.has("code_chantier")
                            && !node.get("code_chantier").asText().isBlank())
                                    ? node.get("code_chantier").asText().trim().toUpperCase()
                                    : null;

                    if (idPmateriel == null || idMaterielErp == null)
                        continue;

                    // Matching PROFESSIONNEL : On privilégie le CODE (unique) sur l'ID (parfois
                    // dupliqué dans l'ERP)
                    String codeErp = node.has("code") ? node.get("code").asText()
                            : (node.has("code_materiel") ? node.get("code_materiel").asText() : null);
                    Engin enginAssocie = null;
                    if (codeErp != null)
                        enginAssocie = codeToEngin.get(codeErp.trim().toUpperCase());
                    if (enginAssocie == null)
                        enginAssocie = erpIdToEngin.get(idMaterielErp);

                    // Extraction date
                    LocalDate datePointage = dateD; // Fallback
                    String idStr = String.valueOf(idPmateriel);
                    if (idStr.length() >= 12) {
                        try {
                            datePointage = LocalDate.parse(idStr.substring(4, 12),
                                    java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
                        } catch (Exception ignored) {
                        }
                    }

                    Double compteurFin = parseDoubleSafe(node, "compteur_fin");
                    String compositeKey = idPmateriel + "_" + idMaterielErp;

                    Double cDeb = parseDoubleSafe(node, "compteur_debut");
                    Double hDeb = parseDoubleSafe(node, "compteur_h_debut");
                    Double hFin = parseDoubleSafe(node, "compteur_h_fin");

                    if (compteurFin == 0.0 && hFin > 0.0) {
                        compteurFin = hFin; // Fallback to hours counter for the machine's global counter
                        cDeb = hDeb;
                    }

                    // EXTRACTION DES HEURES DEPUIS LE WEBSERVICE getMaterielStatus
                    Double heuresTravaillees = totalHeureMap.getOrDefault(idPmateriel, 0.0);
                    String hDebutShift = heureDebutMap.get(idPmateriel);
                    String hFinShift = heureFinMap.get(idPmateriel);

                    if (!pointagesExistantsMap.containsKey(compositeKey)) {
                        PointageMateriel nouveau = PointageMateriel.builder()
                                .syncId(compositeKey)
                                .idMaterielErp(idMaterielErp)
                                .idChantierErp(idChantierErp)
                                .datePointage(datePointage)
                                .compteurDebut(cDeb)
                                .compteurFin(compteurFin)
                                .heuresTravaillees(heuresTravaillees)
                                .heureDebut(hDebutShift)
                                .heureFin(hFinShift)
                                .statutPointage("IMPORTÉ")
                                .engin(enginAssocie)
                                .build();
                        pointagesToSave.add(nouveau);
                        pointagesExistantsMap.put(compositeKey, nouveau);
                    } else {
                        // Update existing
                        PointageMateriel existant = pointagesExistantsMap.get(compositeKey);
                        boolean changed = false;
                        if (existant.getHeuresTravaillees() == null || existant.getHeuresTravaillees() == 0.0) {
                            if (heuresTravaillees > 0.0) {
                                existant.setHeuresTravaillees(heuresTravaillees);
                                existant.setHeureDebut(hDebutShift);
                                existant.setHeureFin(hFinShift);
                                changed = true;
                            }
                        }
                        if (changed) {
                            pointagesToSave.add(existant);
                        }
                    }

                    if (enginAssocie != null) {
                        if (codeErp != null && !codeErp.trim().isEmpty()) {

                        }
                        Long eid = enginAssocie.getIdEngin();
                        LocalDate exDate = enginLatestPointageDate.get(eid);
                        if (exDate == null || !datePointage.isBefore(exDate)) {
                            enginLatestPointageDate.put(eid, datePointage);
                            if (compteurFin > 0) {
                                Double exC = enginLatestCompteur.get(eid);
                                if (exC == null || compteurFin > exC)
                                    enginLatestCompteur.put(eid, compteurFin);
                            }
                            Chantier chan = (codeChantierErp != null) ? codeErpToChantier.get(codeChantierErp) : null;
                            if (chan == null && idChantierErp != null)
                                chan = erpIdToChantier.get(idChantierErp);
                            if (chan != null)
                                enginLatestChantier.put(eid, chan);
                        }
                    }
                }
            }

            // Traiter également statusJson pour les pointages qui ne sont pas dans
            // pointagesJson (ou si pointagesJson est null/404)
            if (statusJson != null) {
                for (JsonNode node : statusJson) {
                    Long idPmateriel = node.has("idPmateriel") ? node.get("idPmateriel").asLong() : null;
                    if (idPmateriel == null)
                        continue;
                    String compositeKey = idPmateriel + "_"
                            + (node.has("idmateriel") ? node.get("idmateriel").asLong() : "0");

                    if (!pointagesExistantsMap.containsKey(compositeKey)) {
                        Long idMaterielErp = node.has("idmateriel") ? node.get("idmateriel").asLong() : null;
                        Long idChantierErp = node.has("id_chantier") ? node.get("id_chantier").asLong() : null;
                        String codeChantierErp = node.has("code_chantier") ? node.get("code_chantier").asText() : null;

                        String codeErp = node.has("code_materiel") ? node.get("code_materiel").asText() : null;
                        Engin enginAssocie = null;
                        if (codeErp != null && !codeErp.trim().isEmpty())
                            enginAssocie = codeToEngin.get(codeErp.trim().toUpperCase());
                        if (enginAssocie == null && idMaterielErp != null)
                            enginAssocie = erpIdToEngin.get(idMaterielErp);

                        LocalDate datePointage = dateD;
                        if (node.has("date_pointage") && !node.get("date_pointage").isNull()) {
                            try {
                                datePointage = LocalDate.parse(node.get("date_pointage").asText().substring(0, 10));
                            } catch (Exception ignored) {
                            }
                        }

                        Double heuresTravaillees = parseDoubleSafe(node, "totalHeure");
                        String hDebutShift = node.has("heureDebut") ? node.get("heureDebut").asText() : null;
                        String hFinShift = node.has("heureFin") ? node.get("heureFin").asText() : null;

                        PointageMateriel nouveau = PointageMateriel.builder()
                                .syncId(compositeKey)
                                .idMaterielErp(idMaterielErp)
                                .idChantierErp(idChantierErp)
                                .datePointage(datePointage)
                                .heuresTravaillees(heuresTravaillees)
                                .heureDebut(hDebutShift)
                                .heureFin(hFinShift)
                                .statutPointage("IMPORTÉ")
                                .engin(enginAssocie)
                                .build();
                        pointagesToSave.add(nouveau);
                        pointagesExistantsMap.put(compositeKey, nouveau);

                        if (enginAssocie != null) {
                            Long eid = enginAssocie.getIdEngin();
                            LocalDate exDate = enginLatestPointageDate.get(eid);
                            if (exDate == null || !datePointage.isBefore(exDate)) {
                                enginLatestPointageDate.put(eid, datePointage);
                                Chantier chan = (codeChantierErp != null) ? codeErpToChantier.get(codeChantierErp)
                                        : null;
                                if (chan == null && idChantierErp != null)
                                    chan = erpIdToChantier.get(idChantierErp);
                                if (chan != null)
                                    enginLatestChantier.put(eid, chan);
                            }
                        }
                    }
                }
            }

            if (!pointagesToSave.isEmpty()) {
                pointageMaterielRepository.saveAll(pointagesToSave);
                lastSyncNouveauxPointages += pointagesToSave.size();
            }

            Set<Long> enginsToProcess = new HashSet<>();
            enginsToProcess.addAll(enginLatestChantier.keySet());
            enginsToProcess.addAll(enginLatestCompteur.keySet());

            List<Engin> enginsToUpdate = new ArrayList<>();
            for (Long eid : enginsToProcess) {
                Engin e = localEngins.stream().filter(ex -> ex.getIdEngin().equals(eid)).findFirst().orElse(null);
                if (e != null) {
                    boolean changed = false;

                    Chantier latestChantier = enginLatestChantier.get(eid);
                    if (latestChantier != null && (e.getChantier() == null
                            || !e.getChantier().getIdChantier().equals(latestChantier.getIdChantier()))) {
                        e.setChantier(latestChantier);
                        changed = true;
                    }

                    Double cFin = enginLatestCompteur.get(eid);
                    if (cFin != null && (e.getCompteurActuel() == null || cFin > e.getCompteurActuel())) {
                        e.setCompteurActuel(cFin);
                        changed = true;
                    }

                    Double sumHeures = pointageMaterielRepository.sumHeuresTravailleesByEngin(eid);
                    if (sumHeures != null && (e.getHeuresProductionCumulees() == null
                            || !e.getHeuresProductionCumulees().equals(sumHeures))) {
                        e.setHeuresProductionCumulees(sumHeures);
                        changed = true;
                    }

                    if (changed) {
                        enginsToUpdate.add(e);
                        lastSyncEnginsMisAJour++;
                    }
                }
            }
            if (!enginsToUpdate.isEmpty())
                enginRepository.saveAll(enginsToUpdate);

        } catch (Exception ex) {
            System.err.println("  [CHUNK ERROR] " + dateD + " -> " + dateF + " : " + ex.getMessage());
            // On continue les autres chunks même si celui-là échoue
        }
    }

    /**
     * Recalcule et sauvegarde les affectations chantier de TOUS les engins
     * en se basant uniquement sur les pointages déjà présents en base locale.
     * Utile quand l'ERP est inaccessible : on repart des données locales.
     *
     * @return Résumé des engins mis à jour
     */
    public Map<String, Object> recalculerAffectationsDepuisLocal() {
        Map<String, Object> result = new HashMap<>();
        System.out.println("[LOCAL] Recalcul des affectations depuis les pointages locaux...");

        try {
            List<Chantier> localChantiers = chantierRepository.findAll();
            Map<String, Chantier> codeErpToChantierLocal = new HashMap<>();
            Map<Long, Chantier> erpIdToChantier = new HashMap<>();
            for (Chantier c : localChantiers) {
                if (c.getCodeErp() != null && !c.getCodeErp().isBlank()) {
                    String code = c.getCodeErp().trim().toUpperCase();
                    if (!codeErpToChantierLocal.containsKey(code) || "ACTIF".equals(c.getStatut())) {
                        codeErpToChantierLocal.put(code, c);
                    }
                }
                if (c.getIdChantierErp() != null) {
                    if (!erpIdToChantier.containsKey(c.getIdChantierErp()) || "ACTIF".equals(c.getStatut())) {
                        erpIdToChantier.put(c.getIdChantierErp(), c);
                    }
                }
            }

            List<Engin> localEngins = enginRepository.findAll();
            Map<Long, Engin> enginById = new HashMap<>();
            for (Engin e : localEngins) {
                if (e.getIdMaterielErp() != null) {
                    enginById.put(e.getIdMaterielErp(), e);
                }
            }

            // Charger tous les pointages locaux (triés par date desc pour avoir le plus
            // récent en premier)
            List<PointageMateriel> allPointages = pointageMaterielRepository.findAll();
            allPointages.sort((a, b) -> b.getDatePointage().compareTo(a.getDatePointage()));

            // Map enginId → pointage le plus récent
            Map<Long, PointageMateriel> latestByEnginId = new HashMap<>();
            for (PointageMateriel pm : allPointages) {
                if (pm.getEngin() != null) {
                    Long enginId = pm.getEngin().getIdEngin();
                    if (!latestByEnginId.containsKey(enginId)) {
                        latestByEnginId.put(enginId, pm);
                    }
                }
            }

            int enginsMisAJour = 0;
            int enginsSansPointage = 0;
            int enginsChantierIntrouvable = 0;
            List<Engin> enginsToSave = new ArrayList<>();

            for (Engin engin : localEngins) {
                boolean changed = false;

                // Mettre à jour le cumul des heures
                Double totalHeures = pointageMaterielRepository.sumHeuresTravailleesByEngin(engin.getIdEngin());
                if (totalHeures != null && (engin.getHeuresProductionCumulees() == null
                        || !engin.getHeuresProductionCumulees().equals(totalHeures))) {
                    engin.setHeuresProductionCumulees(totalHeures);
                    changed = true;
                }

                PointageMateriel latestPm = latestByEnginId.get(engin.getIdEngin());
                if (latestPm == null) {
                    if (changed) {
                        enginsToSave.add(engin);
                        enginsMisAJour++;
                    }
                    enginsSansPointage++;
                    continue;
                }

                // Mise à jour du chantier
                if (latestPm.getIdChantierErp() != null) {
                    Chantier chantier = erpIdToChantier.get(latestPm.getIdChantierErp());
                    if (chantier != null) {
                        if (engin.getChantier() == null
                                || !engin.getChantier().getIdChantier().equals(chantier.getIdChantier())) {
                            engin.setChantier(chantier);
                            changed = true;
                        }
                    } else {
                        // TODO: Logique pour gérer engins orphelins si nécessaire
                        enginsChantierIntrouvable++;
                    }
                }

                // Mise à jour du compteur
                if (latestPm.getCompteurFin() != null && latestPm.getCompteurFin() > 0) {
                    if (engin.getCompteurActuel() == null || latestPm.getCompteurFin() > engin.getCompteurActuel()) {
                        engin.setCompteurActuel(latestPm.getCompteurFin());
                        changed = true;
                    }
                }

                if (changed) {
                    enginsToSave.add(engin);
                    enginsMisAJour++;
                }
            }

            if (!enginsToSave.isEmpty()) {
                enginRepository.saveAll(enginsToSave);
            }

            System.out.println("[LOCAL] " + enginsMisAJour + " engin(s) mis à jour depuis les données locales.");

            result.put("status", "SUCCESS");
            result.put("enginsMisAJour", enginsMisAJour);
            result.put("enginsSansPointageLocal", enginsSansPointage);
            result.put("enginsChantierIntrouvable", enginsChantierIntrouvable);
            result.put("totalPointagesEnBase", allPointages.size());
            result.put("message",
                    enginsMisAJour + " engin(s) mis à jour depuis " + allPointages.size() + " pointages locaux.");

        } catch (Exception e) {
            System.err.println("[LOCAL] Erreur : " + e.getMessage());
            result.put("status", "ERROR");
            result.put("message", e.getMessage());
        }

        return result;
    }

    /**
     * Déduplique les engins en base : pour chaque idMaterielErp dupliqué,
     * garde le plus ancien et supprime les doublons.
     * À appeler manuellement via POST /api/admin/erp/dedup-engins
     */
    public String deduplicateEngins() {
        List<Engin> tous = enginRepository.findAll();
        Map<Long, Engin> gardés = new HashMap<>();
        List<Long> aSupprimer = new ArrayList<>();

        for (Engin e : tous) {
            if (e.getIdMaterielErp() == null)
                continue;
            if (!gardés.containsKey(e.getIdMaterielErp())) {
                gardés.put(e.getIdMaterielErp(), e);
            } else {
                Engin existing = gardés.get(e.getIdMaterielErp());
                if (e.getIdEngin() > existing.getIdEngin()) {
                    aSupprimer.add(e.getIdEngin());
                } else {
                    aSupprimer.add(existing.getIdEngin());
                    gardés.put(e.getIdMaterielErp(), e);
                }
            }
        }

        if (!aSupprimer.isEmpty()) {
            for (Long id : aSupprimer) {
                enginRepository.deleteById(id);
            }
        }

        return aSupprimer.size() + " doublon(s) supprimé(s). Engins conservés : " + gardés.size();
    }

    private Double parseDoubleSafe(JsonNode node, String fieldName) {
        if (node.has(fieldName) && !node.get(fieldName).isNull()) {
            String valStr = node.get(fieldName).asText();
            if (valStr == null || valStr.trim().isEmpty())
                return 0.0;
            try {
                return Double.parseDouble(valStr.replace(",", ".").replaceAll("[^0-9.-]", ""));
            } catch (Exception e) {
                return 0.0;
            }
        }
        return 0.0;
    }

    /**
     * Synchronise les codes matériels depuis le registre ERP (/getMateriel).
     * Appelle l'endpoint une seule fois, récupère tous les matériels (code +
     * immatricule),
     * puis met à jour code_materiel dans la base locale par correspondance sur
     * l'immatriculation (champ le plus fiable).
     *
     * @return résumé des engins mis à jour
     */
    public Map<String, Object> syncCodesDepuisErp() {
        Map<String, Object> result = new HashMap<>();
        System.out.println("[SYNC-CODES] Démarrage sync codes depuis ERP /getMateriel ...");

        try {
            // 1. Appel ERP
            JsonNode[] erpMateriels = restTemplate.getForObject(MATERIEL_URL, JsonNode[].class);
            if (erpMateriels == null || erpMateriels.length == 0) {
                result.put("status", "ERROR");
                result.put("message", "L'ERP n'a retourné aucun matériel.");
                return result;
            }
            System.out.println("[SYNC-CODES] ERP matériels reçus : " + erpMateriels.length);

            // 2. Construire index ERP : immat_normalisé -> (code, idmateriel, designation)
            Map<String, String> erpImmatToCode = new HashMap<>();
            Map<Long, String> erpIdToCode = new HashMap<>();
            Map<String, String> erpImmatToDesig = new HashMap<>();

            for (JsonNode node : erpMateriels) {
                String code = node.has("code") && !node.get("code").isNull()
                        ? node.get("code").asText().trim()
                        : null;
                String immat = node.has("immatricule") && !node.get("immatricule").isNull()
                        ? node.get("immatricule").asText().trim()
                        : null;
                String desig = node.has("designation") && !node.get("designation").isNull()
                        ? node.get("designation").asText().trim()
                        : null;
                Long idMat = node.has("idmateriel") && !node.get("idmateriel").isNull()
                        ? node.get("idmateriel").asLong()
                        : null;

                if (code == null || code.isEmpty())
                    continue;

                if (immat != null && !immat.isEmpty()) {
                    String keyImmat = immat.trim().toUpperCase();
                    if (!erpImmatToCode.containsKey(keyImmat)) {
                        erpImmatToCode.put(keyImmat, code.toUpperCase());
                        if (desig != null)
                            erpImmatToDesig.put(keyImmat, desig);
                    }
                }
                if (idMat != null) {
                    erpIdToCode.putIfAbsent(idMat, code.toUpperCase());
                }
            }
            System.out.println("[SYNC-CODES] Index immat: " + erpImmatToCode.size()
                    + " | Index idMateriel: " + erpIdToCode.size());

            // 3. Parcourir tous les engins locaux et mettre à jour
            List<Engin> localEngins = enginRepository.findAll();
            List<Engin> toUpdate = new ArrayList<>();
            int matchImmat = 0, matchId = 0, noMatch = 0;

            for (Engin e : localEngins) {
                String newCode = null;

                // Priorité 1 : immatriculation
                if (e.getImmatriculation() != null && !e.getImmatriculation().trim().isEmpty()) {
                    String key = e.getImmatriculation().trim().toUpperCase();
                    if (erpImmatToCode.containsKey(key)) {
                        newCode = erpImmatToCode.get(key);
                        matchImmat++;
                    }
                }
                // Priorité 2 : idMaterielErp
                if (newCode == null && e.getIdMaterielErp() != null) {
                    if (erpIdToCode.containsKey(e.getIdMaterielErp())) {
                        newCode = erpIdToCode.get(e.getIdMaterielErp());
                        matchId++;
                    }
                }

                if (newCode == null) {
                    noMatch++;
                    continue;
                }

                // Mise à jour si le code a changé
                String curCode = (e.getCodeMateriel() != null) ? e.getCodeMateriel().trim().toUpperCase() : "";
                if (!curCode.equals(newCode)) {
                    System.out.println("[SYNC-CODES]  " + curCode + " -> " + newCode
                            + " (immat=" + e.getImmatriculation() + ")");
                    e.setCodeMateriel(newCode);
                    toUpdate.add(e);
                }
            }

            if (!toUpdate.isEmpty()) {
                enginRepository.saveAll(toUpdate);
            }

            result.put("status", "SUCCESS");
            result.put("erpTotal", erpMateriels.length);
            result.put("matchImmat", matchImmat);
            result.put("matchIdMateriel", matchId);
            result.put("noMatch", noMatch);
            result.put("updated", toUpdate.size());
            result.put("message", toUpdate.size() + " code(s) matériel mis à jour depuis l'ERP.");
            System.out.println("[SYNC-CODES] Terminé. Mis à jour: " + toUpdate.size());

        } catch (Exception e) {
            System.err.println("[SYNC-CODES] Erreur: " + e.getMessage());
            result.put("status", "ERROR");
            result.put("message", "Erreur ERP: " + e.getMessage());
        }

        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SYNCHRONISATION DES HEURES DE PRODUCTION (getMaterielStatus)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Seuil (en heures) en dessous duquel on facture une demi-journée.
     * Configurable : la journée normale est 10-11h, on considère que < 5h =
     * demi-journée.
     */
    private static final double SEUIL_DEMI_JOURNEE_HEURES = 5.0;

    /**
     * Heures maximum acceptables par jour (plafond anti-anomalie).
     * Au-delà de 11h, on plafonne pour éviter les données aberrantes.
     */
    private static final double MAX_HEURES_JOURNALIER = 11.0;

    /**
     * Synchronise les heures de production et les coûts journaliers depuis
     * le webservice getMaterielStatus pour tous les chantiers ACTIFS.
     *
     * Règle de facturation :
     * - heures effectives >= 5h → tarif plein (prixMoyenPondere de l'engin)
     * - 0 < heures effectives < 5h → demi-tarif (prixMoyenPondere / 2)
     * - 0h ou machine arrêtée → 0 DH (pas de facturation)
     *
     * Gestion multi-tranches : si un matériel est pointé plusieurs fois le même
     * jour (ex: 2 shifts), les heures sont sommées puis plafonnées à
     * MAX_HEURES_JOURNALIER.
     *
     * @param dateD date de début (inclusive)
     * @param dateF date de fin (inclusive)
     * @return rapport de synchronisation
     */
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> syncHeuresDepuisStatus(LocalDate dateD, LocalDate dateF) {
        Map<String, Object> rapport = new HashMap<>();
        int totalRecordsErp = 0;
        int pointagesCrees = 0;
        int pointagesMisAJour = 0;
        int enginsNonTrouves = 0;
        int erreurs = 0;
        List<String> lignesNonMatchees = new ArrayList<>();

        // DATE PLANCHER : ne prendre que les données à partir du 1er janvier 2026
        final LocalDate DATE_PLANCHER = LocalDate.of(2026, 1, 1);
        if (dateD.isBefore(DATE_PLANCHER))
            dateD = DATE_PLANCHER;
        if (dateF.isBefore(DATE_PLANCHER)) {
            rapport.put("status", "SKIPPED");
            rapport.put("message", "Toutes les dates sont antérieures à 2026. Rien à synchroniser.");
            return rapport;
        }

        try {
            // ── 1. Construire l'index local DOUBLE : code exact + code court ──────────
            // Problème ERP : getMaterielStatus retourne code_materiel = "E666" (court)
            // mais en base le codeMateriel est "RABOTEUSE W1500 E666 (COMP 5581H)" (long).
            // On indexe donc aussi par code court extrait des désignations.
            List<Engin> tousLesEngins = enginRepository.findAll();
            Map<String, Engin> codeToEngin = new HashMap<>();
            for (Engin engin : tousLesEngins) {
                // Index 1 : code exact (ex: "RABOTEUSE W1500 E666 (COMP 5581H)")
                if (engin.getCodeMateriel() != null && !engin.getCodeMateriel().isBlank()) {
                    codeToEngin.put(engin.getCodeMateriel().trim().toUpperCase(), engin);
                }
                // Index 2 : codeInterne pour compatibilité ascendante
                if (engin.getCodeInterne() != null && !engin.getCodeInterne().isBlank()) {
                    codeToEngin.putIfAbsent(engin.getCodeInterne().trim().toUpperCase(), engin);
                }
                // Index 3 : code court ERP extrait de la désignation
                // Extrait "E666" depuis "RABOTEUSE W1500 E666 (COMP 5581H)" ou depuis le
                // matricule
                String shortCode = extraireCodeCourtErp(engin.getCodeMateriel());
                if (shortCode != null) {
                    codeToEngin.putIfAbsent(shortCode.toUpperCase(), engin);
                }
                shortCode = extraireCodeCourtErp(engin.getMatricule());
                if (shortCode != null) {
                    codeToEngin.putIfAbsent(shortCode.toUpperCase(), engin);
                }
            }

            // ── 2. Préparer le syncId index pour éviter la déduplication N×requête ─
            Set<String> existingStatusSyncIds = new HashSet<>(
                    pointageMaterielRepository.findAllExistingPointageErpIds());

            // ── 3. Appel ERP par fenêtres de 10 jours pour éviter les timeouts ───
            // Le webservice peut retourner des milliers de lignes pour une grande période
            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd");
            LocalDate cursor = dateD;

            // Structure : clé = "CODE_MATERIEL|DATE|CODE_CHANTIER" → agrégation des
            // tranches
            // On agrège avant de persister car un même engin peut avoir plusieurs
            // tranches/jour
            Map<String, StatusAggregat> aggregats = new HashMap<>();

            while (!cursor.isAfter(dateF)) {
                LocalDate chunkEnd = cursor.plusDays(9).isAfter(dateF) ? dateF : cursor.plusDays(9);
                String url = STATUS_BASE_URL + "/" + cursor.format(fmt) + "/" + chunkEnd.format(fmt);

                try {
                    JsonNode[] statusRecords = restTemplate.getForObject(url, JsonNode[].class);
                    if (statusRecords == null || statusRecords.length == 0) {
                        cursor = chunkEnd.plusDays(1);
                        continue;
                    }

                    totalRecordsErp += statusRecords.length;

                    for (JsonNode rec : statusRecords) {
                        try {
                            String codeMateriel = getJsonStr(rec, "code_materiel");
                            String dateStr = getJsonStr(rec, "date_pointage");
                            String codeChantier = getJsonStr(rec, "code_chantier");
                            String heureDebutStr = getJsonStr(rec, "heureDebut");
                            String heureFinStr = getJsonStr(rec, "heureFin");
                            String totalHeureStr = getJsonStr(rec, "totalHeure");
                            String designation = getJsonStr(rec, "designation_materiel");
                            int statusCode = rec.has("status") ? rec.get("status").asInt(0) : 0;

                            if (codeMateriel.isEmpty() || dateStr.isEmpty())
                                continue;

                            // Calculer les heures de cette tranche
                            double heuresTranche = parseHeuresTranche(totalHeureStr, heureDebutStr, heureFinStr);
                            if (heuresTranche < 0)
                                heuresTranche = 0;

                            // Clé d'agrégation journalière par machine + jour + chantier
                            String cleAggregat = codeMateriel.toUpperCase() + "|" + dateStr + "|" + codeChantier;
                            StatusAggregat agg = aggregats.computeIfAbsent(cleAggregat, k -> {
                                StatusAggregat a = new StatusAggregat();
                                a.codeMateriel = codeMateriel;
                                a.dateStr = dateStr;
                                a.codeChantier = codeChantier;
                                a.designation = designation;
                                a.idChantierErp = rec.has("id_chantier") ? rec.get("id_chantier").asLong(0) : 0L;
                                return a;
                            });
                            agg.totalHeures += heuresTranche;
                            // Le statut le plus élevé (travail > panne > arrêt) prime
                            if (statusCode > agg.statusCode)
                                agg.statusCode = statusCode;

                        } catch (Exception recErr) {
                            erreurs++;
                            System.err.println("[SYNC-STATUS] Erreur ligne: " + recErr.getMessage());
                        }
                    }

                } catch (Exception chunkErr) {
                    System.err.println(
                            "[SYNC-STATUS] Erreur chunk " + cursor + " → " + chunkEnd + ": " + chunkErr.getMessage());
                    erreurs++;
                }

                cursor = chunkEnd.plusDays(1);
            }

            // ── 4. Persister les agrégats ──────────────────────────────────────────
            for (StatusAggregat agg : aggregats.values()) {
                try {
                    // Plafonnement anti-anomalie
                    double heuresEffectives = Math.min(agg.totalHeures, MAX_HEURES_JOURNALIER);

                    // Retrouver l'engin local — lookup hiérarchique :
                    // 1) Code exact 2) Code court (ex: E666) 3) Recherche floue en DB
                    Engin engin = codeToEngin.get(agg.codeMateriel.trim().toUpperCase());
                    if (engin == null) {
                        // Fallback : chercher si le code apparaît dans le codeMateriel (ex: E666 dans
                        // RABOTEUSE...)
                        List<Engin> matches = enginRepository.findByCodeMaterielContainingIgnoreCase(
                                agg.codeMateriel.trim());
                        if (!matches.isEmpty()) {
                            engin = matches.get(0);
                            // Mettre en cache pour les prochains agrégats du même code
                            codeToEngin.put(agg.codeMateriel.trim().toUpperCase(), engin);
                        }
                    }

                    // syncId unique pour déduplication : code + date + chantier (source: STATUS)
                    String syncId = "STATUS|" + agg.codeMateriel.trim().toUpperCase()
                            + "|" + agg.dateStr + "|" + agg.codeChantier;

                    LocalDate datePtg;
                    try {
                        datePtg = LocalDate.parse(agg.dateStr);
                    } catch (Exception e) {
                        erreurs++;
                        continue;
                    }

                    // ── Règle de facturation journalière ─────────────────────────
                    Double coutJournalier = null;
                    if (engin != null && engin.getPrixMoyenPondere() != null && engin.getPrixMoyenPondere() > 0) {
                        double tarif = engin.getPrixMoyenPondere();
                        if (heuresEffectives >= SEUIL_DEMI_JOURNEE_HEURES) {
                            coutJournalier = tarif; // Tarif plein
                        } else if (heuresEffectives > 0) {
                            coutJournalier = tarif / 2.0; // Demi-tarif
                        } else {
                            coutJournalier = 0.0; // Pas de facturation
                        }
                    }

                    // ── Créer ou mettre à jour le pointage ───────────────────────
                    if (existingStatusSyncIds.contains(syncId)) {
                        // Mise à jour : recalculer heures et coût si changement
                        java.util.Optional<PointageMateriel> existOpt = pointageMaterielRepository.findBySyncId(syncId);
                        if (existOpt.isPresent()) {
                            PointageMateriel existing = existOpt.get();
                            boolean changed = false;
                            if (!Double.valueOf(heuresEffectives).equals(existing.getHeuresEffectives())) {
                                existing.setHeuresEffectives(heuresEffectives);
                                existing.setHeuresTravaillees(heuresEffectives);
                                changed = true;
                            }
                            if (coutJournalier != null && !coutJournalier.equals(existing.getCoutJournalier())) {
                                existing.setCoutJournalier(coutJournalier);
                                changed = true;
                            }
                            if (changed) {
                                pointageMaterielRepository.save(existing);
                                pointagesMisAJour++;
                            }
                        }
                    } else {
                        // Nouveau pointage
                        PointageMateriel ptg = PointageMateriel.builder()
                                .syncId(syncId)
                                .datePointage(datePtg)
                                .engin(engin)
                                .codeMateriel(agg.codeMateriel)
                                .designationMateriel(agg.designation)
                                .codeChantierErp(agg.codeChantier)
                                .idChantierErp(agg.idChantierErp > 0 ? agg.idChantierErp : null)
                                .heuresTravaillees(heuresEffectives)
                                .heuresEffectives(heuresEffectives)
                                .coutJournalier(coutJournalier)
                                .statutPointage(mapStatusCode(agg.statusCode))
                                .build();

                        pointageMaterielRepository.save(ptg);
                        existingStatusSyncIds.add(syncId);
                        pointagesCrees++;

                        // ❌ PAS d'incrémentation additive ici — cela causerait du double-comptage
                        // à chaque re-synchronisation. Le recalcul est fait EN MASSE à la fin.
                        if (engin == null) {
                            enginsNonTrouves++;
                            if (lignesNonMatchees.size() < 50) {
                                lignesNonMatchees.add(agg.codeMateriel + " [" + agg.designation + "]");
                            }
                        }
                    }

                } catch (Exception persErr) {
                    erreurs++;
                    System.err.println("[SYNC-STATUS] Erreur persistance: " + persErr.getMessage());
                }
            }

            // ── 5. Recalcul en masse de heuresProductionCumulees ──────────────────
            // On recalcule depuis la SOURCE DE VÉRITÉ (pointages_materiel) au lieu
            // d'incrémenter un compteur qui dérive à chaque re-sync.
            // COALESCE(heures_effectives, heures_travaillees) couvre :
            // - les anciens pointages getPontageMateriel (heures_travaillees renseigné)
            // - les nouveaux pointages getMaterielStatus (heures_effectives renseigné)
            try {
                enginRepository.recalculerToutesHeures(DATE_PLANCHER);
                System.out.println(
                        "[SYNC-STATUS] Recalcul heuresProductionCumulees terminé (depuis " + DATE_PLANCHER + ").");
            } catch (Exception recalcErr) {
                System.err.println("[SYNC-STATUS] Avertissement recalcul heures: " + recalcErr.getMessage());
            }

            rapport.put("status", "SUCCESS");
            rapport.put("totalRecordsErp", totalRecordsErp);
            rapport.put("aggregatsCrees", aggregats.size());
            rapport.put("pointagesCrees", pointagesCrees);
            rapport.put("pointagesMisAJour", pointagesMisAJour);
            rapport.put("enginsNonTrouves", enginsNonTrouves);
            rapport.put("erreurs", erreurs);
            rapport.put("enginsInconnus", lignesNonMatchees);
            rapport.put("message", String.format(
                    "Synchro terminée : %d créés, %d mis à jour, %d engins inconnus, %d erreurs. " +
                            "heuresProductionCumulees recalculées depuis 2026-01-01.",
                    pointagesCrees, pointagesMisAJour, enginsNonTrouves, erreurs));
            System.out.println("[SYNC-STATUS] " + rapport.get("message"));

        } catch (Exception e) {
            rapport.put("status", "ERROR");
            rapport.put("message", "Erreur globale: " + e.getMessage());
            System.err.println("[SYNC-STATUS] Erreur globale: " + e.getMessage());
        }

        return rapport;
    }

    /**
     * Structure d'agrégation des tranches horaires d'une même machine sur une
     * journée.
     */
    private static class StatusAggregat {
        String codeMateriel;
        String dateStr;
        String codeChantier;
        String designation;
        long idChantierErp;
        double totalHeures = 0.0;
        int statusCode = 0;
    }

    /**
     * Calcule les heures d'une tranche depuis totalHeure (si disponible et valide)
     * ou depuis heureDebut/heureFin au format HH:MM.
     * Retourne -1 si les données sont insuffisantes.
     */
    private double parseHeuresTranche(String totalHeureStr, String heureDebutStr, String heureFinStr) {
        // Priorité 1 : totalHeure fourni et valide
        if (totalHeureStr != null && !totalHeureStr.isBlank()) {
            try {
                double val = Double.parseDouble(totalHeureStr.trim().replace(",", "."));
                if (val >= 0 && val <= 24)
                    return val;
            } catch (NumberFormatException ignored) {
                /* fallback */ }
        }

        // Priorité 2 : calculer depuis heureDebut/heureFin
        if (heureDebutStr != null && !heureDebutStr.isBlank()
                && heureFinStr != null && !heureFinStr.isBlank()) {
            try {
                int[] debut = parseHHMM(heureDebutStr);
                int[] fin = parseHHMM(heureFinStr);
                if (debut != null && fin != null) {
                    int minutesDebut = debut[0] * 60 + debut[1];
                    int minutesFin = fin[0] * 60 + fin[1];
                    // Tolérer le passage minuit (ex: 22:00 → 06:00)
                    if (minutesFin < minutesDebut)
                        minutesFin += 24 * 60;
                    double heures = (minutesFin - minutesDebut) / 60.0;
                    if (heures >= 0 && heures <= 24)
                        return heures;
                }
            } catch (Exception ignored) {
                /* retourne -1 */ }
        }

        return 0.0; // Donnée insuffisante → 0h (pas de facturation)
    }

    /**
     * Parse une heure au format HH:MM, HH:MM:SS ou HHMM.
     * 
     * @return int[] {heures, minutes} ou null si invalide.
     */
    private int[] parseHHMM(String heure) {
        if (heure == null || heure.isBlank())
            return null;
        heure = heure.trim();
        // Format HH:MM ou HH:MM:SS
        if (heure.contains(":")) {
            String[] parts = heure.split(":");
            if (parts.length >= 2) {
                try {
                    int h = Integer.parseInt(parts[0].trim());
                    int m = Integer.parseInt(parts[1].trim());
                    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
                        return new int[] { h, m };
                } catch (NumberFormatException ignored) {
                }
            }
        }
        // Format HHMM (4 chiffres)
        if (heure.matches("\\d{3,4}")) {
            try {
                int val = Integer.parseInt(heure);
                int h = val / 100;
                int m = val % 100;
                if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
                    return new int[] { h, m };
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    /**
     * Mappe le code status ERP vers un libellé métier.
     * 1=Arrêt/Déplacement, 2=En travail, 3=En panne, 4=Heures supplémentaires
     */
    private String mapStatusCode(int code) {
        return switch (code) {
            case 1 -> "ARRET";
            case 2 -> "EN_TRAVAIL";
            case 3 -> "EN_PANNE";
            case 4 -> "HEURES_SUP";
            default -> "INCONNU";
        };
    }

    /** Utilitaire : extraire une valeur String d'un JsonNode (null-safe). */
    private String getJsonStr(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull())
            return "";
        return node.get(field).asText("").trim();
    }

    /**
     * Importe un engin spécifique depuis l'ERP (s'il n'existe pas déjà).
     */
    public Map<String, Object> importerEnginParCode(String codeErp) {
        Map<String, Object> result = new HashMap<>();
        if (codeErp == null || codeErp.isBlank()) {
            result.put("status", "ERROR");
            result.put("message", "Le code ERP est obligatoire.");
            return result;
        }

        try {
            JsonNode[] erpMateriels = restTemplate.getForObject(MATERIEL_URL, JsonNode[].class);
            if (erpMateriels == null || erpMateriels.length == 0) {
                result.put("status", "ERROR");
                result.put("message", "L'ERP n'a retourné aucun matériel.");
                return result;
            }

            JsonNode targetNode = null;
            for (JsonNode node : erpMateriels) {
                if (node.has("code") && !node.get("code").isNull()) {
                    if (node.get("code").asText().trim().equalsIgnoreCase(codeErp.trim())) {
                        targetNode = node;
                        break;
                    }
                }
            }

            if (targetNode == null) {
                result.put("status", "ERROR");
                result.put("message", "Aucun matériel trouvé dans l'ERP avec le code: " + codeErp);
                return result;
            }

            String code = targetNode.get("code").asText().trim().toUpperCase();
            String immat = targetNode.has("immatricule") && !targetNode.get("immatricule").isNull()
                    ? targetNode.get("immatricule").asText().trim()
                    : "";
            String desig = targetNode.has("designation") && !targetNode.get("designation").isNull()
                    ? targetNode.get("designation").asText().trim()
                    : "Engin " + code;
            Long idMat = targetNode.has("idmateriel") && !targetNode.get("idmateriel").isNull()
                    ? targetNode.get("idmateriel").asLong()
                    : null;

            // Vérifier si l'engin existe déjà
            List<Engin> localEngins = enginRepository.findAll();
            for (Engin e : localEngins) {
                if (e.getCodeMateriel() != null && e.getCodeMateriel().trim().equalsIgnoreCase(code)) {
                    result.put("status", "EXISTS");
                    result.put("message", "L'engin existe déjà avec le code : " + code);
                    return result;
                }
            }

            // ─── Inférence intelligente depuis la désignation ERP ───────────────────
            String desigUp = desig.toUpperCase();

            // 1. Catégorie & Type (le plus précis possible)
            String categorie;
            String type;
            String uniteCompteur;

            if (desigUp.contains("CAMION") || desigUp.contains("BENNE") || desigUp.contains("CITERNE")
                    || desigUp.contains("MALAXEUR") || desigUp.contains("TRACTO") && desigUp.contains("ROUTIER")
                    || desigUp.contains("KERAX") || desigUp.contains("MIDLUM") || desigUp.contains("PREMIUM")
                    || desigUp.contains("SITRAK") || desigUp.contains("DAF") && desigUp.contains("C8")
                    || desigUp.contains("IVECO") || desigUp.contains("MAN N°")
                    || desigUp.contains("FORLANDE")) {
                categorie = "Camion";
                uniteCompteur = "km";
                if (desigUp.contains("CITERNE"))
                    type = "Camion citerne";
                else if (desigUp.contains("MALAXEUR"))
                    type = "Camion malaxeur";
                else if (desigUp.contains("BENNE"))
                    type = "Camion benne";
                else
                    type = "Camion";
            } else if (desigUp.contains("VOITURE") || desigUp.contains("4X4") || desigUp.contains("DUSTER")
                    || desigUp.contains("DOKKER") || desigUp.contains("DACIA") || desigUp.contains("KANGOO")
                    || desigUp.contains("BMW") || desigUp.contains("TOUAREG") || desigUp.contains("TUCSON")
                    || desigUp.contains("RAV") || desigUp.contains("PIK UP") || desigUp.contains("PICK UP")
                    || desigUp.contains("MAHINDRA") || desigUp.contains("LOGAN") || desigUp.contains("LUGAN")
                    || desigUp.contains("MEGANE") || desigUp.contains("TRANSIT") || desigUp.contains("MASTER")
                    || (code.startsWith("V") && !desigUp.contains("NIVELEUSE"))) {
                categorie = "Voiture";
                uniteCompteur = "km";
                if (desigUp.contains("PIK UP") || desigUp.contains("PICK UP"))
                    type = "Véhicule utilitaire";
                else if (desigUp.contains("4X4"))
                    type = "Voiture 4X4";
                else
                    type = "Voiture";
            } else if (desigUp.contains("REMORQUE") || desigUp.contains("SEMI-REMORQUE")) {
                categorie = "Remorque";
                type = "Remorque";
                uniteCompteur = "km";
            } else {
                // Engins de chantier (par défaut)
                categorie = "Engin";
                uniteCompteur = "h";
                if (desigUp.contains("BULLDOZER") || desigUp.contains("D8") || desigUp.contains("D9")
                        || desigUp.contains("D6"))
                    type = "Bulldozer";
                else if (desigUp.contains("TRACTOPELLE") || desigUp.contains("RETROCARGADOR"))
                    type = "Tractopelle";
                else if (desigUp.contains("PELLE") || desigUp.contains("EXCAVATEUR"))
                    type = "Pelle mécanique";
                else if (desigUp.contains("NIVELEUSE") || desigUp.contains("GRADER"))
                    type = "Niveleuse";
                else if (desigUp.contains("CHARGEUSE") || desigUp.contains("LOADER"))
                    type = "Chargeuse";
                else if (desigUp.contains("COMPACTEUR") || desigUp.contains("ROULEAU"))
                    type = "Compacteur";
                else if (desigUp.contains("GRUE"))
                    type = "Grue";
                else if (desigUp.contains("FINISSEUR") || desigUp.contains("PAVEUSE"))
                    type = "Finisseur";
                else if (desigUp.contains("DUMPER"))
                    type = "Dumper";
                else if (desigUp.contains("TRACTEUR AGRICOLE"))
                    type = "Tracteur agricole";
                else if (desigUp.contains("RÉPANDEUSE") || desigUp.contains("REPANDEUSE"))
                    type = "Répandeuse";
                else if (desigUp.contains("BALAYEUSE"))
                    type = "Balayeuse";
                else if (desigUp.contains("BRISE ROCHE"))
                    type = "Brise roche";
                else if (desigUp.contains("GROUPE ELECTROGENE"))
                    type = "Groupe électrogène";
                else
                    type = "Engin de chantier";
            }

            // 2. Marque (extraire depuis la désignation)
            String marque = inferMarque(desig);

            // 3. Modèle (extraire depuis la désignation)
            String modele = inferModele(desig);

            // 4. Matricule unique basé sur la désignation
            String matricule = desig;
            boolean matriculeExists = localEngins.stream()
                    .anyMatch(e -> e.getMatricule() != null && e.getMatricule().equalsIgnoreCase(desig));
            if (matriculeExists) {
                matricule = desig + " (" + code + ")";
            }

            Engin newEngin = Engin.builder()
                    .matricule(matricule)
                    .codeMateriel(code)
                    .immatriculation(!immat.isEmpty() ? immat : null)
                    .idMaterielErp(idMat)
                    .statut("ACTIF")
                    .categorie(categorie)
                    .type(type)
                    .marque(marque)
                    .modele(modele)
                    .uniteCompteur(uniteCompteur)
                    .compteurActuel(0.0)
                    .build();

            enginRepository.save(newEngin);

            result.put("status", "SUCCESS");
            result.put("engin", newEngin);
            result.put("message", "Engin " + code + " importé avec succès.");

        } catch (Exception e) {
            result.put("status", "ERROR");
            result.put("message", "Erreur lors de l'import : " + e.getMessage());
        }
        return result;
    }

    /**
     * Tente d'inférer la marque d'un matériel depuis sa désignation ERP.
     */
    private String inferMarque(String designation) {
        if (designation == null)
            return null;
        String d = designation.toUpperCase();
        // Marques engins de chantier
        if (d.contains("CATERPILLAR") || d.contains("CATERPILAR") || d.contains("CAT "))
            return "Caterpillar";
        if (d.contains("KOMATSU"))
            return "Komatsu";
        if (d.contains("DOOSAN") || d.contains("DX3") || d.contains("DL"))
            return "Doosan";
        if (d.contains("XCMG"))
            return "XCMG";
        if (d.contains("SANY"))
            return "SANY";
        if (d.contains("VOLVO"))
            return "Volvo";
        if (d.contains("LIEBHERR"))
            return "Liebherr";
        if (d.contains("HYUNDAI") || d.contains("HYNDAI"))
            return "Hyundai";
        if (d.contains("HITACHI"))
            return "Hitachi";
        if (d.contains("BOMAG"))
            return "Bomag";
        if (d.contains("DYNAPAC"))
            return "Dynapac";
        if (d.contains("AMMANN"))
            return "Ammann";
        if (d.contains("LEBRERO"))
            return "Lebrero";
        if (d.contains("GROVE"))
            return "Grove";
        if (d.contains("JCB"))
            return "JCB";
        if (d.contains("MST"))
            return "MST";
        if (d.contains("HAMM"))
            return "Hamm";
        if (d.contains("WIRTGEN"))
            return "Wirtgen";
        if (d.contains("VÖGELE") || d.contains("VOGELE"))
            return "Vögele";
        if (d.contains("DEUTZ"))
            return "Deutz";
        if (d.contains("LANDINI"))
            return "Landini";
        if (d.contains("SANDVIK"))
            return "Sandvik";
        // Marques camions
        if (d.contains("RENAULT"))
            return "Renault";
        if (d.contains("MAN ") || d.contains("MAN N°"))
            return "MAN";
        if (d.contains("DAF"))
            return "DAF";
        if (d.contains("IVECO"))
            return "Iveco";
        if (d.contains("MERCEDES"))
            return "Mercedes-Benz";
        if (d.contains("SCANIA"))
            return "Scania";
        if (d.contains("VOLVO") && d.contains("CAMION"))
            return "Volvo";
        if (d.contains("SITRAK"))
            return "Sinotruk";
        if (d.contains("ISUZU"))
            return "Isuzu";
        // Marques voitures
        if (d.contains("DACIA"))
            return "Dacia";
        if (d.contains("VOLKSWAGEN") || d.contains("VOLSWAGEN") || d.contains("TOUAREG"))
            return "Volkswagen";
        if (d.contains("TOYOTA") || d.contains("RAV"))
            return "Toyota";
        if (d.contains("MITSUBISHI"))
            return "Mitsubishi";
        if (d.contains("BMW"))
            return "BMW";
        if (d.contains("HYUNDAI") || d.contains("TUCSON"))
            return "Hyundai";
        if (d.contains("MAHINDRA"))
            return "Mahindra";
        if (d.contains("FORD") || d.contains("TRANSIT"))
            return "Ford";
        if (d.contains("RENAULT") && (d.contains("KANGOO") || d.contains("MASTER") || d.contains("TRAFIC")))
            return "Renault";
        return null;
    }

    /**
     * Tente d'inférer le modèle d'un matériel depuis sa désignation ERP.
     * Extrait le modèle entre parenthèses si présent, sinon via mots-clés connus.
     */
    private String inferModele(String designation) {
        if (designation == null)
            return null;
        String d = designation.toUpperCase();
        // Extraire le contenu entre parenthèses s'il ressemble à un modèle (ex: SY335C,
        // BHL75, BL70C)
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\\(([A-Z0-9][-A-Z0-9/. ]{1,20})\\)")
                .matcher(designation.toUpperCase());
        if (m.find()) {
            String candidate = m.group(1).trim();
            // Exclure les immatriculations marocaines (ex: 87915-A-7) et les noms de
            // chantiers
            if (!candidate.matches("\\d{4,6}-[A-Z]-\\d") && candidate.length() <= 15) {
                return candidate;
            }
        }
        // Modèles connus par désignation
        if (d.contains("D8R"))
            return "D8R";
        if (d.contains("D8T"))
            return "D8T";
        if (d.contains("D6R"))
            return "D6R";
        if (d.contains("D9R"))
            return "D9R";
        if (d.contains("12G"))
            return "12G";
        if (d.contains("12H"))
            return "12H";
        if (d.contains("12K"))
            return "12K";
        if (d.contains("120H"))
            return "120H";
        if (d.contains("3CX"))
            return "3CX";
        if (d.contains("M542"))
            return "M542";
        if (d.contains("XS122"))
            return "XS122";
        if (d.contains("BHL75"))
            return "BHL75";
        if (d.contains("KERAX"))
            return "Kerax";
        if (d.contains("MIDLUM"))
            return "Midlum";
        if (d.contains("PREMIUM 440"))
            return "Premium 440";
        if (d.contains("K 440") || d.contains("K440"))
            return "K440";
        if (d.contains("DUSTER"))
            return "Duster";
        if (d.contains("DOKKER"))
            return "Dokker";
        if (d.contains("LOGAN"))
            return "Logan";
        if (d.contains("DACIA LUGAN") || d.contains("LUGAN"))
            return "Logan";
        if (d.contains("KANGOO"))
            return "Kangoo";
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITAIRE : CODE COURT ERP
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Extrait le "code court" ERP depuis une désignation ou un matricule.
     * Exemples :
     * "RABOTEUSE W1500 E666 (COMP 5581H)" → "E666"
     * "Compacteur Ammann 10T N°1 E592" → "E592"
     * "Camion DAF N°1 C811" → "C811"
     * "TRACTEUR Premium 440 N°1" → null (pas de code)
     *
     * Règle : un code court ERP est de la forme [A-Z]{1,2}[0-9]{2,4}
     * (lettre(s) suivie de 2 à 4 chiffres), présent dans la chaîne.
     */
    private String extraireCodeCourtErp(String texte) {
        if (texte == null || texte.isBlank())
            return null;
        // Chercher le code ERP court dans la chaîne (ex: E666, C814, V730)
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\\b([A-Z]{1,2}\\d{2,4})\\b")
                .matcher(texte.toUpperCase());
        // Récupérer le DERNIER match (le code est souvent à la fin)
        String last = null;
        while (m.find()) {
            String candidate = m.group(1);
            // Exclure les modèles techniques (12G, 12H, D8R...) qui commencent par un
            // chiffre
            // ou sont des modèles connus sans contexte de parc
            if (!candidate.matches("\\d+.*")) {
                last = candidate;
            }
        }
        return last;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SYNCHRONISATION DES CHANTIERS DEPUIS getMaterielStatus
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Découvre et crée les chantiers manquants depuis les données de
     * getMaterielStatus.
     * L'ERP ne dispose pas d'un endpoint dédié aux chantiers ; on les extrait
     * des champs code_chantier / id_chantier de chaque pointage de statut.
     *
     * Les chantiers existants (par code_erp) ne sont pas modifiés.
     * Les nouveaux sont créés avec statut ACTIF et un nom provisoire
     * (pouvant être enrichi manuellement plus tard).
     *
     * @param dateD date de début de la fenêtre ERP à interroger
     * @param dateF date de fin
     * @return rapport {status, crees, existants, total_codes_uniques}
     */
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> syncChantiersDepuisStatus(LocalDate dateD, LocalDate dateF) {
        Map<String, Object> rapport = new HashMap<>();
        int crees = 0;
        int existants = 0;
        List<String> nouveauxCodes = new ArrayList<>();

        try {
            // Borner à 2026
            final LocalDate PLANCHER = LocalDate.of(2026, 1, 1);
            if (dateD.isBefore(PLANCHER))
                dateD = PLANCHER;
            if (dateF.isBefore(PLANCHER))
                dateF = PLANCHER;

            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd");

            // Map code_chantier → id_chantier_erp (on conserve le dernier vu)
            Map<String, Long> chantiersErp = new HashMap<>();

            LocalDate cursor = dateD;
            while (!cursor.isAfter(dateF)) {
                LocalDate end = cursor.plusDays(9).isAfter(dateF) ? dateF : cursor.plusDays(9);
                String url = STATUS_BASE_URL + "/" + cursor.format(fmt) + "/" + end.format(fmt);

                try {
                    JsonNode[] records = restTemplate.getForObject(url, JsonNode[].class);
                    if (records != null) {
                        for (JsonNode rec : records) {
                            String code = getJsonStr(rec, "code_chantier");
                            if (!code.isBlank()) {
                                long idErp = rec.has("id_chantier")
                                        ? rec.get("id_chantier").asLong(0)
                                        : 0L;
                                chantiersErp.putIfAbsent(code, idErp);
                            }
                        }
                    }
                } catch (Exception chunkErr) {
                    System.err.println("[SYNC-CHANTIERS] Chunk " + cursor + ": " + chunkErr.getMessage());
                }

                cursor = end.plusDays(1);
            }

            // Créer les chantiers manquants
            for (Map.Entry<String, Long> entry : chantiersErp.entrySet()) {
                String code = entry.getKey();
                Long idErp = entry.getValue();

                if (chantierRepository.existsByCodeErp(code)) {
                    existants++;
                } else {
                    Chantier nouveau = Chantier.builder()
                            .codeErp(code)
                            .idChantierErp(idErp > 0 ? idErp : null)
                            .nom("Chantier " + code) // Nom provisoire — à enrichir manuellement
                            .designationErp("Chantier " + code)
                            .localisation("")
                            .statut("ACTIF")
                            .build();
                    chantierRepository.save(nouveau);
                    crees++;
                    nouveauxCodes.add(code);
                    System.out.println("[SYNC-CHANTIERS] Nouveau chantier créé : " + code);
                }
            }

            rapport.put("status", "SUCCESS");
            rapport.put("total_codes_uniques", chantiersErp.size());
            rapport.put("crees", crees);
            rapport.put("existants", existants);
            rapport.put("nouveaux_codes", nouveauxCodes);
            rapport.put("message", String.format(
                    "%d code(s) chantier détectés depuis l'ERP. %d créés, %d déjà existants.",
                    chantiersErp.size(), crees, existants));
            System.out.println("[SYNC-CHANTIERS] " + rapport.get("message"));

        } catch (Exception e) {
            rapport.put("status", "ERROR");
            rapport.put("message", "Erreur: " + e.getMessage());
            System.err.println("[SYNC-CHANTIERS] Erreur globale: " + e.getMessage());
        }

        return rapport;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECALCUL STANDALONE DES HEURES DE PRODUCTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Recalcule heuresProductionCumulees pour TOUS les engins
     * depuis la somme réelle de leurs pointages (à partir du 2026-01-01).
     *
     * Source de vérité unique :
     * COALESCE(heures_effectives, heures_travaillees)
     *
     * - heures_effectives → renseigné par getMaterielStatus (STATUS sync)
     * - heures_travaillees → renseigné par getPontageMateriel (ancien sync)
     *
     * En appelant cette méthode, toute dérive due à des re-synchronisations
     * successives est corrigée d'un seul coup.
     *
     * @return rapport {status, engins_mis_a_jour, message}
     */
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> recalculerHeuresProduction() {
        Map<String, Object> rapport = new HashMap<>();
        try {
            LocalDate depuis = LocalDate.of(2026, 1, 1);
            enginRepository.recalculerToutesHeures(depuis);
            rapport.put("status", "SUCCESS");
            rapport.put("depuis", depuis.toString());
            rapport.put("message",
                    "heuresProductionCumulees recalculées avec succès pour tous les engins " +
                            "depuis le " + depuis + " (source: pointages_materiel).");
            System.out.println("[RECALCUL-HEURES] " + rapport.get("message"));
        } catch (Exception e) {
            rapport.put("status", "ERROR");
            rapport.put("message", "Erreur recalcul: " + e.getMessage());
            System.err.println("[RECALCUL-HEURES] " + e.getMessage());
        }
        return rapport;
    }
}
