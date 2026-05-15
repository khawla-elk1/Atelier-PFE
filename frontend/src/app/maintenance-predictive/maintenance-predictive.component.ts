import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-maintenance-predictive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mp-container">

      <!-- ══════════ HEADER ══════════ -->
      <div class="mp-header">
        <div class="mp-header-left">
          <div class="mp-title-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
                    stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <h1 class="mp-title">Tour de Contrôle Prédictive</h1>
            <p class="mp-subtitle">Surveillance algorithmique · Vidange · Gasoil · Usure</p>
          </div>
        </div>
        <div class="mp-header-right">
          <!-- Compteurs de criticité -->
          <div class="mp-badge critical" *ngIf="criticalCount > 0">
            <span class="pulse-dot"></span> {{ criticalCount }} Critique{{ criticalCount > 1 ? 's' : '' }}
          </div>
          <div class="mp-badge high" *ngIf="highCount > 0">
            {{ highCount }} Urgente{{ highCount > 1 ? 's' : '' }}
          </div>
          <button class="mp-refresh-btn" (click)="loadPredictions()" [disabled]="loading" id="btn-refresh-predictions">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                 [style.animation]="loading ? 'spin 1s linear infinite' : 'none'">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    stroke-width="2" stroke-linecap="round"/>
            </svg>
            {{ loading ? 'Analyse...' : 'Actualiser' }}
          </button>
        </div>
      </div>

      <!-- ══════════ LOADING ══════════ -->
      <div class="mp-loading" *ngIf="loading">
        <div class="mp-spinner"></div>
        <p>Analyse algorithmique en cours…</p>
      </div>

      <!-- ══════════ EMPTY ══════════ -->
      <div class="mp-empty" *ngIf="!loading && filteredPredictions.length === 0">
        <svg width="48" height="48" fill="none" stroke="#10B981" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="1.5"/>
        </svg>
        <h3>Tous les engins sont en état optimal</h3>
        <p>Aucun engin ne nécessite d'intervention urgente.</p>
      </div>

      <!-- ══════════ FILTRES ══════════ -->
      <div class="mp-filters" *ngIf="!loading && predictions.length > 0">
        <button class="mp-filter-btn" [class.active]="filterPriority === ''"
                (click)="filterPriority = ''; applyFilter()">
          Tous ({{ predictions.length }})
        </button>
        <button class="mp-filter-btn critical" [class.active]="filterPriority === 'CRITICAL'"
                (click)="filterPriority = 'CRITICAL'; applyFilter()">
          🔴 Critique ({{ criticalCount }})
        </button>
        <button class="mp-filter-btn high" [class.active]="filterPriority === 'HIGH'"
                (click)="filterPriority = 'HIGH'; applyFilter()">
          🟠 Urgent ({{ highCount }})
        </button>
        <button class="mp-filter-btn normal" [class.active]="filterPriority === 'NORMAL'"
                (click)="filterPriority = 'NORMAL'; applyFilter()">
          🟢 Normal ({{ normalCount }})
        </button>
      </div>

      <!-- ══════════ GRILLE DES CARTES ══════════ -->
      <div class="mp-grid" *ngIf="!loading && filteredPredictions.length > 0">
        <div class="mp-card" *ngFor="let p of filteredPredictions"
             [class.card-critical]="p.priority === 'CRITICAL'"
             [class.card-high]="p.priority === 'HIGH'"
             [class.card-normal]="p.priority === 'NORMAL'">

          <!-- En-tête carte -->
          <div class="mp-card-header">
            <div class="mp-card-id">
              <span class="mp-code">{{ p.codeMateriel || p.matricule }}</span>
              <span class="mp-cat">{{ p.categorie || 'Engin' }}</span>
            </div>
            <span class="mp-priority-badge" [class]="'prio-' + (p.priority || 'NORMAL').toLowerCase()">
              {{ p.priority === 'CRITICAL' ? '🔴 CRITIQUE' : p.priority === 'HIGH' ? '🟠 URGENT' : '🟢 OK' }}
            </span>
          </div>

          <!-- Compteur & Usage -->
          <div class="mp-card-body">
            <div class="mp-metric">
              <div class="mp-metric-label">Heures production</div>
              <div class="mp-metric-value">
                {{ (p.heuresProductionCumulees || 0) | number:'1.0-0' }}
                <span class="mp-unit">h</span>
              </div>
            </div>
            <div class="mp-metric">
              <div class="mp-metric-label">Usage moyen / jour</div>
              <div class="mp-metric-value">
                {{ p.usageQuotidien | number:'1.1-1' }}
                <span class="mp-unit">{{ p.uniteCompteur || 'h' }}/j</span>
              </div>
            </div>
          </div>

          <!-- Bloc Vidange -->
          <div class="mp-vidange-block" [class]="'vb-' + (p.priority || 'NORMAL').toLowerCase()">
            <div class="mp-vidange-header">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                       stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Vidange</span>
              <span class="mp-status-tag" [class]="'st-' + (p.priority || 'NORMAL').toLowerCase()">
                {{ p.status === 'AUCUNE_HISTORIQUE' ? 'AUCUN HISTORIQUE' : p.status }}
              </span>
            </div>

            <!-- Barre de progression -->
            <div class="mp-progress-bar" *ngIf="p.status !== 'AUCUNE_HISTORIQUE'">
              <div class="mp-progress-fill"
                   [style.width.%]="getProgressPercent(p)"
                   [class]="'pf-' + (p.priority || 'NORMAL').toLowerCase()">
              </div>
            </div>

            <div class="mp-vidange-details">
              <div class="mp-vd-row" *ngIf="p.heuresRestantes > 0">
                <span>Reste</span>
                <strong>{{ p.heuresRestantes | number:'1.0-0' }} {{ p.uniteCompteur || 'h' }}</strong>
              </div>
              <div class="mp-vd-row danger" *ngIf="p.heuresRestantes <= 0 && p.status !== 'AUCUNE_HISTORIQUE'">
                <span>Dépassement</span>
                <strong>{{ (p.heuresRestantes * -1) | number:'1.0-0' }} {{ p.uniteCompteur || 'h' }}</strong>
              </div>
              <div class="mp-vd-row" *ngIf="p.dateEstimee">
                <span>Date estimée</span>
                <strong>{{ p.dateEstimee | date:'dd/MM/yyyy' }}</strong>
              </div>
              <div class="mp-vd-row" *ngIf="p.derniereVidangeDate">
                <span>Dernière vidange</span>
                <strong>{{ p.derniereVidangeDate | date:'dd/MM/yyyy' }}</strong>
              </div>
              <div class="mp-vd-row" *ngIf="p.frequenceVidange">
                <span>Fréquence</span>
                <strong>tous les {{ p.frequenceVidange | number:'1.0-0' }} {{ p.uniteCompteur || 'h' }}</strong>
              </div>
            </div>
          </div>

          <!-- Bloc Gasoil -->
          <div class="mp-gasoil-block" *ngIf="p.gasoilStatus && p.gasoilStatus !== 'INCONNU'">
            <div class="mp-gasoil-row">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                       stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span class="mp-gasoil-status" [class]="'gs-' + p.gasoilStatus.toLowerCase()">
                {{ getGasoilLabel(p.gasoilStatus) }}
              </span>
              <span class="mp-gasoil-val" *ngIf="p.consommationMoyenne > 0">
                {{ p.consommationMoyenne }} L/{{ p.uniteCompteur || 'h' }}
              </span>
            </div>
            <div class="mp-gasoil-alert" *ngIf="p.gasoilAlert">
              ⚠️ {{ p.gasoilAlert }}
            </div>
          </div>

          <!-- Recommandation -->
          <div class="mp-recommendation">
            {{ p.recommendation }}
          </div>

          <!-- Bouton action -->
          <button class="mp-action-btn"
                  [class.btn-danger-act]="p.priority === 'CRITICAL'"
                  [class.btn-warning-act]="p.priority === 'HIGH'"
                  [class.btn-ok-act]="p.priority === 'NORMAL'"
                  (click)="ouvrirModalVidange(p)"
                  [id]="'btn-vidange-' + p.idEngin">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                     stroke-width="2" stroke-linecap="round"/>
            </svg>
            {{ p.priority === 'CRITICAL' ? 'Effectuer la vidange MAINTENANT' : p.priority === 'HIGH' ? 'Planifier vidange' : 'Enregistrer vidange' }}
          </button>
        </div>
      </div>

      <!-- ══════════ MODAL SAISIE VIDANGE ══════════ -->
      <div class="mp-modal-overlay" *ngIf="showModal" (click)="fermerModal()">
        <div class="mp-modal" (click)="$event.stopPropagation()">
          <div class="mp-modal-header">
            <div class="mp-modal-title">
              <svg width="18" height="18" fill="none" stroke="#2563EB" viewBox="0 0 24 24">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                       stroke-width="2" stroke-linecap="round"/>
              </svg>
              Enregistrer une Vidange
            </div>
            <button class="mp-modal-close" (click)="fermerModal()">✕</button>
          </div>

          <div class="mp-modal-engin" *ngIf="selectedPrediction">
            <span class="mp-modal-code">{{ selectedPrediction.codeMateriel || selectedPrediction.matricule }}</span>
            <span class="mp-modal-cat">{{ selectedPrediction.categorie }}</span>
            <span class="mp-priority-badge" [class]="'prio-' + (selectedPrediction.priority || 'NORMAL').toLowerCase()" style="margin-left:auto;">
              {{ selectedPrediction.priority === 'CRITICAL' ? '🔴 CRITIQUE' : selectedPrediction.priority === 'HIGH' ? '🟠 URGENT' : '🟢 OK' }}
            </span>
          </div>

          <div class="mp-modal-body">
            <div class="mp-form-row">
              <div class="mp-form-group">
                <label>Date de la vidange *</label>
                <input type="date" [(ngModel)]="vidangeForm.dateVidange" class="mp-input" id="input-date-vidange"/>
              </div>
              <div class="mp-form-group">
                <label>Heures production <span class="mp-erp-badge">🔄 ERP</span></label>
                <div class="mp-input-with-unit">
                  <input type="number" [value]="vidangeForm.compteurEffectue" class="mp-input mp-input-readonly"
                         id="input-compteur-vidange" readonly/>
                  <span class="mp-input-unit">h</span>
                </div>
                <small class="mp-hint">Valeur cumulée automatiquement depuis l'ERP</small>
              </div>
            </div>
            <div class="mp-form-row">
              <div class="mp-form-group">
                <label>Type d'huile</label>
                <select [(ngModel)]="vidangeForm.typeHuile" class="mp-input" id="select-type-huile">
                  <option value="">-- Sélectionner --</option>
                  <option value="SAE 15W-40">SAE 15W-40 (Engin TP standard)</option>
                  <option value="SAE 10W-30">SAE 10W-30</option>
                  <option value="SAE 5W-30">SAE 5W-30</option>
                  <option value="Huile hydraulique">Huile hydraulique</option>
                  <option value="Huile boîte">Huile boîte de vitesses</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div class="mp-form-group">
                <label>Quantité (litres)</label>
                <input type="number" [(ngModel)]="vidangeForm.quantiteL" class="mp-input"
                       id="input-quantite-huile" placeholder="ex: 18"/>
              </div>
            </div>
            <div class="mp-form-group">
              <label>Prochain seuil de vidange</label>
              <div class="mp-input-with-unit">
                <input type="number" [(ngModel)]="vidangeForm.prochainSeuil" class="mp-input"
                       id="input-prochain-seuil"
                       [placeholder]="'Calculé auto : ' + getProchainSeuilAuto()"/>
                <span class="mp-input-unit">{{ selectedPrediction?.uniteCompteur || 'h' }}</span>
              </div>
              <small class="mp-hint">Laissez vide pour utiliser la fréquence standard
                ({{ selectedPrediction?.frequenceVidange | number:'1.0-0' }} {{ selectedPrediction?.uniteCompteur || 'h' }})
              </small>
            </div>
          </div>

          <div class="mp-modal-footer">
            <button class="mp-modal-cancel" (click)="fermerModal()">Annuler</button>
            <button class="mp-modal-save" (click)="enregistrerVidange()"
                    [disabled]="savingVidange"
                    id="btn-save-vidange">
              <span *ngIf="savingVidange" class="mp-spinner-sm"></span>
              {{ savingVidange ? 'Enregistrement...' : '✓ Enregistrer la vidange' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styleUrl: './maintenance-predictive.component.css'
})
export class MaintenancePredictiveComponent implements OnInit {
  predictions:         any[] = [];
  filteredPredictions: any[] = [];
  loading      = true;
  filterPriority = '';

