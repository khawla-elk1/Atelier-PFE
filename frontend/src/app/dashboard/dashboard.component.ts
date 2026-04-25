import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { DashboardKPIs, Engin, Anomalie } from '../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-wrapper animate-slide-up">
      <div class="dash-header">
        <div>
          <h1 class="dash-title">Tableau de Bord Exécutif</h1>
          <p class="dash-subtitle">Aperçu en temps réel — Flotte & Maintenance STAPORT </p>
        </div>
        <div class="dash-header-actions">
          <span class="status-badge">
            <span class="status-dot"></span> Système Connecté
          </span>
        </div>
      </div>

      <!-- LIGNE 1 : KPI PRINCIPAUX -->
      <div class="metric-grid">
        <!-- Carte Dispo -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Disponibilité Opérationnelle</span>
            <div class="metric-icon-bg success-bg">
              <svg width="20" height="20" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
          <div class="metric-body">
            <div class="metric-value text-success">{{ kpis?.tauxDisponibilite || '0%' }}</div>
            <div class="metric-caption">
              <strong>{{ kpis?.enginsActifs || 0 }}</strong> matériels prêts sur {{ kpis?.totalEngins || 0 }}
            </div>
          </div>
        </div>

        <!-- Carte MTTR -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Temps Moyen de Réparation (MTTR)</span>
            <div class="metric-icon-bg primary-bg">
              <svg width="20" height="20" fill="none" stroke="#1d4ed8" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
          <div class="metric-body">
            <div class="metric-value text-primary">{{ kpis?.mttrHeures || '2.4 h' }}</div>
            <div class="metric-caption">Durée moyenne d'immobilisation atelier</div>
          </div>
        </div>

        <!-- Carte Alertes -->
        <div class="metric-card" [class.alert-border]="recentAnomalies.length > 0">
          <div class="metric-header">
            <span class="metric-title">Alertes & Pannes Critiques</span>
            <div class="metric-icon-bg" [ngClass]="(recentAnomalies.length > 0) ? 'danger-bg' : 'success-bg'">
              <svg width="20" height="20" fill="none" [attr.stroke]="(recentAnomalies.length > 0) ? '#dc2626' : '#059669'" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
          </div>
          <div class="metric-body">
            <div class="metric-value" [ngStyle]="{'color': (recentAnomalies.length > 0) ? '#dc2626' : '#059669'}">
              {{ recentAnomalies.length }}
            </div>
            <div class="metric-caption">{{ (recentAnomalies.length > 0) ? 'Interventions urgentes requises' : 'Aucune anomalie critique' }}</div>
          </div>
        </div>
      </div>

      <!-- LIGNE 2 : REPARTITION & ANOMALIES -->
      <div class="bifurcated-layout">
        
        <!-- Colonne Gauche : Flotte -->
        <div class="panel fleet-panel">
          <div class="panel-header">
            <h2>Inventaire & Répartition de la Flotte</h2>
          </div>
          <div class="panel-body">
            <div class="fleet-grid">
              <!-- Engins -->
              <div class="fleet-item">
                <div class="f-icon-box" style="background:#eff6ff; color:#1d4ed8;">
                  <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                </div>
                <div class="f-content">
                  <span class="f-val">{{ kpis?.countEngins || 0 }}</span>
                  <span class="f-label">Engins Lourds</span>
                </div>
              </div>
              <!-- Camions -->
              <div class="fleet-item">
                <div class="f-icon-box" style="background:#fef3c7; color:#b45309;">
                  <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
                <div class="f-content">
                  <span class="f-val">{{ kpis?.countCamions || 0 }}</span>
                  <span class="f-label">Camions & Semi</span>
                </div>
              </div>
              <!-- Voitures -->
              <div class="fleet-item">
                <div class="f-icon-box" style="background:#ecfdf5; color:#047857;">
                   <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H5a2 2 0 0 0-2 2v7h2m10 0a2.5 2.5 0 1 1-5 0m-5 0a2.5 2.5 0 1 1-5 0"></path></svg>
                </div>
                <div class="f-content">
                  <span class="f-val">{{ kpis?.countVoitures || 0 }}</span>
                  <span class="f-label">Véhicules Légers</span>
                </div>
              </div>
               <!-- Accessoires -->
               <div class="fleet-item">
                <div class="f-icon-box" style="background:#ffedd5; color:#c2410c;">
                  <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 4a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2V4zM4 11a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2v-1zM11 11a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2v-1z"></path></svg>
                </div>
                <div class="f-content">
                  <span class="f-val">{{ kpis?.countAccessoires || 0 }}</span>
                  <span class="f-label">Accessoires & Organes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Colonne Droite : Journal des Anomalies -->
        <div class="panel anomalies-panel">
          <div class="panel-header">
            <h2>Journal des Anomalies</h2>
          </div>
          <div class="panel-body">
            <div *ngIf="recentAnomalies.length === 0" class="state-empty">
              <svg width="32" height="32" fill="none" stroke="#cbd5e1" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p>Aucune anomalie en cours.</p>
            </div>
            
            <div class="log-list" *ngIf="recentAnomalies.length > 0">
               <div class="log-item" *ngFor="let ano of recentAnomalies">
                 <div class="log-dot" [ngClass]="ano.criticite === 'URGENTE' ? 'pulse-danger' : 'dot-warning'"></div>
                 <div class="log-text">
                   <div class="log-title">{{ ano.enginDeclare || (ano.engin?.matricule) }}</div>
                   <div class="log-desc">{{ ano.description }}</div>
                   <div class="log-meta">{{ ano.criticite }} — {{ ano.dateSignalement | date:'dd/MM HH:mm' }}</div>
                 </div>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper { padding: 32px; max-width: 1400px; margin: 0 auto; }
    .dash-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
    .dash-title { font-size: 1.85rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 6px; }
    .dash-subtitle { font-size: 0.95rem; color: #64748b; font-weight: 500; }
    .status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: #ecfdf5; color: #047857; border-radius: 20px; font-size: 0.82rem; font-weight: 600; border: 1px solid #d1fae5; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2); }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 32px; }
    .metric-card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; display: flex; flex-direction: column; transition: all 0.2s; }
    .metric-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .alert-border { border: 1px solid #ef4444; }
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .metric-title { font-size: 0.88rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-icon-bg { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .success-bg { background: #f0fdf4; }
    .primary-bg { background: #eff6ff; }
    .danger-bg { background: #fef2f2; }
    .metric-value { font-size: 2.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 8px; color: #0f172a; }
    .text-success { color: #059669; }
    .text-primary { color: #1d4ed8; }
    .metric-caption { font-size: 0.85rem; color: #64748b; font-weight: 500; }
    .bifurcated-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    .panel { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; }
    .panel-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; background: #fafafa; }
    .panel-header h2 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; }
    .panel-body { padding: 24px; flex: 1; }
    .fleet-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .fleet-item { display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 10px; }
    .f-icon-box { width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .f-val { font-size: 1.65rem; font-weight: 800; color: #0f172a; }
    .f-label { font-size: 0.85rem; font-weight: 500; color: #64748b; }
    .log-list { display: flex; flex-direction: column; }
    .log-item { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
    .log-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
    .pulse-danger { background: #ef4444; animation: pulse 2s infinite; }
    .dot-warning { background: #f59e0b; }
    .log-text { flex: 1; }
    .log-title { font-weight: 700; font-size: 0.95rem; color: #0f172a; }
    .log-desc { font-size: 0.88rem; color: #475569; margin: 2px 0; }
    .log-meta { font-size: 0.78rem; font-weight: 600; color: #94a3b8; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
  `]
})
export class DashboardComponent implements OnInit {
  kpis: any = {
    totalEngins: 0,
    enginsActifs: 0,
    countEngins: 0,
    countCamions: 0,
    countVoitures: 0,
    countAccessoires: 0,
    tauxDisponibilite: '0%',
    mttrHeures: '2.4 h'
  };
  recentAnomalies: Anomalie[] = [];

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.chargerKpis();
    this.recalculerInventaireFlotte();
    this.chargerAnomaliesRecentes();
  }

  chargerKpis(): void {
    this.api.getDashboardKpis().subscribe({
      next: (data: any) => {
        this.kpis = { ...this.kpis, ...data };
      }
    });
  }

  chargerAnomaliesRecentes(): void {
    this.api.getAnomalies().subscribe({
      next: (data: Anomalie[]) => {
        // On ne garde que les anomalies qui ne sont pas résolues
        this.recentAnomalies = data.filter(a => 
          a.statut !== 'RESOLUE' && a.statut !== 'CLOTUREE'
        ).slice(0, 5); // Max 5 pour le dashboard
      }
    });
  }

  recalculerInventaireFlotte(): void {
    this.api.getMateriels().subscribe({
      next: (materiels: Engin[]) => {
        const total = materiels.length;
        let cEngin = 0, cCamion = 0, cVoiture = 0, cAcc = 0;
        let actifs = 0;

        materiels.forEach(e => {
          const typeStr = (e.type || '').toLowerCase();
          let catStr = (e.categorie || '').toLowerCase();

          if (catStr === 'accessoire' || catStr === 'organe' || catStr === 'accessoire / organe') {
            catStr = 'accessoire / organe';
          }
          else if (typeStr.includes('brise roche') || typeStr.includes('brh') || typeStr.includes('organe') || typeStr.includes('accessoire') || typeStr.includes('godet') || typeStr.includes('marteau')) {
            catStr = 'accessoire / organe';
          }
          else if (!catStr && typeStr.includes('pelle')) {
            catStr = 'engin';
          }

          if (catStr === 'accessoire / organe') cAcc++;
          else if (catStr === 'camion') cCamion++;
          else if (catStr === 'voiture') cVoiture++;
          else if (catStr === 'engin') cEngin++;

          if (e.statut === 'ACTIF') actifs++;
        });

        this.kpis = {
          ...this.kpis,
          totalEngins: total,
          enginsActifs: actifs,
          countEngins: cEngin,
          countCamions: cCamion,
          countVoitures: cVoiture,
          countAccessoires: cAcc,
          tauxDisponibilite: total > 0 ? Math.round((actifs / total) * 100) + '%' : '100%'
        };
      }
    });
  }
}
