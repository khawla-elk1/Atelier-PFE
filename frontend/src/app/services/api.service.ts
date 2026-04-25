import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Engin, Intervention, Anomalie, Utilisateur, DashboardKPIs } from '../models/models';

const API_URL = '/api';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  // --- Dashboard KPI ---
  getDashboardKpis(): Observable<DashboardKPIs> {
    return this.http.get<DashboardKPIs>(`${API_URL}/dashboard/kpi`);
  }

  // --- Matériels & Engins ---
  getMateriels(): Observable<Engin[]> {
    return this.http.get<Engin[]>(`${API_URL}/engins`);
  }

  getMaterielById(id: number): Observable<Engin> {
    return this.http.get<Engin>(`${API_URL}/engins/${id}`);
  }

  createMateriel(engin: Engin): Observable<Engin> {
    return this.http.post<Engin>(`${API_URL}/engins`, engin);
  }

  // --- Anomalies ---
  getAnomalies(): Observable<Anomalie[]> {
    return this.http.get<Anomalie[]>(`${API_URL}/anomalies`);
  }

  createAnomalie(anomalie: Partial<Anomalie>): Observable<Anomalie> {
    return this.http.post<Anomalie>(`${API_URL}/anomalies`, anomalie);
  }

  deleteAnomalie(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/anomalies/${id}`);
  }

  // --- Interventions ---
  getInterventions(): Observable<Intervention[]> {
    return this.http.get<Intervention[]>(`${API_URL}/interventions`);
  }

  createIntervention(intervention: Partial<Intervention>): Observable<Intervention> {
    return this.http.post<Intervention>(`${API_URL}/interventions`, intervention);
  }

  validerEtCloturerIntervention(id: number, params: string): Observable<Intervention> {
    return this.http.put<Intervention>(`${API_URL}/interventions/${id}/cloturer?${params}`, {});
  }

  mettreEnAttentePieces(id: number): Observable<Intervention> {
    return this.http.put<Intervention>(`${API_URL}/interventions/${id}/attente-pieces`, {});
  }

  assignerTechnicien(id: number, technicienId: number): Observable<Intervention> {
    return this.http.put<Intervention>(`${API_URL}/interventions/${id}/assigner-technicien?technicienId=${technicienId}`, {});
  }

  deleteIntervention(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/interventions/${id}`);
  }

  // --- Utilisateurs / Techniciens ---
  getTechniciens(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${API_URL}/utilisateurs/techniciens`);
  }

  saisieTechnicien(tech: Partial<Utilisateur>): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${API_URL}/utilisateurs/saisie-technicien`, tech);
  }

  getTechniciensEnAttente(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${API_URL}/utilisateurs/techniciens-en-attente`);
  }

  validerTechnicien(idUser: number, statutValidation: string): Observable<void> {
    return this.http.put<void>(`${API_URL}/utilisateurs/technicien-validation/${idUser}?statutValidation=${statutValidation}`, {});
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
    return this.http.get<any[]>(`${API_URL}/stock/demandes-sortie`);
  }

  getDemandesEnAttente(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/stock/demandes-sortie/en-attente`);
  }

  creerDemandeSortie(demande: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/stock/demande-sortie`, demande);
  }

  validerDemandeSortie(id: number): Observable<void> {
    return this.http.put<void>(`${API_URL}/stock/demande-sortie/${id}/valider`, {});
  }

  rejeterDemandeSortie(id: number, motif: string = ''): Observable<void> {
    return this.http.put<void>(`${API_URL}/stock/demande-sortie/${id}/rejeter?motif=${motif}`, {});
  }

  // --- PRECOMMANDES ERP ---
  getPrecommandes(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/stock/precommandes`);
  }

  creerPrecommande(precom: any): Observable<any> {
    return this.http.post<any>(`${API_URL}/stock/precommande`, precom);
  }

  // --- MAINTENANCE PREDICTIVE IA ---
  getPredictiveMaintenance(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/maintenance-predictive/predictions`);
  }

  // --- ERP SYNC ---
  genererXmlErp(id: number): Observable<any> {
    return this.http.get(`${API_URL}/erp/export-xml/${id}`);
  }
}