  criticalCount = 0;
  highCount     = 0;
  normalCount   = 0;

  // Modal vidange
  showModal          = false;
  savingVidange      = false;
  selectedPrediction: any = null;
  vidangeForm = {
    dateVidange:      new Date().toISOString().split('T')[0],
    compteurEffectue: null as number | null,
    typeHuile:        'SAE 15W-40',
    quantiteL:        null as number | null,
    prochainSeuil:    null as number | null
  };

  constructor(private apiService: ApiService, private http: HttpClient) {}

  ngOnInit(): void { this.loadPredictions(); }

  loadPredictions(): void {
    this.loading = true;
    this.apiService.getPredictiveMaintenance().subscribe({
      next: (data: any[]) => {
        this.predictions = data;
        this.criticalCount = data.filter(p => p.priority === 'CRITICAL').length;
        this.highCount     = data.filter(p => p.priority === 'HIGH').length;
        this.normalCount   = data.filter(p => p.priority === 'NORMAL').length;
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    this.filteredPredictions = this.filterPriority
      ? this.predictions.filter(p => p.priority === this.filterPriority)
      : this.predictions;
  }

  // Calcule le % de la barre de progression (combien de la fréquence est déjà consommé)
  getProgressPercent(p: any): number {
    if (!p.frequenceVidange || p.frequenceVidange <= 0) return 0;
    const restant = p.heuresRestantes || 0;
    const consomme = p.frequenceVidange - restant;
    return Math.min(100, Math.max(0, Math.round((consomme / p.frequenceVidange) * 100)));
  }

  getGasoilLabel(status: string): string {
    const labels: Record<string, string> = {
      'OPTIMAL':                  '✅ Optimal',
      'NON_EVALUE':               '— Non évalué',
      'SURCONSOMMATION_LEGERE':   '⚠️ Surconsommation légère',
      'SURCONSOMMATION_CRITIQUE': '🔴 Surconsommation critique'
    };
    return labels[status] || status;
  }

  ouvrirModalVidange(prediction: any): void {
    this.selectedPrediction = prediction;
    this.vidangeForm = {
      dateVidange:      new Date().toISOString().split('T')[0],
      compteurEffectue: prediction.heuresProductionCumulees || null,
      typeHuile:        'SAE 15W-40',
      quantiteL:        null,
      prochainSeuil:    null
    };
    this.showModal = true;
  }

  fermerModal(): void { this.showModal = false; this.selectedPrediction = null; }

  getProchainSeuilAuto(): string {
    if (!this.selectedPrediction) return '—';
    const freq = this.selectedPrediction.frequenceVidange || 250;
    const compteur = this.vidangeForm.compteurEffectue || this.selectedPrediction.compteurActuel || 0;
    return (compteur + freq).toFixed(0);
  }

  enregistrerVidange(): void {
    if (!this.vidangeForm.compteurEffectue || !this.selectedPrediction) return;
    this.savingVidange = true;

    const payload = {
      engin:            { idEngin: this.selectedPrediction.idEngin },
      dateVidange:      this.vidangeForm.dateVidange,
      compteurEffectue: this.vidangeForm.compteurEffectue,
      typeHuile:        this.vidangeForm.typeHuile || null,
      quantiteL:        this.vidangeForm.quantiteL || null,
      prochainSeuil:    this.vidangeForm.prochainSeuil || null   // null = calculé auto par le backend
    };

    this.http.post('/api/vidanges', payload).subscribe({
      next: () => {
        this.savingVidange = false;
        this.fermerModal();
        this.loadPredictions(); // Recharge pour afficher le nouvel état
      },
      error: () => {
        this.savingVidange = false;
        alert('Erreur lors de l\'enregistrement de la vidange.');
      }
    });
  }
}
