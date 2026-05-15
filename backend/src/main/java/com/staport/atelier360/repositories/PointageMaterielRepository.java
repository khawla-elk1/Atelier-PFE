package com.staport.atelier360.repositories;

import com.staport.atelier360.entities.PointageMateriel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PointageMaterielRepository extends JpaRepository<PointageMateriel, Long> {
    List<PointageMateriel> findByIdMaterielErp(Long idMaterielErp);
    boolean existsByIdMaterielErpAndDatePointage(Long idMaterielErp, LocalDate datePointage);

    // Recherche par syncId unique (pour la déduplication)
    java.util.Optional<PointageMateriel> findBySyncId(String syncId);

    // Recherche par engin + date (pour cumul des tranches horaires du jour)
    List<PointageMateriel> findByEnginIdEnginAndDatePointage(Long enginId, LocalDate datePointage);

    // Recherche par code matériel + date (fallback quand engin non trouvé en local)
    List<PointageMateriel> findByCodeMaterielAndDatePointage(String codeMateriel, LocalDate datePointage);

    // Pour l'analyse de consommation
    List<PointageMateriel> findByEnginIdEnginOrderByDatePointageDesc(Long idEngin);
    List<PointageMateriel> findByEnginIdEnginInOrderByDatePointageDesc(List<Long> enginIds);

    // OPTIMISATION EXTREME: Récupérer tous les IDs ERP existants d'un coup
    @org.springframework.data.jpa.repository.Query("SELECT p.syncId FROM PointageMateriel p WHERE p.syncId IS NOT NULL")
    java.util.Set<String> findAllExistingPointageErpIds();

    @org.springframework.data.jpa.repository.Query("SELECT SUM(p.heuresTravaillees) FROM PointageMateriel p WHERE p.engin.idEngin = :enginId")
    Double sumHeuresTravailleesByEngin(@org.springframework.data.repository.query.Param("enginId") Long enginId);

    @org.springframework.data.jpa.repository.Query(value = 
                   "  SELECT p.id_engin, " +
                   "  SUM(" +
                   "    CASE WHEN p.sync_id LIKE 'STATUS|%' THEN " +
                   "      CASE WHEN p.heures_effectives BETWEEN 0 AND 24 THEN p.heures_effectives ELSE 0 END " +
                   "    ELSE " +
                   "      CASE WHEN p.heures_travaillees BETWEEN 0 AND 24 THEN p.heures_travaillees ELSE 0 END " +
                   "    END" +
                   "  ) as heures_totales " +
                   "  FROM pointages_materiel p " +
                   "  JOIN engins e ON p.id_engin = e.id_engin " +
                   "  WHERE e.id_chantier = :chantierId " +
                   "  AND p.date_pointage >= :startDate AND p.date_pointage <= :endDate " +
                   "  GROUP BY p.id_engin", nativeQuery = true)
    List<Object[]> sumHeuresByChantierAndMonth(
            @org.springframework.data.repository.query.Param("chantierId") Long chantierId,
            @org.springframework.data.repository.query.Param("startDate") LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate") LocalDate endDate);

    // Coût total journalier par chantier sur une période
    @org.springframework.data.jpa.repository.Query(value =
        "SELECT p.code_chantier_erp, p.date_pointage, SUM(p.cout_journalier) as total_cout " +
        "FROM pointages_materiel p " +
        "WHERE p.code_chantier_erp IN :codesChantiers " +
        "AND p.date_pointage >= :startDate AND p.date_pointage <= :endDate " +
        "AND p.cout_journalier IS NOT NULL " +
        "GROUP BY p.code_chantier_erp, p.date_pointage " +
        "ORDER BY p.code_chantier_erp, p.date_pointage", nativeQuery = true)
    List<Object[]> sumCoutJournalierByChantier(
            @org.springframework.data.repository.query.Param("codesChantiers") List<String> codesChantiers,
            @org.springframework.data.repository.query.Param("startDate") LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate") LocalDate endDate);
}
