package com.staport.atelier360.services.providers;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class WebServicePointageProvider implements PointageMaterielProvider {

    @Override
    public Map<String, Double> getLatestPointages() {
        // En attente de l'ingénieur de l'entreprise
        System.out.println("Appel au Web Service GMAO Externe (Simulé pour l'instant)...");
        return new HashMap<>();
    }
}
