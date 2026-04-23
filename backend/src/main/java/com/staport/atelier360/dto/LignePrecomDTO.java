package com.staport.atelier360.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

@Data
@JacksonXmlRootElement(localName = "LignePrecommande")
public class LignePrecomDTO {

    @JacksonXmlProperty(localName = "ReferencePiece")
    private String refPiece;

    @JacksonXmlProperty(localName = "Designation")
    private String designation;

    @JacksonXmlProperty(localName = "Quantite")
    private Integer quantite;

    @JacksonXmlProperty(localName = "Fournisseur")
    private String fournisseur;
}
