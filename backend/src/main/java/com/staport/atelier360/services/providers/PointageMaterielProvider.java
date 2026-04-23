package com.staport.atelier360.services.providers;

import java.util.Map;

public interface PointageMaterielProvider {
    /**
     * Map of CodeMateriel -> LatestCompteur
     */
    Map<String, Double> getLatestPointages();
}
