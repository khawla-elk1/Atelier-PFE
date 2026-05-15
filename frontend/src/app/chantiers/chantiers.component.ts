import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-chantiers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chantiers.component.html',
  styleUrl: './chantiers.component.css'
})
export class ChantiersComponent implements OnInit, OnDestroy {
  chantiers: any[] = [];
  selectedChantierId: number | null = null;
  selectedChantier: any = null;
  selectedChantierEngins: any[] = [];

  // Monthly tracking
  selectedMonthStr: string = '2025-05';
  monthlyHoursMap: { [enginId: number]: number } = {};
  
  // Custom Dropdown
  searchChantier: string = '';
  showChantierList: boolean = false;
  math = Math;

  loading = true;

  // ── Sync ERP ──────────────────────────────────────────────────────────────
  syncing = false;
  syncStatus: any = null;            // État retourné par l'API
  lastSyncTime: string | null = null;
  syncPollingInterval: any = null;   // Référence au setInterval de polling

  // ── Recalcul local ────────────────────────────────────────────────────────
  recalculating = false;
  recalcResult: any = null;

  // ── Affectation manuelle ──────────────────────────────────────────────────
  showAffectModal = false;
  availableEngins: any[] = [];
  loadingEngins = false;
  affectingEnginId: number | null = null;

  // ── Filtres ───────────────────────────────────────────────────────────────
  searchTerm = '';
  filterStatut = 'ACTIF';

  // ── Historique Pointages ──────────────────────────────────────────────────
  showPointagesModal = false;
  pointagesEngin: any[] = [];
  selectedEnginForPointages: any = null;
  loadingPointages = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadChantiers();
    this.pollSyncStatus(); // Vérifier l'état de synchro au démarrage
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // ── Chargement des chantiers ──────────────────────────────────────────────

