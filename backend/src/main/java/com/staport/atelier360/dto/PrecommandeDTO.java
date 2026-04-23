package com.staport.atelier360.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

import java.util.List;

@Data
@JacksonXmlRootElement(localName = "Precommande")
public class PrecommandeDTO {

    @JacksonXmlProperty(localName = "Reference")
    private String refPrecom;

    @JacksonXmlProperty(localName = "DateCreation")
    private String dateCreation;

    @JacksonXmlProperty(localName = "InterventionID")
    private Long interventionId;

    @JacksonXmlProperty(localName = "EnginMatricule")
    private String enginMatricule;

    @JacksonXmlElementWrapper(localName = "Lignes")
    @JacksonXmlProperty(localName = "LignePrecommande")
    private List<LignePrecomDTO> lignes;
}
