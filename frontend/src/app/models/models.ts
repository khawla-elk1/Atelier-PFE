export interface Engin {
  idEngin?: number;
  matricule: string;
  marque: string;
  modele: string;
  type: string;
  categorie: string;
  poids?: string;
  serieChassis?: string;
  typeMoteur?: string;
  serieMoteur?: string;
  immatriculation?: string;
  dateAcquisition?: string;
  dateMiseEnCirculation?: string;
  codeInterne?: string;
  codeMateriel?: string;
  uniteCompteur?: string;
  compteurActuel?: number;
  statut: string;
}

export interface Intervention {
  idIntervention?: number;
  idStr?: string; // Calculated field for UI
  idEngin?: number;
  engin?: Engin;
  type: string;
  statut: string;
  dateDebut: string | Date;
  dateFin?: string | Date;
  dureeReelle?: number;
  cout?: number;
  observations?: string;
  technicien?: Utilisateur;
  joursArret?: number; // Calculated field for UI
}

export interface Anomalie {
  idAnomalie?: number;
  engin?: Engin;
  description: string;
  criticite: 'URGENTE' | 'NORMALE' | 'PLANIFIEE';
  statut: string;
  dateSignalement: string | Date;
  photoUrl?: string;
  declarant?: Utilisateur;
  enginDeclare?: string;
}

export interface Utilisateur {
  idUser?: number;
  username: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  specialite?: string;
}

export interface DashboardKPIs {
  totalEngins: number;
  enginsActifs: number;
  countEngins: number;
  countCamions: number;
  countVoitures: number;
  countAccessoires: number;
  tauxDisponibilite?: number;
}
