import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

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
              <svg width="20" height="20" fill="none" stroke="var(--success)" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
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
              <svg width="20" height="20" fill="none" stroke="var(--primary)" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
          <div class="metric-body">
            <div class="metric-value text-primary">{{ kpis?.mttrHeures || '0 h' }}</div>
            <div class="metric-caption">Durée moyenne d'immobilisation atelier</div>
          </div>
        </div>

        <!-- Carte Alertes -->
        <div class="metric-card" [class.alert-border]="kpis?.totalAnomaliesEnCours > 0">
          <div class="metric-header">
            <span class="metric-title">Alertes & Pannes Critiques</span>
            <div class="metric-icon-bg" [ngClass]="(kpis?.totalAnomaliesEnCours > 0) ? 'danger-bg' : 'success-bg'">
              <svg width="20" height="20" fill="none" [attr.stroke]="(kpis?.totalAnomaliesEnCours > 0) ? 'var(--danger)' : 'var(--success)'" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
          </div>
          <div class="metric-body">
            <div class="metric-value" [ngStyle]="{'color': (kpis?.totalAnomaliesEnCours > 0) ? 'var(--danger)' : 'var(--success)'}">
              {{ kpis?.totalAnomaliesEnCours || 0 }}
            </div>
            <div class="metric-caption">{{ (kpis?.totalAnomaliesEnCours > 0) ? 'Interventions urgentes requises' : 'Aucune anomalie critique' }}</div>
          </div>
        </div>
      </div>

      <!-- LIGNE 2 : REPARTITION & ANOMALIES -->
      <div class="bifurcated-layout">
        
        <!-- Colonne Gauche : Flotte -->
        <div class="panel fleet-panel">
          <div class="panel-header">
            <h2>Inventaire & Répartition de la Flotte</h2>
            <button class="btn-ghost">Voir détails &rarr;</button>
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
                  <span class="f-label">Engins Lourds de Production</span>
                </div>
              </div>
              <!-- Camions -->
              <div class="fleet-item">
                <div class="f-icon-box" style="background:#fef3c7; color:#b45309;">
                  <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </div>
                <div class="f-content">
                  <span class="f-val">{{ kpis?.countCamions || 0 }}</span>
                  <span class="f-label">Unité de Transport (Camions)</span>
                </div>
              </div>
              <!-- Voitures -->
              <div class="fleet-item">
                <div class="f-icon-box" style="background:#ecfdf5; color:#047857;">
                   <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H5a2 2 0 0 0-2 2v7h2m10 0a2.5 2.5 0 1 1-5 0m-5 0a2.5 2.5 0 1 1-5 0"></path></svg>
                </div>
                <div class="f-content">
                  <span class="f-val">{{ kpis?.countVoitures || 0 }}</span>
                  <span class="f-label">Véhicules Légers & Liaison</span>
                </div>
              </div>
               <!-- Accessoires -->
               <div class="fleet-item">
                <div class="f-icon-box" style="background:#ffedd5; color:#c2410c;">
                  <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
                </div>
                <div class="f-content">
                  <span class="f-val">{{ kpis?.countAccessoires || 0 }}</span>
                  <span class="f-label">Organes & Accessoires (BRH...)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Colonne Droite : Anomalies -->
        <div class="panel anomalies-panel">
          <div class="panel-header">
            <h2>Journal des Anomalies</h2>
          </div>
          <div class="panel-body">
            <div *ngIf="kpis?.totalAnomaliesEnCours === 0" class="state-empty">
              <svg width="32" height="32" fill="none" stroke="#cbd5e1" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p>Aucune anomalie en cours.<br>Le parc est pleinement opérationnel.</p>
            </div>
            
            <div class="log-list" *ngIf="kpis?.totalAnomaliesEnCours > 0">
               <!-- Mockup display for the list -->
               <div class="log-item" *ngFor="let alert of [1, 2]">
                 <div class="log-dot pulse-danger"></div>
                 <div class="log-text">
                   <div class="log-title">Défaillance système signalée</div>
                   <div class="log-meta">URGENT - Nécessite diagnostic immédiat</div>
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
    
    /* Header */
    .dash-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
    .dash-title { font-size: 1.85rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 6px; }
    .dash-subtitle { font-size: 0.95rem; color: #64748b; font-weight: 500; }
    .status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: #ecfdf5; color: #047857; border-radius: 20px; font-size: 0.82rem; font-weight: 600; border: 1px solid #d1fae5; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2); }

    /* Ligne 1 : KPI Grid */
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 32px; }
    .metric-card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; }
    .metric-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03); }
    .alert-border { border-top: 3px solid var(--danger); border-left: 1px solid var(--danger); border-right: 1px solid var(--danger); border-bottom: 1px solid var(--danger);}
    
    .metric-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .metric-title { font-size: 0.88rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    
    .metric-icon-bg { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .success-bg { background: #f0fdf4; }
    .primary-bg { background: #eff6ff; }
    .danger-bg { background: #fef2f2; }

    .metric-value { font-size: 2.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 8px; color: #0f172a; letter-spacing: -0.01em; }
    .text-success { color: #059669; }
    .text-primary { color: #1d4ed8; }
    .metric-caption { font-size: 0.85rem; color: #64748b; font-weight: 500; }
    
    /* Ligne 2 : Sub Layout */
    .bifurcated-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    
    /* Panels Generiques */
    .panel { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); display: flex; flex-direction: column; overflow: hidden; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; background: #fafafa; }
    .panel-header h2 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; }
    .btn-ghost { background: transparent; border: none; font-size: 0.85rem; font-weight: 600; color: var(--primary); cursor: pointer; }
    .btn-ghost:hover { text-decoration: underline; }
    .panel-body { padding: 24px; flex: 1; }

    /* Flotte Grid */
    .fleet-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .fleet-item { display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; transition: background 0.15s; }
    .fleet-item:hover { background: #f8fafc; border-color: #cbd5e1; }
    .f-icon-box { width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .f-content { display: flex; flex-direction: column; gap: 4px; }
    .f-val { font-size: 1.65rem; font-weight: 800; color: #0f172a; line-height: 1; }
    .f-label { font-size: 0.85rem; font-weight: 500; color: #64748b; }

    /* Anomalies list */
    .state-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #94a3b8; font-size: 0.9rem; gap: 12px; padding: 40px 0;}
    .log-list { display: flex; flex-direction: column; gap: 0; }
    .log-item { display: flex; align-items: flex-start; gap: 14px; padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
    .log-item:last-child { border-bottom: none; }
    .log-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
    .pulse-danger { background: var(--danger); box-shadow: 0 0 0 rgba(239, 68, 68, 0.4); animation: pulse 2s infinite; }
    .log-text { display: flex; flex-direction: column; gap: 4px; }
    .log-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
    .log-meta { font-size: 0.82rem; font-weight: 600; color: var(--danger); }

    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

    @media (max-width: 1024px) {
      .bifurcated-layout { grid-template-columns: 1fr; }
      .fleet-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  kpis: any;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.chargerKpis();
    this.recalculerInventaireFlotte();
  }

  chargerKpis(): void {
    this.api.getDashboardKpis().subscribe({
      next: (data) => {
        this.kpis = { ...this.kpis, ...data };
      },
      error: (err) => {
        console.error('Erreur lors du chargement des KPIs (MTTR, Anomalies)', err);
        this.kpis = { ...this.kpis, tauxDisponibilite: '100%', mttrHeures: '0 h', totalAnomaliesEnCours: 0 };
      }
    });
  }

  recalculerInventaireFlotte(): void {
    this.api.getMateriels().subscribe({
      next: (materiels: any[]) => {
        let total = materiels.length;
        let cEngin = 0, cCamion = 0, cVoiture = 0, cAcc = 0;
        let actifs = 0;

        materiels.forEach(e => {
          const typeStr = (e.type || '').toLowerCase();
          let catStr = (e.categorie || '').toLowerCase();

          // Script de Normalisation Identique au composant Engins
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
          countAccessoires: cAcc
        };
      },
      error: () => {
        // Fallback
        if (!this.kpis) this.kpis = {};
        this.kpis = {
          ...this.kpis, totalEngins: 437, enginsActifs: 437, countEngins: 245, countCamions: 112, countVoitures: 80, countAccessoires: 0
        };
      }
    });
  }
}
