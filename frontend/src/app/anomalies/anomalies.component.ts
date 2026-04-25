import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-anomalies',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="enterprise-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestion des Anomalies</h1>
          <p class="page-subtitle">Suivi des signalements et génération des ordres de travail</p>
        </div>
        <button class="btn-primary" (click)="toggleForm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nouveau Signalement
        </button>
      </div>

      <!-- KPI Metrics (Sober Enterprise Look) -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-title">À traiter</div>
          <div class="metric-value text-warning">{{ countATraiter }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Urgentes</div>
          <div class="metric-value text-danger">{{ countUrgentes }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Résolues</div>
          <div class="metric-value text-success">{{ countResolues }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Total</div>
          <div class="metric-value text-primary">{{ anomalies.length }}</div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-card">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th width="80">Réf.</th>
              <th width="200">Matériel / Véhicule</th>
              <th>Description</th>
              <th width="150">Date</th>
              <th width="120">Criticité</th>
              <th width="120">Statut</th>
              <th width="160" class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ano of anomalies">
              <td><span class="ref-text">#{{ ano.idAnomalie | number:'3.0-0' }}</span></td>
              <td>
                <div class="engin-name">{{ ano.engin ? (ano.engin.codeMateriel || ano.engin.matricule) : (ano.enginDeclare || 'Non assigné') }}</div>
                <div class="engin-sub" *ngIf="ano.engin">{{ ano.engin.marque }} {{ ano.engin.modele }}</div>
              </td>
              <td class="desc-text" [title]="ano.description">{{ ano.description }}</td>
              <td class="date-text">{{ ano.dateSignalement | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <span class="badge" 
                      [class.badge-danger]="ano.criticite === 'URGENTE'"
                      [class.badge-warning]="ano.criticite === 'NORMALE'"
                      [class.badge-info]="ano.criticite === 'PLANIFIEE'">
                  {{ ano.criticite }}
                </span>
              </td>
              <td>
                <span class="badge" 
                      [class.badge-primary]="isATraiter(ano.statut)"
                      [class.badge-success]="isResolu(ano.statut)">
                  {{ ano.statut }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="btn-action btn-action-primary" 
                        *ngIf="isATraiter(ano.statut)" 
                        (click)="creerIntervention(ano)" 
                        title="Créer une intervention corrective">
                  Créer OT
                </button>
                <button class="btn-action btn-action-disabled" 
                        *ngIf="!isATraiter(ano.statut)" 
                        disabled>
                  En cours
                </button>
                <button class="btn-icon btn-icon-danger" 
                        (click)="supprimerAnomalie(ano)" 
                        title="Supprimer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </td>
            </tr>
            <tr *ngIf="anomalies.length === 0">
              <td colspan="7" class="empty-state">Aucune donnée trouvée.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Form -->
      <div class="modal-backdrop" *ngIf="showForm" (click)="toggleForm()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Nouveau Signalement</h2>
            <button class="btn-close" (click)="toggleForm()">×</button>
          </div>
          <form [formGroup]="anomalieForm" (ngSubmit)="soumettreAnomalie()">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Matériel concerné <span class="required">*</span></label>
                  <select formControlName="engin" class="form-control">
                    <option value="">Sélectionnez un équipement...</option>
                    <option *ngFor="let e of listeEngins" [value]="e.matricule || e.codeMateriel">
                      {{ e.codeMateriel || e.matricule }} - {{ e.marque }} {{ e.modele }}
                    </option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label>Criticité <span class="required">*</span></label>
                  <select formControlName="criticite" class="form-control">
                    <option value="NORMALE">Normale</option>
                    <option value="PLANIFIEE">Planifiée</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Description détaillée <span class="required">*</span></label>
                <textarea formControlName="description" class="form-control" rows="4" placeholder="Décrivez le problème constaté..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="toggleForm()">Annuler</button>
              <button type="submit" class="btn-primary" [disabled]="anomalieForm.invalid">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .enterprise-container { padding: 32px; background-color: #f8fafc; min-height: 100vh; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; }
    
    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
    .page-title { font-size: 1.5rem; font-weight: 600; color: #0f172a; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
    
    /* Buttons */
    .btn-primary { display: flex; align-items: center; gap: 8px; background-color: #2563eb; color: white; border: none; padding: 8px 16px; font-size: 0.875rem; font-weight: 500; border-radius: 6px; cursor: pointer; transition: background-color 0.15s; }
    .btn-primary:hover { background-color: #1d4ed8; }
    .btn-primary:disabled { background-color: #94a3b8; cursor: not-allowed; }
    .btn-secondary { background-color: #ffffff; color: #334155; border: 1px solid #cbd5e1; padding: 8px 16px; font-size: 0.875rem; font-weight: 500; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
    .btn-secondary:hover { background-color: #f1f5f9; border-color: #94a3b8; }
    
    /* Metrics */
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .metric-title { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .metric-value { font-size: 1.5rem; font-weight: 700; }
    .text-warning { color: #d97706; }
    .text-danger { color: #dc2626; }
    .text-success { color: #059669; }
    .text-primary { color: #2563eb; }

    /* Table */
    .table-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .enterprise-table { width: 100%; border-collapse: collapse; text-align: left; }
    .enterprise-table th { background-color: #f8fafc; padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    .enterprise-table td { padding: 12px 16px; font-size: 0.875rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .enterprise-table tbody tr:hover { background-color: #f8fafc; }
    .enterprise-table tbody tr:last-child td { border-bottom: none; }
    
    .ref-text { font-family: monospace; color: #64748b; font-size: 0.8125rem; }
    .engin-name { font-weight: 500; color: #0f172a; }
    .engin-sub { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
    .desc-text { color: #334155; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .date-text { color: #475569; font-size: 0.8125rem; }
    .text-right { text-align: right; }
    .empty-state { text-align: center; color: #94a3b8; padding: 32px !important; }

    /* Badges */
    .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge-primary { background-color: #dbeafe; color: #1e40af; }
    .badge-success { background-color: #d1fae5; color: #065f46; }
    .badge-danger { background-color: #fee2e2; color: #991b1b; }
    .badge-warning { background-color: #fef3c7; color: #92400e; }
    .badge-info { background-color: #e0e7ff; color: #3730a3; }

    /* Actions */
    .actions-cell { display: flex; justify-content: flex-end; gap: 8px; align-items: center; }
    .btn-action { padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; border: 1px solid transparent; cursor: pointer; transition: all 0.15s; }
    .btn-action-primary { background-color: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
    .btn-action-primary:hover { background-color: #e2e8f0; color: #2563eb; border-color: #2563eb; }
    .btn-action-disabled { background-color: #f8fafc; color: #94a3b8; border-color: #e2e8f0; cursor: not-allowed; }
    
    .btn-icon { background: none; border: none; color: #94a3b8; padding: 4px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background-color: #fee2e2; color: #dc2626; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background-color: rgba(15, 23, 42, 0.4); display: flex; justify-content: center; align-items: flex-start; padding-top: 10vh; z-index: 50; }
    .modal-container { background: white; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 100%; max-width: 600px; overflow: hidden; }
    .modal-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; color: #0f172a; }
    .btn-close { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; line-height: 1; padding: 0; }
    .btn-close:hover { color: #0f172a; }
    
    .modal-body { padding: 20px; }
    .modal-footer { padding: 16px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }
    
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .flex-1 { flex: 1; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 0.8125rem; font-weight: 500; color: #334155; margin-bottom: 6px; }
    .required { color: #dc2626; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; color: #0f172a; box-sizing: border-box; transition: border-color 0.15s; font-family: inherit; }
    .form-control:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
    textarea.form-control { resize: vertical; min-height: 80px; }
  `]
})
export class AnomaliesComponent implements OnInit {
  anomalies: any[] = [];
  listeEngins: any[] = [];

  showForm: boolean = false;
  anomalieForm: FormGroup;

  countATraiter = 0;
  countUrgentes = 0;
  countResolues = 0;

  constructor(private api: ApiService, private fb: FormBuilder, private router: Router) {
    this.anomalieForm = this.fb.group({
      engin: ['', Validators.required],
      criticite: ['NORMALE', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.chargerAnomalies();
    this.chargerEngins();
  }

  chargerEngins(): void {
    this.api.getMateriels().subscribe({
      next: (data) => this.listeEngins = data,
      error: (err) => console.error("Erreur de chargement des engins", err)
    });
  }

  chargerAnomalies(): void {
    this.api.getAnomalies().subscribe({
      next: (data) => {
        this.anomalies = data;
        this.countATraiter = this.anomalies.filter(a => this.isATraiter(a.statut)).length;
        this.countResolues = this.anomalies.filter(a => this.isResolu(a.statut)).length;
        this.countUrgentes = this.anomalies.filter(a => a.criticite === 'URGENTE').length;
      },
      error: (err) => console.error("Erreur chargement anomalies", err)
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.anomalieForm.reset({ criticite: 'NORMALE' });
    }
  }

  soumettreAnomalie(): void {
    if (this.anomalieForm.valid) {
      let selectedValue = this.anomalieForm.value.engin;
      if (typeof selectedValue === 'string') {
        selectedValue = selectedValue.trim();
      }

      const matchedEngin = this.listeEngins.find(e =>
        (e.matricule && e.matricule.trim() === selectedValue) ||
        (e.codeMateriel && e.codeMateriel.trim() === selectedValue)
      );

      const payload = {
        engin: matchedEngin ? { idEngin: matchedEngin.idEngin } : null,
        enginDeclare: matchedEngin ? ((matchedEngin.codeMateriel || matchedEngin.matricule) + ' - ' + matchedEngin.marque + ' ' + matchedEngin.modele) : (selectedValue ? selectedValue : 'Matériel Inconnu'),
        criticite: this.anomalieForm.value.criticite,
        description: this.anomalieForm.value.description,
        statut: 'A_TRAITER',
        dateSignalement: new Date().toISOString()
      };

      this.api.createAnomalie(payload as any).subscribe({
        next: () => {
          this.chargerAnomalies();
          this.toggleForm();
        },
        error: (err) => {
          console.error("Erreur création anomalie", err);
          alert("Erreur lors de l'enregistrement de l'anomalie.");
        }
      });
    }
  }

  isATraiter(statut: string): boolean {
    if (!statut) return true;
    const s = statut.toLowerCase();
    return s.includes('signal') || s.includes('traiter') || s.includes('attente');
  }

  isResolu(statut: string): boolean {
    if (!statut) return false;
    const s = statut.toLowerCase();
    return s.includes('resolu') || s.includes('termin') || s.includes('clotur');
  }

  creerIntervention(ano: any): void {
    if (confirm("Créer un Ordre de Travail (Intervention) pour cette anomalie ?")) {
      const payload = {
        engin: ano.engin ? { idEngin: ano.engin.idEngin } : null,
        enginDeclare: ano.enginDeclare,
        anomalie: { idAnomalie: ano.idAnomalie },
        type: 'Corrective',
        statut: 'EN_ATTENTE',
        dateDebut: new Date().toISOString()
      };

      this.api.createIntervention(payload as any).subscribe({
        next: () => {
          this.chargerAnomalies(); // Refresh the list
          this.router.navigate(['/interventions']);
        },
        error: (err) => {
          console.error("Erreur lors de la création de l'intervention", err);
          alert("Impossible de créer l'ordre de travail.");
        }
      });
    }
  }

  supprimerAnomalie(ano: any): void {
    if (confirm(`Voulez-vous vraiment supprimer l'anomalie #${ano.idAnomalie} ?`)) {
      this.api.deleteAnomalie(ano.idAnomalie).subscribe({
        next: () => {
          this.chargerAnomalies();
        },
        error: (err) => {
          console.error("Erreur suppression anomalie", err);
          alert("Erreur lors de la suppression. Cette anomalie est peut-être liée à un ordre de travail existant.");
        }
      });
    }
  }
}