  loadChantiers(): void {
    this.loading = true;
    this.apiService.getChantiers().subscribe({
      next: (data) => {
        this.chantiers = data;
        this.loading = false;
        this.loading = false;

        // Auto-sélection du premier chantier ACTIF
        if (this.chantiers.length > 0 && !this.selectedChantier) {
          const actifs = this.chantiers.filter(c => c.statut === 'ACTIF');
          this.selectChantier(actifs.length > 0 ? actifs[0].idChantier : this.chantiers[0].idChantier);
        }
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Sélection d'un chantier ───────────────────────────────────────────────

  selectChantier(id: number | string): void {
    const idNum = Number(id);
    this.selectedChantierId = idNum;
    this.selectedChantier = this.chantiers.find(c => c.idChantier === idNum);
    this.loadEnginsByChantier(idNum);
    this.loadMonthlyStats(idNum);
  }

  onMonthChange(event: any): void {
    this.selectedMonthStr = event.target.value;
    if (this.selectedChantierId) {
      this.loadMonthlyStats(this.selectedChantierId);
    }
  }

  loadMonthlyStats(chantierId: number): void {
    if (!this.selectedMonthStr) return;
    const [year, month] = this.selectedMonthStr.split('-').map(Number);
    if (!year || !month) return;
    this.apiService.getPointageStatsByChantierAndMonth(chantierId, year, month).subscribe({
      next: (map) => {
        this.monthlyHoursMap = map || {};
      },
      error: () => {
        this.monthlyHoursMap = {};
      }
    });
  }

  loadEnginsByChantier(chantierId: number): void {
    this.apiService.getEnginsByChantier(chantierId).subscribe({
      next: (data) => { this.selectedChantierEngins = data; },
      error: () => { this.selectedChantierEngins = []; }
    });
  }

  get filteredChantiers(): any[] {
    if (!this.searchChantier) return this.chantiers;
    const s = this.searchChantier.toLowerCase();
    return this.chantiers.filter(c => 
      (c.nom && c.nom.toLowerCase().includes(s)) || 
      (c.codeErp && c.codeErp.toLowerCase().includes(s))
    );
  }

  hideList(): void {
    setTimeout(() => this.showChantierList = false, 200);
  }

  selectChantierFromList(c: any): void {
    if (c) {
      this.searchChantier = (c.codeErp ? c.codeErp + ' · ' : '') + c.nom;
      this.selectChantier(c.idChantier);
    } else {
      this.searchChantier = '';
      this.selectedChantierId = null;
      this.selectedChantier = null;
      this.selectedChantierEngins = [];
      this.monthlyHoursMap = {};
    }
    this.showChantierList = false;
  }

  onChantierChange(event: any): void {
    if (event.target.value) this.selectChantier(event.target.value);
  }

  // ── Synchronisation ERP ASYNCHRONE ───────────────────────────────────────

  syncFromErp(periode: 'today' | 'week' | 'month' | '6months' | '12months' | 'year' = 'month'): void {
    if (this.syncing) return;
    this.syncing = true;
    this.syncStatus = null;
    this.recalcResult = null;

    this.apiService.syncAsync(periode).subscribe({
      next: (result) => {
        this.syncStatus = result;
        if (result.status === 'STARTED' || result.status === 'RUNNING') {
          // Démarrer le polling pour suivre la progression
          this.startPolling();
        } else if (result.status === 'ALREADY_RUNNING') {
          this.startPolling(); // Synchro déjà en cours — suivre aussi
        } else {
          this.syncing = false;
        }
      },
      error: () => {
        this.syncStatus = { status: 'ERROR', message: 'Impossible de contacter le serveur.' };
        this.syncing = false;
      }
    });
  }

  /** Polling : interroge /sync/status toutes les 3 secondes tant que RUNNING */
  startPolling(): void {
    this.stopPolling();
    this.syncPollingInterval = setInterval(() => {
      this.pollSyncStatus();
    }, 3000);
  }

  stopPolling(): void {
    if (this.syncPollingInterval) {
      clearInterval(this.syncPollingInterval);
      this.syncPollingInterval = null;
    }
  }

  pollSyncStatus(): void {
    this.apiService.getSyncStatus().subscribe({
      next: (state) => {
        this.syncStatus = state;
        this.lastSyncTime = state.lastSyncTime;

        if (state.status === 'RUNNING' || state.inProgress) {
          this.syncing = true; // Toujours en cours
        } else {
          // Synchro terminée (SUCCESS ou ERROR)
          if (this.syncing) {
            // Venait de finir → recharger les données
            this.syncing = false;
            this.stopPolling();
            if (state.status === 'SUCCESS') {
              this.loadChantiers();
              if (this.selectedChantierId) {
                this.loadEnginsByChantier(this.selectedChantierId);
              }
            }
          } else {
            // Démarrage initial : ne pas relancer le rechargement
            this.stopPolling();
          }
        }
      },
      error: () => {
        // Serveur non disponible, arrêter le polling
        this.stopPolling();
        this.syncing = false;
      }
    });
  }

  // ── Recalcul depuis les données locales (sans ERP) ───────────────────────

  recalculerAffectationsLocal(): void {
    if (this.recalculating) return;
    this.recalculating = true;
    this.syncStatus = null;
    this.recalcResult = null;

    this.apiService.recalculerAffectationsLocal().subscribe({
      next: (result) => {
        this.recalcResult = result;
        this.recalculating = false;
        if (result.status === 'SUCCESS') {
          this.loadChantiers();
          if (this.selectedChantierId) {
            this.loadEnginsByChantier(this.selectedChantierId);
          }
        }
      },
      error: () => {
        this.recalcResult = { status: 'ERROR', message: 'Erreur lors du recalcul.' };
        this.recalculating = false;
      }
    });
  }

  // ── Synchronisation des chantiers depuis l'ERP ──────────────────────────

  syncChantiersFromErp(): void {
    this.apiService.syncChantiers().subscribe({
      next: (result) => {
        this.syncStatus = result;
        if (result.status === 'SUCCESS') this.loadChantiers();
      },
      error: () => {
        this.syncStatus = { status: 'ERROR', message: 'Connexion ERP impossible' };
      }
    });
  }

  // ── Affectation manuelle ──────────────────────────────────────────────────

  openAffectModal(): void {
    if (!this.selectedChantier) return;
    this.showAffectModal = true;
    this.loadingEngins = true;
    this.availableEngins = [];

    // Charger tous les engins puis filtrer ceux qui ne sont PAS sur ce chantier
    this.apiService.getMateriels().subscribe({
      next: (engins) => {
        this.availableEngins = engins.filter(e =>
          e.statut !== 'VENDU' && e.statut !== 'FERRAILLE' &&
          (!e.chantier || e.chantier.idChantier !== this.selectedChantierId)
        );
        this.loadingEngins = false;
      },
      error: () => { this.loadingEngins = false; }
    });
  }

  closeAffectModal(): void {
    this.showAffectModal = false;
    this.availableEngins = [];
    this.affectingEnginId = null;
  }

  affecterEngin(enginId: number): void {
    if (!this.selectedChantierId) return;
    this.affectingEnginId = enginId;

    this.apiService.affecterEnginAuChantier(enginId, this.selectedChantierId).subscribe({
      next: () => {
        this.affectingEnginId = null;
        // Retirer de la liste des disponibles
        this.availableEngins = this.availableEngins.filter(e => e.idEngin !== enginId);
        // Recharger les engins du chantier
        this.loadEnginsByChantier(this.selectedChantierId!);
      },
      error: () => { this.affectingEnginId = null; }
    });
  }

  desaffecterEngin(enginId: number): void {
    this.apiService.affecterEnginAuChantier(enginId, null).subscribe({
      next: () => {
        this.selectedChantierEngins = this.selectedChantierEngins.filter(e => e.idEngin !== enginId);
      },
      error: () => {}
    });
  }


  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatutBadge(statut: string): string {
    switch (statut) {
      case 'ACTIF': return 'badge-actif';
      case 'TERMINE': return 'badge-termine';
      case 'EN_ATTENTE': return 'badge-attente';
      default: return 'badge-actif';
    }
  }

  formatSyncTime(isoStr: string | null): string {
    if (!isoStr) return 'Jamais';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return isoStr; }
  }

  get totalActifs(): number {
    return this.chantiers.filter(c => c.statut === 'ACTIF').length;
  }
  get totalSynced(): number {
    return this.chantiers.filter(c => c.codeErp).length;
  }
  get totalEnginsAffectes(): number {
    return this.chantiers.reduce((acc, c) => acc + (c.engins?.length || 0), 0);
  }

  // ── Helpers Financiers ──────────────────────────────────────────────────
  get totalHeuresMois(): number {
    let t = 0;
    this.selectedChantierEngins.forEach(e => t += (this.monthlyHoursMap[e.idEngin] || 0));
    return t;
  }

  getLoyerTotal(engin: any): number {
    const tarifJour = engin.prixMoyenPondere || 1800;
    const tauxHoraire = tarifJour / 10;
    const heures = this.monthlyHoursMap[engin.idEngin] || 0;
    return heures * tauxHoraire;
  }

  get totalLoyerMois(): number {
    let t = 0;
    this.selectedChantierEngins.forEach(e => t += this.getLoyerTotal(e));
    return t;
  }

  get utilisationMoyenne(): number {
    if (this.selectedChantierEngins.length === 0) return 0;
    let u = 0;
    this.selectedChantierEngins.forEach(e => {
        let heures = this.monthlyHoursMap[e.idEngin] || 0;
        let pct = (heures / 176) * 100;
        u += Math.min(100, pct);
    });
    return Math.round(u / this.selectedChantierEngins.length);
  }

  getPourcentageUtilisation(engin: any): number {
    // 176h = base mensuelle théorique (22 jours * 8h)
    let heures = this.monthlyHoursMap[engin.idEngin] || 0;
    let pct = (heures / 176) * 100;
    return Math.round(Math.min(100, pct));
  }

  getHeuresMois(engin: any): number {
    return this.monthlyHoursMap[engin.idEngin] || 0;
  }

  // ── Historique Pointages ──────────────────────────────────────────────────
  openPointagesModal(engin: any): void {
    this.selectedEnginForPointages = engin;
    this.showPointagesModal = true;
    this.loadingPointages = true;
    this.pointagesEngin = [];

    this.apiService.getPointagesByEngin(engin.idEngin).subscribe({
      next: (data) => {
        this.pointagesEngin = data;
        this.loadingPointages = false;
      },
      error: () => {
        this.loadingPointages = false;
      }
    });
  }

  closePointagesModal(): void {
    this.showPointagesModal = false;
    this.selectedEnginForPointages = null;
    this.pointagesEngin = [];
  }
}
