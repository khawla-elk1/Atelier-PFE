package com.staport.atelier360.services;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.staport.atelier360.dto.LignePrecomDTO;
import com.staport.atelier360.dto.PrecommandeDTO;
import com.staport.atelier360.entities.LignePrecom;
import com.staport.atelier360.entities.Precommande;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ErpExportService {

    @Value("${app.erp.export-path}")
    private String exportPath;

    public String genererXml(Precommande precommande) throws IOException {
        PrecommandeDTO dto = new PrecommandeDTO();
        dto.setRefPrecom(precommande.getRefPrecom());
        dto.setDateCreation(precommande.getDateCreation() != null ? precommande.getDateCreation().toString() : "");
        dto.setInterventionId(precommande.getIntervention() != null ? precommande.getIntervention().getIdIntervention() : null);
        dto.setEnginMatricule((precommande.getIntervention() != null && precommande.getIntervention().getEngin() != null) 
            ? precommande.getIntervention().getEngin().getMatricule() : "");

        List<LignePrecomDTO> lignesDto = new ArrayList<>();
        if (precommande.getLignes() != null) {
            for (LignePrecom ligne : precommande.getLignes()) {
                LignePrecomDTO ligneDto = new LignePrecomDTO();
                ligneDto.setRefPiece(ligne.getRefPiece());
                ligneDto.setDesignation(ligne.getDesignation());
                ligneDto.setQuantite(ligne.getQuantite());
                ligneDto.setFournisseur(ligne.getFournisseur());
                lignesDto.add(ligneDto);
            }
        }
        dto.setLignes(lignesDto);

        XmlMapper xmlMapper = new XmlMapper();
        xmlMapper.registerModule(new JavaTimeModule());
        
        // Ensure directory exists
        File dir = new File(exportPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String fileName = "precommande_" + precommande.getRefPrecom() + ".xml";
        File file = new File(dir, fileName);
        
        xmlMapper.writeValue(file, dto);
        
        return file.getAbsolutePath();
    }
}
