package com.staport.atelier360.controllers;

import com.staport.atelier360.entities.Utilisateur;
import com.staport.atelier360.services.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UtilisateurService utilisateurService;

    // A FAIRE: Connecter avec Spring Security JWT (simplifié ici pour démarrer)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
        String email = creds.get("email");
        String password = creds.get("password");

        if (utilisateurService.authentifier(email, password)) {
            Optional<Utilisateur> user = utilisateurService.getByEmail(email);
            Map<String, Object> response = new HashMap<>();
            response.put("token", "dummy-jwt-token-replace-later");
            response.put("user", user.get());
            response.put("role", user.get().getRole().name());
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body("Identifiants incorrects ou compte inactif");
        }
    }
}
