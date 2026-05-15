package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.Engin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnginRepository extends JpaRepository<Engin, Long> {

    List<Engin> findByChantierIdChantier(Long idChantier);

    Engin findByMatricule(String matricule);

    @Query("SELECT e FROM Engin e WHERE UPPER(e.codeMateriel) = UPPER(:code)")
    Optional<Engin> findByCodeMaterielIgnoreCase(@org.springframework.data.repository.query.Param("code") String code);

    Optional<Engin> findByCodeMateriel(String codeMateriel);

    Optional<Engin> findByIdMaterielErp(Long idMaterielErp);

    @Query("SELECT e.idMaterielErp FROM Engin e WHERE e.idMaterielErp IS NOT NULL")
    java.util.Set<Long> findAllIdMaterielErps();

    /** Tous les engins importés depuis l'ERP (ont un idMaterielErp) */
    @Query("SELECT e FROM Engin e WHERE e.idMaterielErp IS NOT NULL")
    List<Engin> findAllWithErpId();

    /** Tous les engins sans idMaterielErp (importés Excel ou créés manuellement) */
    @Query("SELECT e FROM Engin e WHERE e.idMaterielErp IS NULL")
    List<Engin> findAllWithoutErpId();

    /**
     * Recherche floue : trouve les engins dont le codeMateriel ou le matricule
     * CONTIENT le code court ERP (ex: "E666" dans "RABOTEUSE W1500 E666 (COMP 5581H)").
     * Utilisé comme fallback dans syncHeuresDepuisStatus quand le match exact échoue.
     */
    @Query("SELECT e FROM Engin e WHERE UPPER(e.codeMateriel) LIKE UPPER(CONCAT('%', :codeShort, '%')) " +
           "OR UPPER(e.matricule) LIKE UPPER(CONCAT('%', :codeShort, '%'))")
    List<Engin> findByCodeMaterielContainingIgnoreCase(
        @org.springframework.data.repository.query.Param("codeShort") String codeShort);

    /**
     * Recalcule heures_production_cumulees pour TOUS les engins depuis la somme
     * réelle des pointages (à partir de :depuis).
     * Utilise COALESCE(heures_effectives, heures_travaillees) pour gérer
     * les anciens pointages (getPontageMateriel) ET les nouveaux (getMaterielStatus)
     * sans double-comptage.
     */
    /**
     * Recalcule heures_production_cumulees pour TOUS les engins depuis la somme
     * réelle de leurs pointages (à partir de :depuis), avec la RÈGLE MÉTIER correcte :
     *
     *   Règle : une machine travaille AU MAXIMUM 11h par jour.
     *
     * Deux types de pointages distincts sont traités :
     *
     * 1. STATUS (sync_id LIKE 'STATUS|%') → heures_effectives
     * 2. Anciens pointages getPontageMateriel → heures_travaillees
     *
     * Pour éviter la corruption : 
     * - Les valeurs absurdes (> 24) sont TOTALEMENT exclues (il s'agit de compteurs km).
     * - Les valeurs entre 0 et 24 sont PLAFONNÉES à 11h maximum par sécurité.
     */
    @Modifying
    @Transactional
    @Query(value =
        "UPDATE engins e " +
        "INNER JOIN (" +
        "  SELECT pm.id_engin, " +
        "  COALESCE(SUM(" +
        "    CASE WHEN pm.sync_id LIKE 'STATUS|%' THEN " +
        "      CASE WHEN pm.heures_effectives BETWEEN 0 AND 24 THEN pm.heures_effectives ELSE 0 END " +
        "    ELSE " +
        "      CASE WHEN pm.heures_travaillees BETWEEN 0 AND 24 THEN pm.heures_travaillees ELSE 0 END " +
        "    END" +
        "  ), 0) AS total_h " +
        "  FROM pointages_materiel pm " +
        "  WHERE pm.id_engin IS NOT NULL " +
        "    AND pm.date_pointage >= :depuis " +
        "  GROUP BY pm.id_engin " +
        ") calc ON e.id_engin = calc.id_engin " +
        "SET e.heures_production_cumulees = calc.total_h",
        nativeQuery = true)
    void recalculerToutesHeures(
        @org.springframework.data.repository.query.Param("depuis") LocalDate depuis);

    /** Suppression en masse par liste d'IDs */
    @Modifying
    @Transactional
    @Query("DELETE FROM Engin e WHERE e.idEngin IN :ids")
    void deleteAllByIdEnginIn(@org.springframework.data.repository.query.Param("ids") List<Long> ids);

    /** Mise à jour en masse de la FK engin dans les pointages */
    @Modifying
    @Transactional
    @Query("UPDATE PointageMateriel p SET p.engin.idEngin = :nouveauId WHERE p.engin.idEngin = :ancienId")
    void reassignPointagesEngin(
        @org.springframework.data.repository.query.Param("ancienId") Long ancienId,
        @org.springframework.data.repository.query.Param("nouveauId") Long nouveauId
    );

    /** Mise à jour en masse de la FK engin dans les vidanges */
    @Modifying
    @Transactional
    @Query("UPDATE Vidange v SET v.engin.idEngin = :nouveauId WHERE v.engin.idEngin = :ancienId")
    void reassignVidangesEngin(
        @org.springframework.data.repository.query.Param("ancienId") Long ancienId,
        @org.springframework.data.repository.query.Param("nouveauId") Long nouveauId
    );
}
