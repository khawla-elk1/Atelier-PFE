package com.staport.atelier360.services;

import com.staport.atelier360.entities.Engin;
import com.staport.atelier360.entities.Intervention;
import com.staport.atelier360.repositories.EnginRepository;
import com.staport.atelier360.repositories.InterventionRepository;
import com.staport.atelier360.repositories.AnomalieRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DashboardServiceTest {

    @Mock
    private EnginRepository enginRepository;

    @Mock
    private InterventionRepository interventionRepository;

    @Mock
    private AnomalieRepository anomalieRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetKpisGlobaux() {
        // Arrange
        Engin e1 = new Engin();
        e1.setStatut("ACTIF");
        e1.setCategorie("Engin");
        
        Engin e2 = new Engin();
        e2.setStatut("PANNE");
        e2.setCategorie("Camion");

        when(enginRepository.findAll()).thenReturn(Arrays.asList(e1, e2));
        
        Intervention i1 = new Intervention();
        i1.setDureeReelle(5.0);
        
        when(interventionRepository.findAll()).thenReturn(List.of(i1));
        when(anomalieRepository.findByStatut("Signalée")).thenReturn(List.of());

        // Act
        Map<String, Object> kpis = dashboardService.getKpisGlobaux();

        // Assert
        assertEquals(2L, kpis.get("totalEngins"));
        assertEquals(1L, kpis.get("enginsActifs"));
        assertEquals("50.0%", kpis.get("tauxDisponibilite"));
        assertEquals("5.0 h", kpis.get("mttrHeures"));
        
        verify(enginRepository, times(1)).findAll();
    }
}
