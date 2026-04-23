package com.staport.atelier360.services.providers;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Service
public class ExcelPointageProvider implements PointageMaterielProvider {

    private static final String EXCEL_PATH = "Pointage_materiel_cpb_20260101_20260331_20260407134848984_.xlsx";

    public Map<String, Map<String, Double>> getPointageStats() {
        Map<String, List<Double>> usageMap = new HashMap<>(); // Code -> list of daily worked hours
        Map<String, Double> latestMeter = new HashMap<>();

        File file = new File(EXCEL_PATH);
        if (!file.exists()) return new HashMap<>();

        try (FileInputStream fis = new FileInputStream(file);
             Workbook workbook = new XSSFWorkbook(fis)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();
            
            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                if (row.getRowNum() == 0) continue; 
                
                Cell cellCode = row.getCell(1); 
                Cell cellCompteurFin = row.getCell(6); 
                Cell cellWorked = row.getCell(7); // Supposing col 7 is "Heures travaillées"
                
                if (cellCode != null && cellCompteurFin != null) {
                    String code = getCellValueAsString(cellCode);
                    if (code == null || code.isEmpty()) continue;

                    // Latest meter
                    double meter = cellCompteurFin.getNumericCellValue();
                    latestMeter.put(code, Math.max(latestMeter.getOrDefault(code, 0.0), meter));

                    // History for average
                    if (cellWorked != null && cellWorked.getCellType() == CellType.NUMERIC) {
                        usageMap.computeIfAbsent(code, k -> new ArrayList<>()).add(cellWorked.getNumericCellValue());
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        Map<String, Map<String, Double>> results = new HashMap<>();
        for (String code : latestMeter.keySet()) {
            Map<String, Double> stats = new HashMap<>();
            stats.put("latestMeter", latestMeter.get(code));
            
            List<Double> usages = usageMap.get(code);
            double avgUsage = 8.0; // default
            if (usages != null && !usages.isEmpty()) {
                avgUsage = usages.stream().mapToDouble(d -> d).average().orElse(8.0);
            }
            stats.put("avgUsage", avgUsage);
            results.put(code, stats);
        }
        return results;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf((int)cell.getNumericCellValue());
        return null;
    }

    @Override
    public Map<String, Double> getLatestPointages() {
        // Rediriger vers la nouvelle méthode simplifiée pour la compatibilité
        Map<String, Double> map = new HashMap<>();
        getPointageStats().forEach((k, v) -> map.put(k, v.get("latestMeter")));
        return map;
    }
}
