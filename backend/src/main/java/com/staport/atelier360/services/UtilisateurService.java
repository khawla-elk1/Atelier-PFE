package com.staport.atelier360.services;

import com.staport.atelier360.entities.Utilisateur;
import com.staport.atelier360.repositories.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UtilisateurService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurRepository.findAll();
    }

    public Utilisateur createUtilisateur(Utilisateur user) {
        if (user.getDateCreation() == null) {
            user.setDateCreation(LocalDateTime.now());
        }
        // Force actif to true
        user.setActif(true);
        return utilisateurRepository.save(user);
    }

    public Optional<Utilisateur> getByEmail(String email) {
        return utilisateurRepository.findByEmail(email);
    }
    
    // Simuler le Hash de JWT plus tard
    public boolean authentifier(String email, String pwd) {
        Optional<Utilisateur> user = utilisateurRepository.findByEmail(email);
        return user.isPresent() && user.get().getMotPasse().equals(pwd) && user.get().isActif();
    }

    // --- WORKFLOW VALIDATION TECHNICIEN ---
    
    public Utilisateur createTechnicienSaisi(Utilisateur user) {
        if (user.getDateCreation() == null) {
            user.setDateCreation(LocalDateTime.now());
        }
        user.setRole(com.staport.atelier360.enums.Role.TECH);
        user.setActif(false); // Inactifs jusqu'à validation
        user.setStatutValidation("EN_ATTENTE");
        
        // Fallback info to pass DB level constraints without crashing
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            user.setEmail("tech_" + System.currentTimeMillis() + "@staport.local");
        }
        if (user.getMotPasse() == null || user.getMotPasse().isBlank()) {
            user.setMotPasse("NO_PASSWORD_REQUIRED");
        }
        
        return utilisateurRepository.save(user);
    }
    
    public List<Utilisateur> getTechniciensEnAttente() {
        return utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() == com.staport.atelier360.enums.Role.TECH && "EN_ATTENTE".equals(u.getStatutValidation()))
                .collect(java.util.stream.Collectors.toList());
    }

    public Utilisateur validerTechnicien(@org.springframework.lang.NonNull Long idUser, String statutValidation) {
        Optional<Utilisateur> optUser = utilisateurRepository.findById(idUser);
        if (optUser.isPresent()) {
            Utilisateur user = optUser.get();
            user.setStatutValidation(statutValidation);
            if ("APPROUVE".equals(statutValidation)) {
                user.setActif(true);
            } else if ("REJETE".equals(statutValidation)) {
                user.setActif(false);
            }
            return utilisateurRepository.save(user);
        }
        return null;
    }
}
