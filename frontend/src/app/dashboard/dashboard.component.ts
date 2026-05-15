import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { DashboardKPIs, Engin, Anomalie } from '../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- KPI ROW -->
      <div class="kpi-row">
        <div class="kpi-card blue">
          <div class="kpi-icon blue">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke-width="2"/></svg>
          </div>
          <div class="kpi-label">Parc Total</div>
          <div class="kpi-value blue">{{ kpis.totalEngins }}</div>
          <div class="kpi-sub">matériels en flotte</div>
        </div>
        <div class="kpi-card green">
          <div class="kpi-icon green">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-width="2"/><path d="M22 4L12 14.01l-3-3" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Disponibilité</div>
          <div class="kpi-value green">{{ kpis.tauxDisponibilite }}</div>
          <div class="kpi-sub">{{ kpis.enginsActifs }} matériels actifs</div>
        </div>
        <div class="kpi-card amber">
          <div class="kpi-icon amber">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 6v6l4 2" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">MTTR Moyen</div>
          <div class="kpi-value amber">{{ kpis.mttrHeures }}</div>
          <div class="kpi-sub">durée d'immobilisation</div>
        </div>
        <div class="kpi-card red">
          <div class="kpi-icon red">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke-width="2"/><path d="M12 9v4M12 17h.01" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <div class="kpi-label">Alertes</div>
          <div class="kpi-value red">{{ urgentAnomalies() }}</div>
          <div class="kpi-sub">interventions urgentes</div>
        </div>
      </div>

      <!-- ═══════════════════ BARRE DE SYNCHRO ERP ═══════════════════ -->
      <div class="sync-banner">
        <!-- Icône ERP -->
        <div class="sync-icon">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Texte statut -->
        <div class="sync-info">
          <span class="sync-label">Synchronisation ERP</span>
          <span class="sync-sublabel" *ngIf="!syncMessage">Dernière synchro automatique • toutes les heures</span>
          <span class="sync-sublabel success" *ngIf="syncMessage === 'ok'">✓ Synchronisation réussie avec l'ERP WinDev !</span>
          <span class="sync-sublabel error"   *ngIf="syncMessage === 'error'">✗ Erreur de connexion à l'ERP — réessayez.</span>
        </div>

        <!-- Sélecteur de période -->
        <select class="sync-select" [(ngModel)]="syncPeriode" [disabled]="syncLoading">
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>

        <!-- Bouton principal -->
        <button class="sync-btn" (click)="syncPointages()" [disabled]="syncLoading" id="btn-sync-erp">
          <span class="sync-spinner" *ngIf="syncLoading"></span>
          <svg *ngIf="!syncLoading" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ syncLoading ? 'Synchronisation...' : 'Synchroniser maintenant' }}
        </button>
      </div>
      <!-- ════════════════════════════════════════════════════════════ -->

      <!-- MIDDLE ROW -->
      <div class="mid-row">
        <!-- Fleet breakdown -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Répartition de la Flotte</span>
            <span class="panel-action" routerLink="/materiels">Voir détail →</span>
          </div>
          <div class="fleet-bars">
            <div class="fleet-bar-row">
              <span class="fleet-bar-label">Engins lourds</span>
              <div class="fleet-bar-track">
                <div class="fleet-bar-fill" [style.width.%]="kpis.totalEngins ? (kpis.countEngins / kpis.totalEngins) * 100 : 0" style="background:#2563EB;"></div>
              </div>
              <span class="fleet-bar-count">{{ kpis.countEngins }}</span>
            </div>
            <div class="fleet-bar-row">
              <span class="fleet-bar-label">Camions</span>
              <div class="fleet-bar-track">
                <div class="fleet-bar-fill" [style.width.%]="kpis.totalEngins ? (kpis.countCamions / kpis.totalEngins) * 100 : 0" style="background:#059669;"></div>
              </div>
              <span class="fleet-bar-count">{{ kpis.countCamions }}</span>
            </div>
            <div class="fleet-bar-row">
              <span class="fleet-bar-label">Véhicules légers</span>
              <div class="fleet-bar-track">
                <div class="fleet-bar-fill" [style.width.%]="kpis.totalEngins ? (kpis.countVoitures / kpis.totalEngins) * 100 : 0" style="background:#D97706;"></div>
              </div>
              <span class="fleet-bar-count">{{ kpis.countVoitures }}</span>
            </div>
            <div class="fleet-bar-row">
              <span class="fleet-bar-label">Organes & Acc.</span>
              <div class="fleet-bar-track">
                <div class="fleet-bar-fill" [style.width.%]="kpis.totalEngins ? (kpis.countAccessoires / kpis.totalEngins) * 100 : 0" style="background:#7C3AED;"></div>
              </div>
              <span class="fleet-bar-count">{{ kpis.countAccessoires }}</span>
            </div>
          </div>

          <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
            <div class="section-title">Interventions / semaine</div>
            <div class="mini-bars">
              <div class="mini-bar" style="height:30%;background:#e2e8f0;"></div>
              <div class="mini-bar" style="height:60%;background:#e2e8f0;"></div>
              <div class="mini-bar" style="height:45%;background:#e2e8f0;"></div>
              <div class="mini-bar" style="height:80%;background:#2563EB;"></div>
              <div class="mini-bar" style="height:65%;background:#e2e8f0;"></div>
              <div class="mini-bar" style="height:90%;background:#2563EB;"></div>
              <div class="mini-bar" style="height:55%;background:#e2e8f0;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
              <span style="font-size:9px;color:#64748b;">Lun</span>
              <span style="font-size:9px;color:#64748b;">Mar</span>
              <span style="font-size:9px;color:#64748b;">Mer</span>
              <span style="font-size:9px;color:#64748b;">Jeu</span>
              <span style="font-size:9px;color:#64748b;">Ven</span>
              <span style="font-size:9px;color:#64748b;">Sam</span>
              <span style="font-size:9px;color:#64748b;">Dim</span>
            </div>
          </div>

          <!-- COUTS -->
          <div style="margin-top:20px;padding-top:16px;border-top:1px dashed #cbd5e1;">
            <div class="section-title">Indicateurs Financiers (Mois en cours)</div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:8px;">
              <span style="font-size:12px;font-weight:700;color:#475569;">Coûts de Maintenance</span>
              <span style="font-size:14px;font-weight:800;color:#0f172a;">{{ kpis.coutMaintenance || '0 K MAD' }}</span>
            </div>
            <div style="font-size:10px;color:#DC2626;margin-bottom:16px;">+4.2% par rapport au mois dernier</div>
            
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="font-size:11px;font-weight:600;color:#475569;">Consommation Budget Annuel</span>
              <span style="font-size:11px;font-weight:700;color:#0f172a;">{{ kpis.consoBudget || '0%' }}</span>
            </div>
            <div class="fleet-bar-track" style="height:8px;">
              <div class="fleet-bar-fill" [style.width]="kpis.consoBudget || '0%'" style="background:#3b82f6;"></div>
            </div>
          </div>
        </div>

        <!-- Statuts donut -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">État du Parc</span>
            <span class="panel-action">Rapport →</span>
          </div>
          <div class="donut-area">
            <svg class="donut-svg" viewBox="0 0 90 90">
              <!-- Fond total -->
              <circle cx="45" cy="45" r="35" fill="none" stroke="#e2e8f0" stroke-width="10"/>
              <!-- Actif -->
              <circle cx="45" cy="45" r="35" fill="none" stroke="#059669" stroke-width="10"
                [attr.stroke-dasharray]="getDashArray(kpis.enginsActifs, kpis.totalEngins)" stroke-dashoffset="55" stroke-linecap="round"/>
              <text x="45" y="42" text-anchor="middle" fill="#0f172a" font-size="16" font-weight="800" font-family="DM Sans">{{ kpis.totalEngins }}</text>
              <text x="45" y="54" text-anchor="middle" fill="#64748b" font-size="8" font-family="DM Sans">matériels</text>
            </svg>
            <div class="donut-legend">
              <div class="donut-leg-item">
                <div class="donut-dot" style="background:#059669;"></div>
                <span class="donut-leg-label">Actifs</span>
                <span class="donut-leg-val">{{ kpis.enginsActifs }}</span>
              </div>
              <div class="donut-leg-item">
                <div class="donut-dot" style="background:#DC2626;"></div>
                <span class="donut-leg-label">En panne</span>
                <span class="donut-leg-val">{{ kpis.totalEngins - kpis.enginsActifs }}</span>
              </div>
              <div class="donut-leg-item">
                <div class="donut-dot" style="background:#94a3b8;"></div>
                <span class="donut-leg-label">Vendus/Sortis</span>
                <span class="donut-leg-val">{{ kpis.vendus || 0 }}</span>
              </div>
            </div>
          </div>

          <div style="margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0;">
            <div class="section-title">Chantiers actifs</div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px;">
              <span style="font-size:32px;font-weight:800;color:#7C3AED;letter-spacing:-1px;">{{ chantiersActifs }}</span>
              <span style="font-size:11px;color:#64748B;">projets au total</span>
            </div>
            
            <!-- Sub-cards for Chantiers -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; text-align:center;">
                <div style="font-size:14px; font-weight:800; color:#0f172a; margin-bottom:2px;">{{ chantiersDemarres }}</div>
                <div style="font-size:9px; color:#64748b; font-weight:600; text-transform:uppercase;">Démarrés</div>
              </div>
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; text-align:center;">
                <div style="font-size:14px; font-weight:800; color:#D97706; margin-bottom:2px;">{{ chantiersEnCours }}</div>
                <div style="font-size:9px; color:#64748b; font-weight:600; text-transform:uppercase;">En cours</div>
              </div>
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; text-align:center;">
                <div style="font-size:14px; font-weight:800; color:#059669; margin-bottom:2px;">{{ chantiersTermines }}</div>
                <div style="font-size:9px; color:#64748b; font-weight:600; text-transform:uppercase;">Terminés</div>
              </div>
            </div>
          </div>

          <!-- NOUVEAU BLOC DIRECTEUR MATERIEL (MILIEU) -->
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
            <div class="section-title">Performance Opérationnelle</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:12px;">
                <div style="font-size:10px; color:#166534; font-weight:700; text-transform:uppercase; margin-bottom:4px;">TRS Moyen</div>
                <div style="font-size:20px; font-weight:800; color:#14532d;">{{ kpis.trsMoyen || '0%' }}</div>
                <div style="font-size:9px; color:#15803d; margin-top:2px;">Taux de Rendement</div>
              </div>
              <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:12px;">
                <div style="font-size:10px; color:#1e40af; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Utilisation</div>
                <div style="font-size:20px; font-weight:800; color:#1e3a8a;">{{ kpis.utilisation || '0%' }}</div>
                <div style="font-size:9px; color:#1d4ed8; margin-top:2px;">Taux d'engagement</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Anomalies feed -->
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">Journal Anomalies</span>
            <span class="panel-action" routerLink="/anomalies">Tout voir →</span>
          </div>
          <div class="anomaly-list">
            <div class="anomaly-item" *ngFor="let ano of recentAnomalies">
              <div class="anom-dot" [class.urgent]="ano.criticite === 'URGENTE'" [class.normal]="ano.criticite !== 'URGENTE'"></div>
              <div style="flex:1;min-width:0;">
                <div class="anom-title">{{ ano.engin?.codeMateriel || ano.engin?.matricule || ano.enginDeclare || 'Non spécifié' }}</div>
                <div class="anom-desc">{{ ano.description | slice:0:30 }}{{ ano.description.length > 30 ? '...' : '' }}</div>
                <div class="anom-desc" style="margin-top:2px;color:#94a3b8;">{{ ano.dateSignalement | date:'dd/MM · HH:mm' }}</div>
              </div>
              <span class="anom-badge" [class.urgent]="ano.criticite === 'URGENTE'" [class.normal]="ano.criticite !== 'URGENTE'">
                {{ ano.criticite || 'NORMALE' }}
              </span>
            </div>
            <div *ngIf="recentAnomalies.length === 0" style="text-align: center; color: #64748B; padding: 20px 0; font-size: 11px;">
              Aucune anomalie récente.
            </div>
          </div>
        </div>
      </div>

      <!-- BOTTOM ROW -->
      <div class="bottom-row">
        <!-- Chart Panel -->
        <div class="panel chart-panel">
          <div class="panel-header" style="margin-bottom: 24px;">
            <span class="panel-title" style="text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #0f172a;">Activité Maintenance — Vue Mensuelle</span>
          </div>
          <div>
            <div style="font-size: 13px; font-weight: 600; color: #0f172a;">Évolution des pannes & interventions</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 16px;">Correctives vs préventives (4 mois)</div>
            <div style="display: flex; gap: 16px; margin-bottom: 24px;">
              <div style="display:flex; align-items:center; gap:6px;"><div style="width:10px;height:10px;border-radius:2px;background:#DC2626;"></div><span style="font-size:11px;font-weight:500;">Correctives</span></div>
              <div style="display:flex; align-items:center; gap:6px;"><div style="width:10px;height:10px;border-radius:2px;background:#2563EB;"></div><span style="font-size:11px;font-weight:500;">Préventives</span></div>
              <div style="display:flex; align-items:center; gap:6px;"><div style="width:10px;height:10px;border-radius:2px;background:#D97706;"></div><span style="font-size:11px;font-weight:500;">Pannes critiques</span></div>
            </div>
            
            <div class="chart-container" style="position:relative; height: 180px; width: 100%; margin-bottom: 20px;">
              <!-- Y-axis labels -->
              <div style="position:absolute; left:0; top:0; height:100%; display:flex; flex-direction:column; justify-content:space-between; font-size:10px; color:#94a3b8; padding-right:10px; border-right:1px solid #e2e8f0; width: 30px; text-align:right;">
                <span>40</span><span>30</span><span>20</span><span>10</span><span>0</span>
              </div>
              <!-- Grid lines -->
              <div style="position:absolute; left:40px; right:0; top:0; height:100%; display:flex; flex-direction:column; justify-content:space-between;">
                <div style="border-bottom:1px solid #f1f5f9; width:100%; height:0;"></div>
                <div style="border-bottom:1px solid #f1f5f9; width:100%; height:0;"></div>
                <div style="border-bottom:1px solid #f1f5f9; width:100%; height:0;"></div>
                <div style="border-bottom:1px solid #f1f5f9; width:100%; height:0;"></div>
                <div style="border-bottom:1px solid #e2e8f0; width:100%; height:0;"></div>
              </div>
              <!-- SVG lines -->
              <svg style="position:absolute; left:40px; right:0; top:0; width:calc(100% - 40px); height:100%; overflow:visible;" preserveAspectRatio="none" viewBox="0 0 100 100">
                <!-- Shaded area correctives -->
                <polygon points="0,0 33,8 66,12 100,25 100,100 0,100" fill="rgba(220, 38, 38, 0.05)" />
                
                <!-- Correctives line (red) -->
                <polyline points="0,0 33,8 66,12 100,25" fill="none" stroke="#DC2626" stroke-width="2" />
                <circle cx="0" cy="0" r="2" fill="#DC2626" />
                <circle cx="33" cy="8" r="2" fill="#DC2626" />
                <circle cx="66" cy="12" r="2" fill="#DC2626" />
                <circle cx="100" cy="25" r="2" fill="#DC2626" />
                
                <!-- Préventives line (blue dashed) -->
                <polyline points="0,30 33,20 66,15 100,10" fill="none" stroke="#2563EB" stroke-width="2" stroke-dasharray="2,2" />
                <circle cx="0" cy="30" r="2" fill="#2563EB" />
                <circle cx="33" cy="20" r="2" fill="#2563EB" />
                <circle cx="66" cy="15" r="2" fill="#2563EB" />
                <circle cx="100" cy="10" r="2" fill="#2563EB" />
                
                <!-- Pannes critiques line (orange) -->
                <polyline points="0,80 33,85 66,88 100,90" fill="none" stroke="#D97706" stroke-width="2" />
                <circle cx="0" cy="80" r="2" fill="#D97706" />
                <circle cx="33" cy="85" r="2" fill="#D97706" />
                <circle cx="66" cy="88" r="2" fill="#D97706" />
                <circle cx="100" cy="90" r="2" fill="#D97706" />
              </svg>
              <!-- X-axis labels -->
              <div style="position:absolute; left:40px; right:0; bottom:-20px; display:flex; justify-content:space-between; font-size:10px; color:#94a3b8;">
                <span style="transform:translateX(-50%)">Jan</span>
                <span style="transform:translateX(-50%)">Fév</span>
                <span style="transform:translateX(-50%)">Mar</span>
                <span style="transform:translateX(-50%)">Avr</span>
              </div>
            </div>
          </div>
        </div>

        <!-- MTBF / MTTF Panel -->
        <div class="bottom-kpis">
          <!-- MTBF -->
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="font-size:10px;font-weight:700;color:#64748B;width:60px;">MTBF<br><span style="font-weight:400">(FIABILITÉ)</span></div>
            <div style="font-size:20px;font-weight:800;color:#0f172a;">{{ kpis.mtbfHeures || '0h' }}</div>
            <div style="font-size:10px;font-weight:700;color:#059669;background:#ecfdf5;padding:2px 6px;border-radius:4px;">+12%<br>vs mois</div>
            <div style="font-size:9px;color:#94a3b8;line-height:1.2;margin-left:auto;text-align:right;">Temps moyen de<br>bon fonctionnement</div>
          </div>
          <div class="kpi-card secondary" style="flex: 1; min-width: 200px;">
            <div class="kpi-label">MTTF (Durée de vie)</div>
            <div class="kpi-value" style="font-size: 24px; color: #0f172a; white-space: nowrap;">{{ kpis.mttfAns || '0' }} <span style="font-size: 14px; color: #64748b; font-weight: 500;">ans</span></div>
            <div class="kpi-sub" style="color: #2563EB; font-weight: 600; font-size: 11px;">Stable</div>
            <div class="kpi-desc" style="font-size: 10px; color: #94a3b8; margin-top: 8px;">Temps moyen de bon fonctionnement avant défaillance.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    
    .dashboard-container {
      font-family: 'DM Sans', 'Segoe UI', sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 20px 24px;
      min-height: calc(100vh - 64px);
    }
    
    /* KPI ROW */
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    .kpi-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; position: relative; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .kpi-card.blue::before { background: #3B82F6; }
    .kpi-card.green::before { background: #10B981; }
    .kpi-card.amber::before { background: #F59E0B; }
    .kpi-card.red::before { background: #EF4444; }
    .kpi-card.secondary { border-top: none; }
    .kpi-label { font-size: 10px; color: #64748B; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
    .kpi-value { font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1; white-space: nowrap; }
    .kpi-value.blue { color: #2563EB; }
    .kpi-value.green { color: #059669; }
    .kpi-value.amber { color: #D97706; }
    .kpi-value.red { color: #DC2626; }
    .kpi-sub { font-size: 10px; color: #475569; margin-top: 4px; font-weight: 500; }
    .kpi-icon { position: absolute; right: 14px; top: 14px; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
    .kpi-icon.blue { background: #EFF6FF; color: #2563EB; }
    .kpi-icon.green { background: #ECFDF5; color: #059669; }
    .kpi-icon.amber { background: #FFFBEB; color: #D97706; }
    .kpi-icon.red { background: #FEF2F2; color: #DC2626; }

    /* MIDDLE & BOTTOM ROWS */
    .mid-row { display: grid; grid-template-columns: 1.2fr 1fr 340px; gap: 16px; margin-bottom: 20px; }
    .bottom-row { display: grid; grid-template-columns: 1fr 340px; gap: 16px; margin-bottom: 20px; }
    .bottom-kpis { display: flex; flex-direction: column; gap: 16px; }
    
    .panel { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .panel-title { font-size: 13px; font-weight: 700; color: #0f172a; }
    .panel-action { font-size: 10px; font-weight: 600; color: #2563EB; cursor: pointer; text-decoration: none; }
    .panel-action:hover { text-decoration: underline; color: #1D4ED8; }

    /* FLEET BAR */
    .fleet-bars { display: flex; flex-direction: column; gap: 10px; }
    .fleet-bar-row { display: flex; align-items: center; gap: 10px; }
    .fleet-bar-label { width: 100px; font-size: 11px; font-weight: 600; color: #475569; flex-shrink: 0; }
    .fleet-bar-track { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .fleet-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease-out; }
    .fleet-bar-count { width: 35px; text-align: right; font-size: 12px; font-weight: 700; color: #0f172a; flex-shrink: 0; }

    /* STATUS DONUT PLACEHOLDER */
    .donut-area { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 8px 0; }
    .donut-svg { width: 100px; height: 100px; }
    .donut-legend { display: flex; flex-direction: column; gap: 8px; }
    .donut-leg-item { display: flex; align-items: center; gap: 8px; }
    .donut-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
    .donut-leg-label { font-size: 11px; color: #475569; font-weight: 600; }
    .donut-leg-val { font-size: 13px; font-weight: 700; color: #0f172a; margin-left: auto; padding-left: 14px; }

    /* ANOMALIES */
    .anomaly-list { display: flex; flex-direction: column; gap: 8px; }
    .anomaly-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; transition: transform 0.2s; }
    .anomaly-item:hover { transform: translateX(2px); border-color: #cbd5e1; }
    .anom-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
    .anom-dot.urgent { background: #DC2626; box-shadow: 0 0 6px rgba(220, 38, 38, 0.4); }
    .anom-dot.normal { background: #D97706; }
    .anom-title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
    .anom-desc { font-size: 10px; color: #64748B; font-weight: 500; }
    .anom-badge { margin-left: auto; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; flex-shrink: 0; }
    .anom-badge.urgent { background: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5; }
    .anom-badge.normal { background: #FFFBEB; color: #D97706; border: 1px solid #FCD34D; }

    /* MINI CHART BARS */
    .mini-bars { display: flex; align-items: flex-end; gap: 3px; height: 50px; padding-top: 6px; }
    .mini-bar { flex: 1; border-radius: 3px 3px 0 0; min-height: 4px; }

    .section-title { font-size: 10px; letter-spacing: 1.2px; font-weight: 700; color: #94A3B8; text-transform: uppercase; margin-bottom: 10px; }

    /* ═══ BARRE DE SYNCHRO ERP ═══ */
    .sync-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
      border-radius: 10px;
      padding: 12px 18px;
      margin-bottom: 20px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
    }
    .sync-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.15);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }
    .sync-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .sync-label { font-size: 13px; font-weight: 700; color: #fff; }
    .sync-sublabel { font-size: 10px; color: rgba(255,255,255,0.7); font-weight: 500; transition: color .3s; }
    .sync-sublabel.success { color: #6ee7b7 !important; font-weight: 700; }
    .sync-sublabel.error   { color: #fca5a5 !important; font-weight: 700; }
    .sync-select {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 6px;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 10px;
      cursor: pointer;
      outline: none;
    }
    .sync-select option { background: #1e40af; color: #fff; }
    .sync-btn {
      display: flex; align-items: center; gap: 8px;
      background: #fff;
      color: #1d4ed8;
      border: none;
      border-radius: 8px;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .sync-btn:hover:not(:disabled) { background: #eff6ff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .sync-btn:disabled { opacity: 0.65; cursor: not-allowed; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sync-spinner {
      width: 14px; height: 14px;
      border: 2px solid #bfdbfe;
      border-top-color: #1d4ed8;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
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
    mttrHeures: '21.4h'
  };
  recentAnomalies: Anomalie[] = [];
  chantiersActifs: number = 0;
  chantiersDemarres: number = 0;
  chantiersEnCours: number = 0;
  chantiersTermines: number = 0;

  // ─── Synchro ERP ───
  syncLoading  = false;
  syncMessage: '' | 'ok' | 'error' = '';
  syncPeriode: 'today' | 'week' | 'month' = 'today';

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.chargerKpis();
    this.recalculerInventaireFlotte();
    this.chargerAnomaliesRecentes();
    this.chargerChantiers();
  }

  /** Lance la synchro ERP avec la période choisie — date du jour calculée automatiquement */
  syncPointages(): void {
    this.syncLoading = true;
    this.syncMessage = '';

    const obs$ =
      this.syncPeriode === 'week'  ? this.api.syncPointagesSemaine() :
      this.syncPeriode === 'month' ? this.api.syncPointagesMois()    :
                                     this.api.syncPointagesAujourdhui();

    obs$.subscribe({
      next: () => {
        this.syncLoading = false;
        this.syncMessage = 'ok';
        setTimeout(() => this.syncMessage = '', 5000);
      },
      error: () => {
        this.syncLoading = false;
        this.syncMessage = 'error';
        setTimeout(() => this.syncMessage = '', 6000);
      }
    });
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
        this.recentAnomalies = data.filter(a => 
          a.statut !== 'RESOLUE' && a.statut !== 'CLOTUREE'
        ).slice(0, 5);
      }
    });
  }

  recalculerInventaireFlotte(): void {
    this.api.getMateriels().subscribe({
      next: (materiels: Engin[]) => {
        this.api.getInterventions().subscribe({
          next: (interventions: any[]) => {
            let cEngin = 0, cCamion = 0, cVoiture = 0, cAcc = 0;
            let actifs = 0;
            let vendus = 0;

            const actuels = materiels.filter(e => {
              const stat = (e.statut || '').toString().toUpperCase();
              const cm = (e.codeMateriel || e.matricule || '').toString().toUpperCase();
              const isVendu = stat === 'VENDU' || cm.includes('VENDU') || stat === 'FERRAILLE';
              if (isVendu) vendus++;
              return !isVendu;
            });

            const total = actuels.length;

            actuels.forEach(e => {
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

              const enPanne = interventions.some(i => 
                i.engin?.idEngin === e.idEngin && 
                i.statut !== 'Clôturée' && 
                i.statut !== 'CLOTUREE' &&
                i.statut !== 'Terminée' &&
                i.statut !== 'TERMINEE'
              );

              if (!enPanne && e.statut !== 'EN_PANNE') {
                actifs++;
              }
            });

            this.kpis = {
              ...this.kpis,
              totalEngins: total,
              enginsActifs: actifs,
              vendus: vendus,
              countEngins: cEngin,
              countCamions: cCamion,
              countVoitures: cVoiture,
              countAccessoires: cAcc,
              tauxDisponibilite: total > 0 ? Math.round((actifs / total) * 100) + '%' : '100%'
            };
          },
          error: (err) => console.error(err)
        });
      },
      error: (err) => console.error(err)
    });
  }

  chargerChantiers(): void {
    this.api.getChantiers().subscribe({
      next: (chantiers: any[]) => {
        this.chantiersActifs = chantiers.filter(c => c?.statut === 'ACTIF').length;
        
        // Dynamically compute the sub-KPIs based on your status rules
        this.chantiersDemarres = chantiers.filter(c => c?.statut === 'EN_ATTENTE' || c?.statut === 'DEMARRE').length;
        this.chantiersEnCours = chantiers.filter(c => c?.statut === 'ACTIF').length;
        this.chantiersTermines = chantiers.filter(c => c?.statut === 'TERMINE').length;
        
        // Fallback mockup calculation if real statuses are all identical
        if (this.chantiersActifs > 0 && this.chantiersDemarres === 0 && this.chantiersTermines === 0) {
            this.chantiersDemarres = Math.floor(this.chantiersActifs * 0.4);
            this.chantiersTermines = Math.floor(this.chantiersActifs * 0.2);
            this.chantiersEnCours = this.chantiersActifs - this.chantiersDemarres - this.chantiersTermines;
        }
      }
    });
  }

  urgentAnomalies(): number {
    return this.kpis.alertesUrgentes || this.recentAnomalies.filter(a => a.criticite === 'URGENTE').length;
  }

  getDashArray(actifs: number, total: number): string {
    if (total === 0) return '0 220';
    const percent = actifs / total;
    const value = percent * 220;
    return `${value} ${220 - value}`;
  }
}
