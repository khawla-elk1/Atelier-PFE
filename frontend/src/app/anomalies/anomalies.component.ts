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
    <div class="page-container animate-slide-up">
      <div class="flex-row space-between header-title">
        <div>
          <h1>Anomalies Signalées</h1>
          <p class="subtitle">Réception des appels chauffeurs & Signalements</p>
        </div>
        <button class="btn-primary" (click)="toggleForm()" style="display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg>
          {{ showForm ? 'Annuler la saisie' : 'Nouvel Appel Chauffeur' }}
        </button>
      </div>

      <!-- KPI METRICS -->
      <div class="kpi-grid">
        <div class="glass-panel kpi-card animate-slide-up" style="animation-delay: 0.05s;">
          <div class="kpi-icon" style="background: var(--warning-light); color: var(--warning);">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div class="kpi-info">
            <h3>ANOMALIES EN ATTENTE</h3>
            <div class="kpi-value">{{ countATraiter }}</div>
            <div class="kpi-trend" style="color: var(--warning)">À diagnostiquer</div>
          </div>
        </div>

        <div class="glass-panel kpi-card animate-slide-up" style="animation-delay: 0.1s;">
          <div class="kpi-icon" style="background: var(--danger-light); color: var(--danger);">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div class="kpi-info">
            <h3>CASSES URGENTES</h3>
            <div class="kpi-value">{{ countUrgentes }}</div>
            <div class="kpi-trend" style="color: var(--danger)">Priorité Haute</div>
          </div>
        </div>

        <div class="glass-panel kpi-card animate-slide-up" style="animation-delay: 0.15s;">
          <div class="kpi-icon" style="background: var(--success-light); color: var(--success);">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <div class="kpi-info">
            <h3>ANOMALIES RÉPARÉES</h3>
            <div class="kpi-value">{{ countResolues }}</div>
            <div class="kpi-trend" style="color: var(--success)">Interventions terminées</div>
          </div>
        </div>
      </div>

      <!-- FORMULAIRE DE SAISIE PAR LE CHEF -->
      <div *ngIf="showForm" class="glass-panel form-panel animate-slide-up" style="margin-bottom: 20px; border-left: 3px solid #ef4444;">
        <h2 style="margin-bottom: 16px; font-size: 1.1rem; color: #ef4444;">Nouvelle Déclaration d'Anomalie</h2>
        <form [formGroup]="anomalieForm" (ngSubmit)="soumettreAnomalie()" class="form-grid">
          <div class="form-group">
            <label>Véhicule / Matériel Concerné *</label>
            <input list="engins-list" formControlName="engin" class="input-field" placeholder="ex: CH-09... (Recherche)" autocomplete="off">
            <datalist id="engins-list">
              <option *ngFor="let engin of listeEngins" [value]="engin.matricule || engin.codeMateriel">
                {{ engin.codeMateriel || engin.matricule }} - {{ engin.marque }} {{ engin.modele }}
              </option>
            </datalist>
          </div>
          <div class="form-group">
            <label>Niveau d'Urgence *</label>
            <select formControlName="criticite" class="input-field">
              <option value="NORMALE">Normale (Entretien Régulier)</option>
              <option value="PLANIFIEE">Planifiée (À prévoir bientôt)</option>
              <option value="URGENTE">Urgente / Critique (Panne bloquante)</option>
            </select>
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label>Description du Problème (Rapport du Chauffeur) *</label>
            <input type="text" formControlName="description" class="input-field" placeholder="Décrivez les symptômes remontés par le chauffeur...">
          </div>
          <div class="form-group" style="display:flex; align-items: flex-end;">
            <button type="submit" class="btn-primary" style="background:#ef4444; width:100%" [disabled]="anomalieForm.invalid">
              Enregistrer l'Anomalie
            </button>
          </div>
        </form>
      </div>

      <div class="glass-panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Matériel / Véhicule</th>
              <th>Description</th>
              <th>Date Signalement</th>
              <th>Criticité</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ano of anomalies">
              <td>#ANO-{{ ano.idAnomalie | number:'3.0-0' }}</td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div *ngIf="!ano.engin" style="color:var(--warning);" title="Matériel Supprimé ou Saisie Libre">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"></path></svg>
                  </div>
                  <strong>{{ ano.engin ? (ano.engin.codeMateriel || ano.engin.matricule) : (ano.enginDeclare || '— Non assigné') }}</strong>
                </div>
                <span style="display:block; font-size:0.75rem; color:#64748b;" *ngIf="ano.engin">{{ ano.engin.marque }} {{ ano.engin.modele }}</span>
              </td>
              <td>{{ ano.description }}</td>
              <td>{{ ano.dateSignalement | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <span class="badge" [ngClass]="ano.criticite === 'URGENT' || ano.criticite === 'CRITIQUE' ? 'danger' : (ano.criticite === 'ELEVEE' ? 'warning' : 'success')">
                  {{ ano.criticite || 'NORMAL' }}
                </span>
              </td>
              <td>
                <span class="badge" [ngClass]="getStatutBadge(ano.statut)">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor; margin-right:4px;"></span>
                  {{ ano.statut }}
                </span>
              </td>
              <td>
                <button class="btn-primary small" 
                        *ngIf="isATraiter(ano.statut)" 
                        (click)="creerIntervention(ano)" style="display:flex; align-items:center; gap:4px;">
                  <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  Générer Ordre
                </button>
                <button class="btn-primary small" 
                        *ngIf="!isATraiter(ano.statut)" 
                        disabled style="opacity: 0.5; background:var(--bg); color:var(--text); box-shadow:none;">
                  {{ isResolu(ano.statut) ? 'Côté Atelier : Terminé' : 'Atelier : En Cours' }}
                </button>
                <button class="btn-action ghost-danger" style="margin-left:8px;"
                        (click)="supprimerAnomalie(ano)" title="Supprimer l'anomalie">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </td>
            </tr>
            <tr *ngIf="anomalies.length === 0">
              <td colspan="7" style="text-align: center; color: #64748b; padding: 20px;">Aucune anomalie à afficher.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .header-title { margin-bottom: 20px; }
    .subtitle { color: var(--text-muted); font-size: 0.9rem; margin-top: 4px; }
    .form-panel { padding: 20px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: .78rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }

    .btn-action {
      display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px;
      border-radius: 6px; cursor: pointer; transition: all 0.2s; border: none; background: transparent;
    }
    .btn-action.ghost-danger { color: #94a3b8; }
    .btn-action.ghost-danger:hover { color: #ef4444; background: #fef2f2; }
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
        this.countUrgentes = this.anomalies.filter(a => a.criticite === 'URGENTE' || a.criticite === 'CRITIQUE').length;
      },
      error: (err) => console.error("Erreur chargement anomalies", err)
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
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
        statut: 'A_TRAITER'
      };

      console.log("Submitting payload: ", payload);

      this.api.createAnomalie(payload).subscribe({
        next: () => {
          this.chargerAnomalies();
          this.anomalieForm.reset({ criticite: 'NORMALE' });
          this.showForm = false;
        },
        error: (err) => {
          console.error("Erreur création anomalie", err);
          alert("Erreur lors de la création de l'anomalie. Veuillez vérifier que l'engin sélectionné existe bien dans la liste.");
        }
      });
    } else {
      alert("Veuillez remplir tous les champs obligatoires correctement.");
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

  getStatutBadge(statut: string): string {
    if (!statut) return 'warning';
    const s = statut.toLowerCase();
    if (s.includes('resolu') || s.includes('termin')) return 'success';
    if (s.includes('cours')) return 'primary';
    return 'warning';
  }

  creerIntervention(ano: any): void {
    if(confirm("Créer un Ordre de Travail (Intervention) pour cette anomalie ?")) {
      const payload = {
        engin: ano.engin ? { idEngin: ano.engin.idEngin } : null,
        enginDeclare: ano.enginDeclare,
        anomalie: { idAnomalie: ano.idAnomalie },
        type: 'Corrective'
      };
      
      this.api.createIntervention(payload).subscribe({
        next: () => {
          this.router.navigate(['/interventions']);
        },
        error: (err) => console.error(err)
      });
    }
  }

  supprimerAnomalie(ano: any): void {
    if (confirm(`Voulez-vous vraiment supprimer l'anomalie #ANO-${ano.idAnomalie} ?`)) {
      this.api.deleteAnomalie(ano.idAnomalie).subscribe({
        next: () => {
          this.chargerAnomalies();
        },
        error: (err) => {
          console.error("Erreur suppression anomalie", err);
          alert("Erreur lors de la suppression. Il est possible qu'elle soit liée à une intervention existante.");
        }
      });
    }
  }
}
