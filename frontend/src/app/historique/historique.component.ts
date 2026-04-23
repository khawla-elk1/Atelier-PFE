import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate-slide-up">
      <div class="hist-header">
        <div>
          <h1>Historique & Archives</h1>
          <p class="subtitle">Suivi complet des interventions clôturées — Traçabilité GMAO</p>
        </div>
        <div class="header-controls">
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()"
                   placeholder="Rechercher par matériel, technicien, type..."
                   class="search-input" id="search-historique">
          </div>
        </div>
      </div>

      <!-- KPI METRICS -->
      <div class="kpi-grid">
        <div class="glass-panel kpi-card animate-slide-up" style="animation-delay: 0.05s;">
          <div class="kpi-icon" style="background: linear-gradient(135deg, #dbeafe, #eff6ff); color: #1d4ed8;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
          </div>
          <div class="kpi-info">
            <h3>TOTAL ARCHIVES</h3>
            <div class="kpi-value">{{ totalArchives }}</div>
            <div class="kpi-trend" style="color: #1d4ed8">Interventions clôturées</div>
          </div>
        </div>

        <div class="glass-panel kpi-card animate-slide-up" style="animation-delay: 0.1s;">
          <div class="kpi-icon" style="background: linear-gradient(135deg, #d1fae5, #ecfdf5); color: #059669;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div class="kpi-info">
            <h3>DURÉE MOY. RÉPARATION</h3>
            <div class="kpi-value">{{ dureeMoyenne }} j</div>
            <div class="kpi-trend" style="color: #059669">Temps moyen d'immobilisation</div>
          </div>
        </div>

        <div class="glass-panel kpi-card animate-slide-up" style="animation-delay: 0.15s;">
          <div class="kpi-icon" style="background: linear-gradient(135deg, #f3e8ff, #faf5ff); color: #7c3aed;">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div class="kpi-info">
            <h3>COÛT TOTAL CUMULÉ</h3>
            <div class="kpi-value">{{ totalCout | number:'1.2-2' }} MAD</div>
            <div class="kpi-trend" style="color: #7c3aed">Cumul M.O & interventions</div>
          </div>
        </div>
      </div>

      <!-- FILTER TABS -->
      <div class="filter-tabs">
        <button class="tab" [class.active]="activeTab === 'all'" (click)="setTab('all')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
          Toutes ({{ totalArchives }})
        </button>
        <button class="tab" [class.active]="activeTab === 'corrective'" (click)="setTab('corrective')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
          Correctives ({{ countCorrective }})
        </button>
        <button class="tab" [class.active]="activeTab === 'preventive'" (click)="setTab('preventive')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          Préventives ({{ countPreventive }})
        </button>
      </div>

      <!-- TABLE -->
      <div class="glass-panel table-wrap">
        <table class="data-table" id="table-historique">
          <thead>
            <tr>
              <th>ID</th>
              <th>Matériel / Véhicule</th>
              <th>Type</th>
              <th>Date Entrée</th>
              <th>Date Sortie</th>
              <th>Immobilisation</th>
              <th>Technicien</th>
              <th>Coût (MAD)</th>
              <th>Observations</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let int of paginatedArchives" class="archive-row">
              <td><strong style="color: var(--primary); font-family:'JetBrains Mono',monospace; font-size:0.87rem;">{{ int.idStr }}</strong></td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div class="materiel-badge" [attr.data-cat]="int.categorie">
                    <svg *ngIf="int.categorie !== 'Camion'" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                    <svg *ngIf="int.categorie === 'Camion'" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                  </div>
                  <div>
                    <strong>{{ int.engin }}</strong>
                    <span *ngIf="int.enginDetail" style="display:block; font-size:0.75rem; color:#64748b;">{{ int.enginDetail }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="type-badge" [attr.data-type]="int.type">{{ int.type }}</span>
              </td>
              <td>{{ int.dateDebut }}</td>
              <td>{{ int.dateFin }}</td>
              <td>
                <span class="duration-badge" [class.long-duration]="int.joursArret > 7">
                  {{ int.joursArret > 0 ? int.joursArret + ' jour' + (int.joursArret > 1 ? 's' : '') : 'Même jour' }}
                </span>
              </td>
              <td>
                <span *ngIf="int.technicien" style="font-weight:500;">{{ int.technicien }}</span>
                <span *ngIf="!int.technicien" style="color:#94a3b8; font-style:italic; font-size:0.85rem;">Non assigné</span>
              </td>
              <td style="font-weight:600; color:#475569;">{{ int.cout > 0 ? (int.cout | number:'1.2-2') : '—' }}</td>
              <td>
                <span *ngIf="int.observations" class="obs-text" [title]="int.observations">{{ truncate(int.observations, 40) }}</span>
                <span *ngIf="!int.observations" style="color:#94a3b8; font-size:0.85rem;">—</span>
              </td>
            </tr>
            <tr *ngIf="filteredArchives.length === 0">
              <td colspan="9" class="empty-state">
                <svg width="40" height="40" fill="none" stroke="#cbd5e1" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                <p>Aucune intervention archivée ne correspond à vos critères.</p>
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
    .hist-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .hist-header h1 { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
    .subtitle { color: var(--text-muted); font-size: 0.9rem; }

    .header-controls { display: flex; gap: 12px; align-items: center; }
    .search-box { display: flex; align-items: center; gap: 8px; background: var(--bg-card, #fff); border: 1px solid var(--border, #e5e7eb); border-radius: 10px; padding: 8px 14px; min-width: 300px; }
    .search-input { flex: 1; border: none; outline: none; background: transparent; font-size: 0.9rem; color: var(--text-primary); }
    .search-input::placeholder { color: var(--text-muted); }

    .filter-tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .tab {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 8px;
      border: 1px solid var(--border, #e5e7eb); background: var(--bg-card, #fff);
      font-size: 0.85rem; font-weight: 600; color: var(--text-secondary, #64748b);
      cursor: pointer; transition: all 0.2s ease;
    }
    .tab:hover { border-color: var(--primary); color: var(--primary); }
    .tab.active { background: var(--primary, #1d4ed8); color: #fff; border-color: var(--primary); }

    .table-wrap { padding: 0; overflow: hidden; }

    .archive-row { transition: background 0.15s; }
    .archive-row:hover { background: #f8fafc; }

    .materiel-badge {
      width: 32px; height: 32px; border-radius: 8px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      background: #eff6ff; color: #1d4ed8;
    }
    .materiel-badge[data-cat="Camion"] { background: #fef3c7; color: #92400e; }
    .materiel-badge[data-cat="Voiture"] { background: #d1fae5; color: #065f46; }

    .type-badge {
      padding: 3px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600;
      display: inline-block;
    }
    .type-badge[data-type="Corrective"] { background: #fef2f2; color: #dc2626; }
    .type-badge[data-type="Préventive"] { background: #eff6ff; color: #1d4ed8; }

    .duration-badge { font-weight: 600; color: var(--text); font-size: 0.88rem; }
    .duration-badge.long-duration { color: var(--warning, #d97706); }

    .obs-text { font-size: 0.85rem; color: #475569; cursor: help; }

    .empty-state {
      text-align: center; color: #94a3b8; padding: 48px 20px !important;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-state p { font-size: 0.9rem; margin: 0; }

    .pagination {
      display: flex; justify-content: center; align-items: center; gap: 16px;
      padding: 16px; border-top: 1px solid var(--border);
    }
    .page-btn {
      padding: 8px 18px; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-card); color: var(--text-secondary); cursor: pointer;
      font-size: 0.85rem; font-weight: 500; transition: all .2s;
    }
    .page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-info { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
  `]
})
export class HistoriqueComponent implements OnInit {
  allArchives: any[] = [];
  filteredArchives: any[] = [];
  paginatedArchives: any[] = [];

  searchTerm = '';
  activeTab = 'all';

  totalArchives = 0;
  countCorrective = 0;
  countPreventive = 0;
  dureeMoyenne = 0;
  totalCout = 0;

  currentPage = 1;
  pageSize = 20;
  totalPages = 1;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.chargerArchives();
  }

  chargerArchives(): void {
    this.api.getInterventions().subscribe({
      next: (data) => {
        // Filtrer uniquement les interventions clôturées
        const cloturees = data.filter((i: any) => i.statut === 'Clôturée');

        this.allArchives = cloturees.map((dbInt: any) => {
          let strDate = '—';
          let strDateFin = '—';
          let joursArret = 0;

          if (dbInt.dateDebut) {
            const dateObj = new Date(dbInt.dateDebut);
            strDate = dateObj.toLocaleDateString('fr-FR');

            if (dbInt.dateFin) {
              const dateFinObj = new Date(dbInt.dateFin);
              strDateFin = dateFinObj.toLocaleDateString('fr-FR');
              const diffTime = Math.abs(dateFinObj.getTime() - dateObj.getTime());
              joursArret = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          }

          const enginCode = dbInt.engin
            ? (dbInt.engin.codeMateriel || dbInt.engin.matricule)
            : (dbInt.enginDeclare ? dbInt.enginDeclare + ' (Saisie Libre)' : null);
          const enginDetail = dbInt.engin
            ? `${dbInt.engin.marque || ''} ${dbInt.engin.modele || ''}`.trim()
            : null;

          return {
            idRaw: dbInt.idIntervention,
            idStr: '#INT-' + String(dbInt.idIntervention).padStart(3, '0'),
            engin: enginCode || 'Matériel supprimé',
            enginDetail: enginDetail,
            categorie: dbInt.engin?.categorie || 'Engin',
            type: dbInt.type || '—',
            dateDebut: strDate,
            dateFin: strDateFin,
            joursArret: joursArret,
            technicien: dbInt.technicien ? `${dbInt.technicien.prenom} ${dbInt.technicien.nom}` : null,
            cout: dbInt.cout || 0,
            observations: dbInt.observations || null
          };
        }).sort((a: any, b: any) => b.idRaw - a.idRaw);

        // Calcul KPIs
        this.totalArchives = this.allArchives.length;
        this.countCorrective = this.allArchives.filter(a => a.type === 'Corrective').length;
        this.countPreventive = this.allArchives.filter(a => a.type === 'Préventive').length;
        this.totalCout = this.allArchives.reduce((sum, a) => sum + (a.cout || 0), 0);

        const totalJours = this.allArchives.reduce((sum, a) => sum + a.joursArret, 0);
        this.dureeMoyenne = this.totalArchives > 0
          ? Math.round((totalJours / this.totalArchives) * 10) / 10
          : 0;

        this.applyFilters();
      },
      error: (err) => console.error('Erreur chargement archives', err)
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allArchives];

    // Tab filter
    if (this.activeTab === 'corrective') {
      result = result.filter(a => a.type === 'Corrective');
    } else if (this.activeTab === 'preventive') {
      result = result.filter(a => a.type === 'Préventive');
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(a =>
        (a.engin || '').toLowerCase().includes(term) ||
        (a.enginDetail || '').toLowerCase().includes(term) ||
        (a.technicien || '').toLowerCase().includes(term) ||
        (a.type || '').toLowerCase().includes(term) ||
        (a.observations || '').toLowerCase().includes(term) ||
        (a.idStr || '').toLowerCase().includes(term)
      );
    }

    this.filteredArchives = result;
    this.totalPages = Math.max(1, Math.ceil(result.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    this.updatePage();
  }

  updatePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedArchives = this.filteredArchives.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  truncate(str: string, max: number): string {
    if (!str) return '—';
    return str.length > max ? str.substring(0, max) + '…' : str;
  }
}
