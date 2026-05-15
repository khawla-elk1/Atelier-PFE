package com.staport.atelier360.controllers;

import com.staport.atelier360.services.ErpSyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * Contrôleur d'administration pour la synchronisation ERP.
 * Permet de déclencher manuellement une synchro depuis le frontend
 * et de consulter l'état en temps réel (polling).
 */
@RestController
@RequestMapping("/api/admin/erp")
@CrossOrigin(origins = "*")
public class ErpSyncController {

    @Autowired
    private ErpSyncService erpSyncService;

    /**
     * Retourne l'état actuel de la synchronisation (pour polling frontend).
     * GET /api/admin/erp/sync/status
     */
    @GetMapping("/sync/status")
    public ResponseEntity<Map<String, Object>> getSyncStatus() {
        return ResponseEntity.ok(erpSyncService.getSyncState());
    }

    /**
     * Synchro immédiate : aujourd'hui uniquement (SYNCHRONE).
     * POST /api/admin/erp/sync/today
     */
    @PostMapping("/sync/today")
    public ResponseEntity<Map<String, Object>> syncToday() {
        LocalDate today = LocalDate.now();
        try {
            erpSyncService.syncPointagesBetween(today, today);
            return ResponseEntity.ok(erpSyncService.getSyncState());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "ERROR",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Synchro de la semaine courante (lundi → aujourd'hui) — SYNCHRONE.
     * POST /api/admin/erp/sync/week
     */
    @PostMapping("/sync/week")
    public ResponseEntity<Map<String, Object>> syncWeek() {
        LocalDate dateD = LocalDate.now().with(java.time.DayOfWeek.MONDAY);
        LocalDate dateF = LocalDate.now();
        try {
            erpSyncService.syncPointagesBetween(dateD, dateF);
            return ResponseEntity.ok(erpSyncService.getSyncState());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "ERROR",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Synchro du mois courant (1er du mois → aujourd'hui) — SYNCHRONE.
     * POST /api/admin/erp/sync/month
     */
    @PostMapping("/sync/month")
    public ResponseEntity<Map<String, Object>> syncMonth() {
        LocalDate dateD = LocalDate.now().withDayOfMonth(1);
        LocalDate dateF = LocalDate.now();
        try {
            erpSyncService.syncPointagesBetween(dateD, dateF);
            return ResponseEntity.ok(erpSyncService.getSyncState());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "ERROR",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Synchro ASYNCHRONE (non-bloquante) — le frontend peut poller /sync/status.
     * POST /api/admin/erp/sync/async?periode=month|week|today
     * Retourne immédiatement avec status RUNNING.
     */
    @PostMapping("/sync/async")
    public ResponseEntity<Map<String, Object>> syncAsync(
            @RequestParam(defaultValue = "month") String periode) {
        LocalDate dateD;
        LocalDate dateF = LocalDate.now();

        switch (periode) {
            case "today" -> dateD = LocalDate.now();
            case "week"  -> dateD = LocalDate.now().with(java.time.DayOfWeek.MONDAY);
            case "6months" -> dateD = LocalDate.now().minusMonths(6);
            case "12months", "year" -> dateD = LocalDate.now().minusMonths(12);
            default      -> dateD = LocalDate.now().withDayOfMonth(1); // month
        }

        boolean started = erpSyncService.startAsyncSync(dateD, dateF);
        if (!started) {
            return ResponseEntity.ok(Map.of(
                "status", "ALREADY_RUNNING",
                "message", "Une synchronisation est déjà en cours."
            ));
        }

        return ResponseEntity.ok(Map.of(
            "status", "STARTED",
            "message", "Synchronisation lancée en arrière-plan (" + dateD + " → " + dateF + ")",
            "dateD", dateD.toString(),
            "dateF", dateF.toString()
        ));
    }

    /**
     * Synchro sur une plage personnalisée — ASYNCHRONE.
     * POST /api/admin/erp/sync/range?dateD=2026-04-01&dateF=2026-04-30
     */
    @PostMapping("/sync/range")
    public ResponseEntity<Map<String, Object>> syncRange(
            @RequestParam String dateD,
            @RequestParam String dateF) {
        try {
            LocalDate from = LocalDate.parse(dateD);
            LocalDate to   = LocalDate.parse(dateF);
            if (from.isAfter(to)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", "dateD doit être antérieure ou égale à dateF"
                ));
            }
            boolean started = erpSyncService.startAsyncSync(from, to);
            if (!started) {
                return ResponseEntity.ok(Map.of(
                    "status", "ALREADY_RUNNING",
                    "message", "Une synchronisation est déjà en cours."
                ));
            }
            return ResponseEntity.ok(Map.of(
                "status", "STARTED",
                "message", "Synchronisation lancée (" + from + " → " + to + ")",
                "dateD", from.toString(),
                "dateF", to.toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "ERROR",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Recalcule les affectations chantier depuis les données locales existantes
     * (sans contacter l'ERP). Utile si l'ERP est inaccessible.
     * POST /api/admin/erp/recalcul-affectations
     */
    @PostMapping("/recalcul-affectations")
    public ResponseEntity<Map<String, Object>> recalculerAffectations() {
        Map<String, Object> result = erpSyncService.recalculerAffectationsDepuisLocal();
        return ResponseEntity.ok(result);
    }

    /**
     * Déduplique les engins en base.
     * POST /api/admin/erp/dedup-engins
     */
    @PostMapping("/dedup-engins")
    public ResponseEntity<String> dedupEngins() {
        return ResponseEntity.ok(erpSyncService.deduplicateEngins());
    }

    /**
     * Synchronise les codes matériels depuis le registre ERP (/getMateriel).
     * Utilise l'immatriculation comme clé de correspondance (source de vérité ERP).
     * POST /api/admin/erp/sync-codes
     */
    @PostMapping("/sync-codes")
    public ResponseEntity<Map<String, Object>> syncCodes() {
        Map<String, Object> result = erpSyncService.syncCodesDepuisErp();
        return ResponseEntity.ok(result);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SYNCHRONISATION DES HEURES DE PRODUCTION (getMaterielStatus)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Synchro des heures AUJOURD'HUI uniquement (synchrone).
     * POST /api/admin/erp/sync-heures/today
     */
    @PostMapping("/sync-heures/today")
    public ResponseEntity<Map<String, Object>> syncHeuresAujourdhui() {
        LocalDate today = LocalDate.now();
        Map<String, Object> result = erpSyncService.syncHeuresDepuisStatus(today, today);
        return ResponseEntity.ok(result);
    }

    /**
     * Synchro des heures de la semaine courante (lundi → aujourd'hui).
     * POST /api/admin/erp/sync-heures/week
     */
    @PostMapping("/sync-heures/week")
    public ResponseEntity<Map<String, Object>> syncHeuresSemaine() {
        LocalDate dateD = LocalDate.now().with(java.time.DayOfWeek.MONDAY);
        LocalDate dateF = LocalDate.now();
        Map<String, Object> result = erpSyncService.syncHeuresDepuisStatus(dateD, dateF);
        return ResponseEntity.ok(result);
    }

    /**
     * Synchro des heures du mois courant.
     * POST /api/admin/erp/sync-heures/month
     */
    @PostMapping("/sync-heures/month")
    public ResponseEntity<Map<String, Object>> syncHeuresMois() {
        LocalDate dateD = LocalDate.now().withDayOfMonth(1);
        LocalDate dateF = LocalDate.now();
        Map<String, Object> result = erpSyncService.syncHeuresDepuisStatus(dateD, dateF);
        return ResponseEntity.ok(result);
    }

    /**
     * Synchro des heures sur une plage personnalisée — ASYNCHRONE (non-bloquant).
     * POST /api/admin/erp/sync-heures/range?dateD=2026-01-01&dateF=2026-05-15
     */
    @PostMapping("/sync-heures/range")
    public ResponseEntity<Map<String, Object>> syncHeuresRange(
            @RequestParam String dateD,
            @RequestParam String dateF) {
        try {
            LocalDate from = LocalDate.parse(dateD);
            LocalDate to   = LocalDate.parse(dateF);
            if (from.isAfter(to)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", "dateD doit être antérieure ou égale à dateF"
                ));
            }
            new Thread(() -> erpSyncService.syncHeuresDepuisStatus(from, to),
                "sync-heures-thread").start();
            return ResponseEntity.ok(Map.of(
                "status", "STARTED",
                "message", "Synchronisation des heures lancée (" + from + " → " + to + ")",
                "dateD", from.toString(),
                "dateF", to.toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "ERROR",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Importe un engin manquant depuis l'ERP par son code.
     * POST /api/admin/erp/import-engin/{code}
     */
    @PostMapping("/import-engin/{code}")
    public ResponseEntity<Map<String, Object>> importEngin(@PathVariable String code) {
        Map<String, Object> result = erpSyncService.importerEnginParCode(code);
        if ("SUCCESS".equals(result.get("status"))) {
            return ResponseEntity.ok(result);
        } else if ("EXISTS".equals(result.get("status"))) {
            return ResponseEntity.ok(result); // Return 200 OK even if it exists, with status EXISTS
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Importe plusieurs engins manquants depuis l'ERP en fournissant une liste de codes.
     * POST /api/admin/erp/import-engins-batch
     * Body: ["E504", "E506", "E512", ...]
     */
    @PostMapping("/import-engins-batch")
    public ResponseEntity<Map<String, Object>> importEnginsBatch(@RequestBody java.util.List<String> codes) {
        int successCount = 0;
        int existsCount = 0;
        int errorCount = 0;
        java.util.List<String> errors = new java.util.ArrayList<>();

        for (String code : codes) {
            Map<String, Object> res = erpSyncService.importerEnginParCode(code);
            if ("SUCCESS".equals(res.get("status"))) {
                successCount++;
            } else if ("EXISTS".equals(res.get("status"))) {
                existsCount++;
            } else {
                errorCount++;
                errors.add(code + ": " + res.get("message"));
            }
        }

        return ResponseEntity.ok(Map.of(
            "status", "FINISHED",
            "successCount", successCount,
            "existsCount", existsCount,
            "errorCount", errorCount,
            "errors", errors,
            "message", "Importation par lots terminée. " + successCount + " créés, " + existsCount + " déjà existants, " + errorCount + " erreurs."
        ));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SYNCHRONISATION DES CHANTIERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Découvre et crée les chantiers ERP manquants (ex: C214, C215...).
     * Interroge getMaterielStatus sur la plage fournie et crée les
     * chantiers absents de la base locale.
     *
     * POST /api/admin/erp/sync-chantiers?dateD=2026-01-01&dateF=2026-05-15
     *
     * Si aucune date fournie, la fenêtre par défaut est le mois en cours.
     */
    @PostMapping("/sync-chantiers")
    public ResponseEntity<Map<String, Object>> syncChantiers(
            @RequestParam(required = false) String dateD,
            @RequestParam(required = false) String dateF) {
        try {
            LocalDate from = (dateD != null) ? LocalDate.parse(dateD) : LocalDate.now().withDayOfMonth(1);
            LocalDate to   = (dateF != null) ? LocalDate.parse(dateF) : LocalDate.now();
            Map<String, Object> result = erpSyncService.syncChantiersDepuisStatus(from, to);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "ERROR", "message", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RECALCUL DES HEURES DE PRODUCTION (correctif cumul)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Recalcule heuresProductionCumulees pour TOUS les engins
     * depuis la somme réelle des pointages (2026-01-01 → aujourd'hui).
     *
     * À appeler après toute synchronisation pour corriger les dérives.
     * POST /api/admin/erp/recalcul-heures
     */
    @PostMapping("/recalcul-heures")
    public ResponseEntity<Map<String, Object>> recalculHeures() {
        Map<String, Object> result = erpSyncService.recalculerHeuresProduction();
        return ResponseEntity.ok(result);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SYNC COMPLET : chantiers + heures + recalcul en une seule opération
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Lance dans l'ordre :
     *   1. Sync des chantiers manquants (découverte automatique)
     *   2. Sync des heures de production (mois courant)
     *   3. Recalcul des heuresProductionCumulees (correctif cumul)
     *
     * Asynchrone pour les longues périodes.
     * POST /api/admin/erp/sync-complet
     */
    @PostMapping("/sync-complet")
    public ResponseEntity<Map<String, Object>> syncComplet() {
        LocalDate dateD = LocalDate.now().withDayOfMonth(1);
        LocalDate dateF = LocalDate.now();

        new Thread(() -> {
            System.out.println("[SYNC-COMPLET] Étape 1/3 : Synchronisation des chantiers...");
            erpSyncService.syncChantiersDepuisStatus(dateD, dateF);

            System.out.println("[SYNC-COMPLET] Étape 2/3 : Synchronisation des heures...");
            erpSyncService.syncHeuresDepuisStatus(dateD, dateF);

            System.out.println("[SYNC-COMPLET] Étape 3/3 : Recalcul des heuresProductionCumulees...");
            erpSyncService.recalculerHeuresProduction();

            System.out.println("[SYNC-COMPLET] Terminé.");
        }, "sync-complet-thread").start();

        return ResponseEntity.ok(Map.of(
            "status", "STARTED",
            "etapes", new String[]{
                "1. Sync chantiers ERP manquants",
                "2. Sync heures de production (" + dateD + " → " + dateF + ")",
                "3. Recalcul heuresProductionCumulees (depuis 2026-01-01)"
            },
            "message", "Synchronisation complète lancée en arrière-plan. Consultez les logs pour le suivi."
        ));
    }
}
