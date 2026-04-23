import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Mode développement - L'API backend Spring Boot tourne sur le port 8081
const API_URL = '/api';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  // --- Dashboard KPI ---
  getDashboardKpis(): Observable<any> {
    return this.http.get(`${API_URL}/dashboard/kpi`);
  }

  // --- Matériels & Engins ---
  getMateriels(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/engins`);
  }

  getMaterielById(id: number): Observable<any> {
    return this.http.get<any>(`${API_URL}/engins/${id}`);
  }

  createMateriel(engin: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/engins`, engin);
  }

  // --- Anomalies ---
  getAnomalies(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/anomalies`);
  }

  createAnomalie(anomalie: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/anomalies`, anomalie);
  }

  deleteAnomalie(id: number): Observable<any> {
    return this.http.delete<any>(`${API_URL}/anomalies/${id}`);
  }

  // --- Interventions ---
  getInterventions(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/interventions`);
  }

  createIntervention(intervention: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/interventions`, intervention);
  }

  validerEtCloturerIntervention(id: number, params: string): Observable<any> {
    return this.http.put<any>(`${API_URL}/interventions/${id}/cloturer?${params}`, {});
  }

  mettreEnAttentePieces(id: number): Observable<any> {
    return this.http.put<any>(`${API_URL}/interventions/${id}/attente-pieces`, {});
  }

  assignerTechnicien(id: number, technicienId: number): Observable<any> {
    return this.http.put<any>(`${API_URL}/interventions/${id}/assigner-technicien?technicienId=${technicienId}`, {});
  }

  deleteIntervention(id: number): Observable<any> {
    return this.http.delete<any>(`${API_URL}/interventions/${id}`);
  }

  // --- Utilisateurs / Techniciens ---
  getTechniciens(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/utilisateurs/techniciens`);
  }

  saisieTechnicien(tech: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/utilisateurs/saisie-technicien`, tech);
  }

  getTechniciensEnAttente(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/utilisateurs/techniciens-en-attente`);
  }

  validerTechnicien(idUser: number, statutValidation: string): Observable<any> {
    return this.http.put<any>(`${API_URL}/utilisateurs/technicien-validation/${idUser}?statutValidation=${statutValidation}`, {});
  }

  // --- STOCK & PIECES DE RECHANGE ---
  
  getPieces(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/stock/pieces`);
  }
  
  searchPieces(q: string): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/stock/pieces/search?q=${q}`);
  }

  // --- DEMANDES DE SORTIE PIECES ---
  
  getDemandesSortie(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/stock/demandes`);
  }

  getDemandesEnAttente(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/stock/demandes/en-attente`);
  }

  creerDemandeSortie(demande: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/stock/demandes`, demande);
  }

  validerDemandeSortie(idDemande: number): Observable<any> {
    return this.http.put<any>(`${API_URL}/stock/demandes/${idDemande}/valider`, {});
  }

  rejeterDemandeSortie(idDemande: number, motif: string): Observable<any> {
    return this.http.put<any>(`${API_URL}/stock/demandes/${idDemande}/rejeter?motif=${motif}`, {});
  }

  // --- ERP Sync (Précommandes) ---
  getPrecommandes(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/precommandes`);
  }

  creerPrecommande(precommande: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/precommandes`, precommande);
  }

  genererXmlErp(idPrecommande: number): Observable<any> {
    return this.http.post(`${API_URL}/precommandes/${idPrecommande}/generer-erp`, {});
  }

  // --- Maintenance Prédictive ---
  getPredictiveMaintenance(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/maintenance/predict`);
  }
}
