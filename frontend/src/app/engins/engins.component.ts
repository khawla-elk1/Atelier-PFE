import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-engins',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container animate-slide-up">

      <!-- ===== HEADER ===== -->
      <div class="parc-header">
        <div>
          <h1>Parc Matériels</h1>
          <p class="subtitle">{{ filteredEngins.length }} matériels sur {{ listeEngins.length }} — Flotte STAPORT</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="toggleForm()" id="btn-add-materiel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ showForm ? 'Annuler' : 'Ajouter' }}
          </button>
        </div>
      </div>

      <!-- ===== KPI MINIATURES ===== -->
      <div class="kpi-row">
        <div class="kpi-mini" *ngFor="let k of kpis">
          <div class="kpi-mini-icon" [style.background]="k.bg">
            <ng-container [ngSwitch]="k.type">
              <svg *ngSwitchCase="'total'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              <svg *ngSwitchCase="'engin'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a044e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
              <svg *ngSwitchCase="'camion'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
              <svg *ngSwitchCase="'voiture'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#065f46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H5a2 2 0 0 0-2 2v7h2m10 0a2.5 2.5 0 1 1-5 0m-5 0a2.5 2.5 0 1 1-5 0"></path></svg>
              <svg *ngSwitchCase="'accessoire'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
            </ng-container>
          </div>
          <div>
            <div class="kpi-mini-value">{{ k.value }}</div>
            <div class="kpi-mini-label">{{ k.label }}</div>
          </div>
        </div>
      </div>

      <!-- ===== FILTRES ===== -->
      <div class="filter-bar glass-panel">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()"
                 placeholder="Rechercher par code, marque, modèle, châssis..."
                 class="search-input" id="search-materiel">
        </div>
        <div class="filter-chips">
          <button *ngFor="let cat of categories"
                  class="chip"
                  [class.active]="selectedCategory === cat"
                  (click)="selectCategory(cat)">
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- ===== FORMULAIRE D'AJOUT ===== -->
      <div *ngIf="showForm" class="glass-panel form-panel animate-slide-up">
        <h2 style="margin-bottom: 16px; font-size: 1.1rem;">Nouveau Matériel</h2>
        <form [formGroup]="enginForm" (ngSubmit)="onSubmit()" class="form-grid">
          <div class="form-group">
            <label>Code Matériel *</label>
            <input formControlName="matricule" class="input-field" placeholder="Ex: E750">
          </div>
          <div class="form-group">
            <label>Marque *</label>
            <input formControlName="marque" class="input-field" placeholder="CAT, Doosan, Volvo...">
          </div>
          <div class="form-group">
            <label>Modèle *</label>
            <input formControlName="modele" class="input-field" placeholder="D8R, DX300...">
          </div>
          <div class="form-group">
            <label>Type / Genre *</label>
            <input formControlName="type" class="input-field" placeholder="Pelle sur chenilles...">
          </div>
          <div class="form-group">
            <label>Catégorie</label>
            <select formControlName="categorie" class="input-field">
              <option value="Engin">Engin</option>
              <option value="Camion">Camion</option>
              <option value="Voiture">Voiture</option>
              <option value="Accessoire / Organe">Accessoire / Organe</option>
            </select>
          </div>
          <div class="form-group">
            <label>N° Châssis</label>
            <input formControlName="serieChassis" class="input-field" placeholder="Série châssis">
          </div>
          <div class="form-group" style="display:flex; align-items: flex-end;">
            <button type="submit" class="btn-primary" [disabled]="enginForm.invalid" style="width:100%">
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      <!-- ===== DETAIL PANEL ===== -->
      <div *ngIf="selectedEngin" class="glass-panel detail-panel animate-slide-up" id="fiche-detail">
        <div class="detail-header">
          <div>
            <h2>{{ selectedEngin.codeMateriel || selectedEngin.matricule }}</h2>
            <span class="detail-subtitle">{{ selectedEngin.codeInterne || selectedEngin.type }}</span>
          </div>
          <button class="btn-close" (click)="selectedEngin = null">&times;</button>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Marque</span>
            <span class="detail-value">{{ selectedEngin.marque || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Modèle</span>
            <span class="detail-value">{{ selectedEngin.modele || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Genre</span>
            <span class="detail-value">{{ selectedEngin.type || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Catégorie</span>
            <span class="detail-value">{{ selectedEngin.categorie || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Poids</span>
            <span class="detail-value">{{ selectedEngin.poids || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">N° Châssis</span>
            <span class="detail-value mono">{{ selectedEngin.serieChassis || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Type Moteur</span>
            <span class="detail-value">{{ selectedEngin.typeMoteur || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">N° Moteur</span>
            <span class="detail-value mono">{{ selectedEngin.serieMoteur || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Immatriculation</span>
            <span class="detail-value">{{ selectedEngin.immatriculation || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Date Acquisition</span>
            <span class="detail-value">{{ selectedEngin.dateAcquisition || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Date Mise en Circulation</span>
            <span class="detail-value">{{ selectedEngin.dateMiseEnCirculation || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Statut</span>
            <span class="badge" [ngClass]="{'success': selectedEngin.statut === 'ACTIF'}">{{ selectedEngin.statut }}</span>
          </div>
        </div>

        <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          <h3 style="font-size: 1rem; color: #334155; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
             📝 Historique d'Entrée / Sortie Atelier
          </h3>
          <table class="data-table" style="font-size: 0.85rem;" *ngIf="historiqueEngin.length > 0">
            <thead style="background: #f8fafc;">
              <tr>
                <th>ID Rép.</th>
                <th>Type</th>
                <th>Date Entrée</th>
                <th>Date Sortie</th>
                <th>Durée d'Immobilisation</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of historiqueEngin">
                <td><strong>{{ h.idStr }}</strong></td>
                <td>{{ h.type }}</td>
                <td>{{ h.dateDebut }}</td>
                <td>
                   <span *ngIf="h.dateFin !== '—'">{{ h.dateFin }}</span>
                   <span *ngIf="h.dateFin === '—'" style="color:var(--text-muted); font-style:italic;">En atelier...</span>
                </td>
                <td style="font-weight: 600;" [ngStyle]="{'color': h.joursArret > 7 && h.statut !== 'Clôturée' ? 'var(--danger)' : 'var(--text)'}">
                   {{ h.joursArret > 0 ? h.joursArret + ' Jours' : 'Même jour' }}
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="historiqueEngin.length === 0" style="color: #64748b; font-size: 0.85rem; font-style: italic;">
            Aucune intervention enregistrée pour ce matériel.
          </div>
        </div>
      </div>

      <!-- ===== TABLE ===== -->
      <div class="glass-panel table-container">
        <table class="data-table" id="table-parc">
          <thead>
            <tr>
              <th>Code</th>
              <th>Marque</th>
              <th>Modèle / Type</th>
              <th>Catégorie</th>
              <th>N° Châssis</th>
              <th>Immatriculation</th>
              <th>Statut</th>
              <th style="text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let engin of paginatedEngins; trackBy: trackByMatricule"
                [class.row-selected]="selectedEngin?.matricule === engin.matricule"
                (click)="selectEngin(engin)">
              <td><strong class="code-cell">{{ engin.codeMateriel || engin.matricule }}</strong></td>
              <td>{{ engin.marque }}</td>
              <td>
                <span class="model-text">{{ engin.modele }}</span>
                <span class="type-sub">{{ engin.type }}</span>
              </td>
              <td>
                <span class="cat-badge" [attr.data-cat]="engin.categorie">{{ engin.categorie }}</span>
              </td>
              <td class="mono-cell">{{ truncate(engin.serieChassis, 18) }}</td>
              <td>{{ engin.immatriculation || '—' }}</td>
              <td>
                <span class="badge" [ngClass]="{'success': engin.statut === 'ACTIF', 'danger': engin.statut !== 'ACTIF'}">
                  {{ engin.statut }}
                </span>
              </td>
              <td style="text-align:center;">
                <button class="btn-icon" (click)="selectEngin(engin); $event.stopPropagation()" title="Voir la fiche">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredEngins.length === 0">
              <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 40px;">
                Aucun matériel ne correspond à vos critères.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button class="page-btn" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">
            ‹ Précédent
          </button>
          <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
          <button class="page-btn" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">
            Suivant ›
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .parc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .parc-header h1 { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
    .header-actions { display: flex; gap: 10px; }

    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .kpi-mini {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 20px; background: var(--bg-card, #fff); border-radius: 12px;
      border: 1px solid var(--border, #e5e7eb);
      transition: all 0.2s ease;
    }
    .kpi-mini:hover { border-color: var(--accent, #0066cc); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
    .kpi-mini-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .kpi-mini-value { font-size: 1.35rem; font-weight: 700; color: var(--text-primary); }
    .kpi-mini-label { font-size: .78rem; color: var(--text-muted); margin-top: 2px; }

    .filter-bar { display: flex; flex-direction: column; gap: 14px; padding: 16px 20px; margin-bottom: 20px; }
    .search-box { display: flex; align-items: center; gap: 10px; }
    .search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: .95rem; color: var(--text-primary); padding: 8px 0;
    }
    .search-input::placeholder { color: var(--text-muted); }
    .filter-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      padding: 6px 16px; border-radius: 20px;
      border: 1px solid var(--border, #e5e7eb); background: transparent;
      font-size: .82rem; color: var(--text-secondary); cursor: pointer;
      transition: all .2s ease; font-weight: 500;
    }
    .chip:hover { border-color: var(--accent); color: var(--accent); }
    .chip.active { background: var(--accent, #0066cc); color: #fff; border-color: var(--accent); }

    .form-panel { margin-bottom: 20px; border-left: 3px solid var(--accent); }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: .78rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .5px; }

    .detail-panel { margin-bottom: 20px; border-left: 3px solid var(--accent); }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .detail-header h2 { font-size: 1.3rem; font-weight: 700; color: var(--accent); }
    .detail-subtitle { font-size: .85rem; color: var(--text-muted); }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted); padding: 0 6px; line-height: 1; }
    .btn-close:hover { color: var(--text-primary); }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-label { font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .6px; color: var(--text-muted); }
    .detail-value { font-size: .95rem; color: var(--text-primary); font-weight: 500; }
    .detail-value.mono { font-family: 'JetBrains Mono', monospace; font-size: .85rem; letter-spacing: .3px; }

    .table-container { padding: 0; overflow: hidden; }
    .data-table { margin: 0; border-radius: 0; }
    .data-table th { position: sticky; top: 0; z-index: 1; }

    .code-cell { color: var(--accent); font-family: 'JetBrains Mono', monospace; font-size: .88rem; }
    .model-text { display: block; font-weight: 500; }
    .type-sub { display: block; font-size: .78rem; color: var(--text-muted); }
    .mono-cell { font-family: 'JetBrains Mono', monospace; font-size: .82rem; color: var(--text-secondary); }

    .cat-badge {
      padding: 3px 10px; border-radius: 6px; font-size: .78rem; font-weight: 600;
      display: inline-block; text-transform: capitalize;
    }
    .cat-badge[data-cat="Engin"] { background: #dbeafe; color: #1d4ed8; }
    .cat-badge[data-cat="Camion"] { background: #fef3c7; color: #92400e; }
    .cat-badge[data-cat="Voiture"] { background: #d1fae5; color: #065f46; }
    .cat-badge[data-cat="Accessoire / Organe"] { background: #ffedd5; color: #c2410c; }

    .btn-icon {
      background: none; border: 1px solid var(--border); border-radius: 8px;
      padding: 6px 8px; cursor: pointer; color: var(--text-muted);
      transition: all .2s;
    }
    .btn-icon:hover { border-color: var(--accent); color: var(--accent); background: rgba(0,102,204,.05); }

    .row-selected { background: rgba(0,102,204,.04) !important; }
    tr { cursor: pointer; }
    tr:hover { background: var(--bg-hover, #f9fafb); }

    .pagination {
      display: flex; justify-content: center; align-items: center; gap: 16px;
      padding: 16px; border-top: 1px solid var(--border);
    }
    .page-btn {
      padding: 8px 18px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-card); color: var(--text-secondary); cursor: pointer;
      font-size: .85rem; font-weight: 500; transition: all .2s;
    }
    .page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-info { font-size: .85rem; color: var(--text-muted); font-weight: 500; }
  `]
})
export class EnginsComponent implements OnInit {
  listeEngins: any[] = [];
  filteredEngins: any[] = [];
  paginatedEngins: any[] = [];
  searchTerm = '';
  selectedCategory = 'Tous';
  selectedEngin: any = null;
  showForm = false;
  enginForm: FormGroup;
  categories = ['Tous', 'Engin', 'Camion', 'Voiture', 'Accessoire / Organe'];
  kpis: any[] = [];

  // Interventions for History
  toutesInterventions: any[] = [];
  historiqueEngin: any[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 25;
  totalPages = 1;

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.enginForm = this.fb.group({
      matricule: ['', Validators.required],
      marque: ['', Validators.required],
      modele: ['', Validators.required],
      type: ['', Validators.required],
      categorie: ['Engin'],
      serieChassis: [''],
      statut: ['ACTIF'],
      compteurActuel: [0]
    });
  }

  ngOnInit(): void {
    this.chargerEngins();
    this.chargerInterventions();
  }

  chargerInterventions(): void {
    this.api.getInterventions().subscribe({
      next: (data) => {
        this.toutesInterventions = data.map((dbInt: any) => {
          let strDate = '—';
          let strDateFin = '—';
          let joursArret = 0;

          if (dbInt.dateDebut) {
            const dateObj = new Date(dbInt.dateDebut);
            strDate = dateObj.toLocaleDateString('fr-FR');

            const dateFinCal = dbInt.dateFin ? new Date(dbInt.dateFin) : new Date();
            if (dbInt.dateFin) {
              strDateFin = dateFinCal.toLocaleDateString('fr-FR');
            }
            const diffTime = Math.abs(dateFinCal.getTime() - dateObj.getTime());
            joursArret = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          return {
            idStr: '#INT-' + String(dbInt.idIntervention).padStart(3, '0'),
            idEngin: dbInt.engin?.idEngin,
            type: dbInt.type,
            statut: dbInt.statut,
            dateDebut: strDate,
            dateFin: strDateFin,
            joursArret: joursArret
          };
        });
      }
    });
  }

  chargerEngins(): void {
    this.api.getMateriels().subscribe({
      next: (data) => {
        this.listeEngins = data.map((e: any) => {
          const typeStr = (e.type || '').toLowerCase();
          const catStr = (e.categorie || '').toLowerCase();

          // Re-classification automatique (Normalisation des données existantes)
          if (catStr === 'accessoire' || catStr === 'organe' || catStr === 'accessoire / organe') {
            e.categorie = 'Accessoire / Organe';
          }
          // Si c'est enregistré comme Engin mais que la description indique que c'est un organe
          else if (typeStr.includes('brise roche') || typeStr.includes('brh') || typeStr.includes('organe') || typeStr.includes('accessoire') || typeStr.includes('godet') || typeStr.includes('marteau')) {
            e.categorie = 'Accessoire / Organe';
          }
          else if (!e.categorie && typeStr.includes('pelle')) {
            e.categorie = 'Engin';
          }

          return e;
        });
        this.buildKpis();
        this.applyFilters();
      },
      error: (err) => {
        console.error('API Error, données mock activées', err);
        this.listeEngins = [];
        this.buildKpis();
        this.applyFilters();
      }
    });
  }

  buildKpis(): void {
    const total = this.listeEngins.length;
    const engins = this.listeEngins.filter(e => e.categorie === 'Engin').length;
    const camions = this.listeEngins.filter(e => e.categorie === 'Camion').length;
    const voitures = this.listeEngins.filter(e => e.categorie === 'Voiture').length;
    const accessoires = this.listeEngins.filter(e => e.categorie === 'Accessoire / Organe').length;
    this.kpis = [
      { label: 'Total Matériels', value: total, type: 'total', bg: 'linear-gradient(135deg, #dbeafe, #eff6ff)' },
      { label: 'Engins', value: engins, type: 'engin', bg: 'linear-gradient(135deg, #f3e8ff, #faf5ff)' },
      { label: 'Camions', value: camions, type: 'camion', bg: 'linear-gradient(135deg, #fef3c7, #fffbeb)' },
      { label: 'Voitures & Véh.', value: voitures, type: 'voiture', bg: 'linear-gradient(135deg, #d1fae5, #ecfdf5)' },
      { label: 'Organes & Accessoires', value: accessoires, type: 'accessoire', bg: 'linear-gradient(135deg, #ffedd5, #fff7ed)' },
    ];
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.listeEngins];

    // Category filter
    if (this.selectedCategory !== 'Tous') {
      result = result.filter(e => e.categorie === this.selectedCategory);
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(e =>
        (e.matricule || '').toLowerCase().includes(term) ||
        (e.codeMateriel || '').toLowerCase().includes(term) ||
        (e.marque || '').toLowerCase().includes(term) ||
        (e.modele || '').toLowerCase().includes(term) ||
        (e.type || '').toLowerCase().includes(term) ||
        (e.serieChassis || '').toLowerCase().includes(term) ||
        (e.immatriculation || '').toLowerCase().includes(term) ||
        (e.codeInterne || '').toLowerCase().includes(term)
      );
    }

    this.filteredEngins = result;
    this.totalPages = Math.max(1, Math.ceil(result.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    this.updatePage();
  }

  updatePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedEngins = this.filteredEngins.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  selectEngin(engin: any): void {
    if (this.selectedEngin?.matricule === engin.matricule) {
      this.selectedEngin = null;
    } else {
      this.selectedEngin = engin;
      // Filtrer l'historique
      this.historiqueEngin = this.toutesInterventions.filter(i => i.idEngin === engin.idEngin);
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.selectedEngin = null;
  }

  onSubmit(): void {
    if (this.enginForm.valid) {
      this.api.createMateriel(this.enginForm.value).subscribe({
        next: (saved) => {
          this.listeEngins.unshift(saved);
          this.buildKpis();
          this.applyFilters();
          this.enginForm.reset({ statut: 'ACTIF', compteurActuel: 0, categorie: 'Engin' });
          this.showForm = false;
        },
        error: () => {
          // Fallback local
          this.listeEngins.unshift({ ...this.enginForm.value });
          this.buildKpis();
          this.applyFilters();
          this.enginForm.reset({ statut: 'ACTIF', compteurActuel: 0, categorie: 'Engin' });
          this.showForm = false;
        }
      });
    }
  }

  truncate(str: string, max: number): string {
    if (!str) return '—';
    return str.length > max ? str.substring(0, max) + '…' : str;
  }

  trackByMatricule(index: number, engin: any): string {
    return engin.matricule;
  }
}
