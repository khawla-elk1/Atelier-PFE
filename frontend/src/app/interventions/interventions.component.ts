import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-interventions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="enterprise-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestion des Interventions</h1>
          <p class="page-subtitle">Ordres de travail et historique de maintenance</p>
        </div>
        <button class="btn-primary" (click)="toggleForm()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Créer un OT
        </button>
      </div>

      <!-- KPI Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-title">En Cours</div>
          <div class="metric-value text-primary">{{ countEnCours }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Terminées</div>
          <div class="metric-value text-success">{{ countTermine }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Coût Total</div>
          <div class="metric-value text-warning">{{ totalCout | number:'1.2-2' }} MAD</div>
        </div>
      </div>

      <!-- Table View -->
      <div class="table-card">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th width="80">Réf.</th>
              <th>Matériel / Véhicule</th>
              <th>Date Entrée</th>
              <th>Immobilisation</th>
              <th>Technicien</th>
              <th>Statut</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let int of interventions">
              <td><span class="ref-text">{{ int.idStr }}</span></td>
              <td>
                <div class="engin-name">{{ int.engin }}</div>
                <div class="engin-sub">{{ int.type }}</div>
              </td>
              <td class="date-text">{{ int.dateDebut }}</td>
              <td>
                <span [class.text-danger]="int.joursArret > 30 && int.statut !== 'Clôturée'"
                      [class.text-warning]="int.joursArret > 7 && int.joursArret <= 30 && int.statut !== 'Clôturée'">
                  {{ int.joursArret > 0 ? int.joursArret + ' Jours' : "Même jour" }}
                </span>
              </td>
              <td>
                <div *ngIf="int.technicienId; else nonAssigne" class="tech-name">
                  {{ int.technicien }}
                </div>
                <ng-template #nonAssigne>
                  <select (change)="assignerTechnicien(int, $event)" class="form-control-small">
                    <option value="">-- Affecter --</option>
                    <option *ngFor="let tech of listeTechniciens" [value]="tech.idUser">
                      {{ tech.prenom }} {{ tech.nom }}
                    </option>
                  </select>
                </ng-template>
              </td>
              <td>
                <span class="badge" 
                      [class.badge-primary]="int.statut === 'Programmée' || int.statut === 'En Cours'"
                      [class.badge-warning]="int.statut === 'En Attente Pièces'"
                      [class.badge-success]="int.statut === 'Clôturée'">
                  {{ int.statut }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="btn-action btn-action-primary" *ngIf="int.statut !== 'Clôturée'" (click)="ouvrirModalPieces(int)" title="Besoins en pièces">Pièces</button>
                <button class="btn-action btn-action-warning" *ngIf="int.statut === 'Programmée' || int.statut === 'En Cours'" (click)="mettreEnAttente(int)" title="Mettre en attente">Pause</button>
                <button class="btn-action btn-action-success" *ngIf="int.statut !== 'Clôturée'" (click)="ouvrirCloture(int)" title="Clôturer">Clôturer</button>
                <button class="btn-icon btn-icon-danger" (click)="supprimerIntervention(int)" title="Supprimer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </td>
            </tr>
            <tr *ngIf="interventions.length === 0">
              <td colspan="7" class="empty-state">Aucune intervention.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Creation Modal -->
      <div class="modal-backdrop" *ngIf="showForm" (click)="toggleForm()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Nouveau Fiche Intervention</h2>
            <button class="btn-close" (click)="toggleForm()">×</button>
          </div>
          <form [formGroup]="interventionForm" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Matériel concerné *</label>
                  <input list="engins-list" formControlName="engin" class="form-control" placeholder="Rechercher..." autocomplete="off">
                  <datalist id="engins-list">
                    <option *ngFor="let engin of listeEngins" [value]="engin.matricule || engin.codeMateriel">
                      {{ engin.codeMateriel || engin.matricule }} - {{ engin.marque }} {{ engin.modele }}
                    </option>
                  </datalist>
                </div>
                <div class="form-group flex-1">
                  <label>Type *</label>
                  <select formControlName="type" class="form-control">
                    <option value="Préventive">Préventive</option>
                    <option value="Corrective">Corrective</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Date Début Prévu *</label>
                  <input type="date" formControlName="dateDebut" class="form-control">
                </div>
                <div class="form-group flex-1">
                  <label>Technicien Assigné</label>
                  <select formControlName="technicien" class="form-control">
                    <option value="">-- Sans assignation --</option>
                    <option *ngFor="let tech of listeTechniciens" [value]="tech.idUser">
                      {{ tech.prenom }} {{ tech.nom }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="toggleForm()">Annuler</button>
              <button type="submit" class="btn-primary" [disabled]="interventionForm.invalid">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Cloture Modal -->
      <div class="modal-backdrop" *ngIf="interventionACloturer" (click)="interventionACloturer = null">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Clôturer l'OT {{ interventionACloturer.idStr }}</h2>
            <button class="btn-close" (click)="interventionACloturer = null">×</button>
          </div>
          <form [formGroup]="clotureForm" (ngSubmit)="soumettreCloture()">
            <div class="modal-body">
              <div class="form-group">
                <label>Durée (Heures) *</label>
                <input type="number" step="0.5" formControlName="dureeReelle" class="form-control">
              </div>
              <div class="form-group">
                <label>Coût M.O (MAD)</label>
                <input type="number" step="0.01" formControlName="cout" class="form-control">
              </div>
              <div class="form-group">
                <label>Rapport Technique</label>
                <textarea formControlName="observations" class="form-control" rows="4"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="interventionACloturer = null">Annuler</button>
              <button type="submit" class="btn-primary" style="background-color: #059669;" [disabled]="clotureForm.invalid">Valider la clôture</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Pieces Modal -->
      <div class="modal-backdrop" *ngIf="modalPiecesActif" (click)="fermerModalPieces()">
        <div class="modal-container" style="max-width: 800px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Besoins en Pièces — {{ modalPiecesActif.idStr }}</h2>
            <button class="btn-close" (click)="fermerModalPieces()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom: 24px;">
              <label>Rechercher une pièce</label>
              <input type="text" [(ngModel)]="searchPiece" (input)="rechercherPieces()" class="form-control" placeholder="Ex: filtre...">
              <div *ngIf="searchResultsPieces.length > 0" class="search-results">
                <div *ngFor="let piece of searchResultsPieces" class="search-item" (click)="ajouterAuBesoin(piece)">
                  <div class="flex-1">
                    <div class="engin-name">{{ piece.designation }}</div>
                    <div class="engin-sub">Ref: {{ piece.reference || 'N/A' }} | Stock: {{ piece.quantiteEnStock }}</div>
                  </div>
                  <button class="btn-action btn-action-primary">+ Ajouter</button>
                </div>
              </div>
            </div>

            <div *ngIf="besoinPanier.length > 0">
              <h4 style="margin-bottom: 12px; font-weight: 600; color: #0f172a;">Panier des Besoins</h4>
              <table class="enterprise-table" style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <thead>
                  <tr>
                    <th>Pièce</th>
                    <th>Stock</th>
                    <th width="100">Qté</th>
                    <th width="50"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of besoinPanier; let i = index">
                    <td>{{ item.piece.designation }}</td>
                    <td><span class="badge" [class.badge-success]="item.piece.quantiteEnStock > 0" [class.badge-danger]="item.piece.quantiteEnStock === 0">{{ item.piece.quantiteEnStock }}</span></td>
                    <td>
                      <input type="number" [(ngModel)]="item.quantite" (ngModelChange)="verifierQteBesoin(item)" min="1" class="form-control" style="padding: 4px; text-align: center;">
                    </td>
                    <td><button class="btn-icon btn-icon-danger" (click)="retirerDuBesoin(i)">×</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="fermerModalPieces()">Fermer</button>
            <button type="button" class="btn-primary" [disabled]="besoinPanier.length === 0 || enSoumission" (click)="soumettreBesoinPieces()">Valider Besoins</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .enterprise-container { padding: 32px; background-color: #f8fafc; min-height: 100vh; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
    .page-title { font-size: 1.5rem; font-weight: 600; color: #0f172a; margin: 0 0 4px 0; }
    .page-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
    
    .btn-primary { display: flex; align-items: center; gap: 8px; background-color: #2563eb; color: white; border: none; padding: 8px 16px; font-size: 0.875rem; font-weight: 500; border-radius: 6px; cursor: pointer; transition: background-color 0.15s; }
    .btn-primary:hover { background-color: #1d4ed8; }
    .btn-primary:disabled { background-color: #94a3b8; cursor: not-allowed; }
    .btn-secondary { background-color: #ffffff; color: #334155; border: 1px solid #cbd5e1; padding: 8px 16px; font-size: 0.875rem; font-weight: 500; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
    .btn-secondary:hover { background-color: #f1f5f9; border-color: #94a3b8; }
    
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .metric-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .metric-title { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .metric-value { font-size: 1.5rem; font-weight: 700; }
    .text-warning { color: #d97706; }
    .text-danger { color: #dc2626; }
    .text-success { color: #059669; }
    .text-primary { color: #2563eb; }

    .table-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .enterprise-table { width: 100%; border-collapse: collapse; text-align: left; }
    .enterprise-table th { background-color: #f8fafc; padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    .enterprise-table td { padding: 12px 16px; font-size: 0.875rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .enterprise-table tbody tr:hover { background-color: #f8fafc; }
    .enterprise-table tbody tr:last-child td { border-bottom: none; }
    
    .ref-text { font-family: monospace; color: #64748b; font-size: 0.8125rem; font-weight: 500; }
    .engin-name { font-weight: 600; color: #0f172a; }
    .engin-sub { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
    .date-text { color: #475569; font-size: 0.8125rem; }
    .text-right { text-align: right; }
    .empty-state { text-align: center; color: #94a3b8; padding: 32px !important; }
    .tech-name { font-weight: 500; }

    .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge-primary { background-color: #dbeafe; color: #1e40af; }
    .badge-success { background-color: #d1fae5; color: #065f46; }
    .badge-danger { background-color: #fee2e2; color: #991b1b; }
    .badge-warning { background-color: #fef3c7; color: #92400e; }

    .actions-cell { display: flex; justify-content: flex-end; gap: 6px; align-items: center; }
    .btn-action { padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; border: 1px solid transparent; cursor: pointer; transition: all 0.15s; }
    .btn-action-primary { background-color: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .btn-action-primary:hover { background-color: #dbeafe; }
    .btn-action-warning { background-color: #fffbeb; color: #d97706; border-color: #fde68a; }
    .btn-action-warning:hover { background-color: #fef3c7; }
    .btn-action-success { background-color: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
    .btn-action-success:hover { background-color: #dcfce3; }
    
    .btn-icon { background: none; border: none; color: #94a3b8; padding: 4px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background-color: #fee2e2; color: #dc2626; }

    .modal-backdrop { position: fixed; inset: 0; background-color: rgba(15, 23, 42, 0.4); display: flex; justify-content: center; align-items: flex-start; padding-top: 10vh; z-index: 50; }
    .modal-container { background: white; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 100%; max-width: 600px; display: flex; flex-direction: column; max-height: 85vh; }
    .modal-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; color: #0f172a; }
    .btn-close { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; line-height: 1; padding: 0; }
    .btn-close:hover { color: #0f172a; }
    
    .modal-body { padding: 20px; overflow-y: auto; }
    .modal-footer { padding: 16px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }
    
    .form-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .flex-1 { flex: 1; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 0.8125rem; font-weight: 500; color: #334155; margin-bottom: 6px; }
    .form-control { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; color: #0f172a; box-sizing: border-box; font-family: inherit; }
    .form-control:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
    .form-control-small { padding: 4px 8px; font-size: 0.8125rem; border: 1px solid #cbd5e1; border-radius: 4px; }
    
    .search-results { border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 4px; max-height: 200px; overflow-y: auto; }
    .search-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
    .search-item:hover { background-color: #f8fafc; }
    .search-item:last-child { border-bottom: none; }
  `]
})
export class InterventionsComponent implements OnInit {
  showForm = false;
  interventionForm: FormGroup;
  clotureForm: FormGroup;
  listeEngins: any[] = [];
  listeTechniciens: any[] = [];
  interventions: any[] = [];
  interventionACloturer: any = null;

  // Modal Besoins Pièces
  modalPiecesActif: any = null;
  searchPiece = '';
  searchResultsPieces: any[] = [];
  toutesLesPieces: any[] = [];
  besoinPanier: { piece: any; quantite: number }[] = [];
  enSoumission = false;

  countEnCours = 0;
  countTermine = 0;
  totalCout = 0;

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.interventionForm = this.fb.group({
      engin: ['', Validators.required],
      type: ['Préventive', Validators.required],
      dateDebut: ['', Validators.required],
      technicien: ['']
    });

    this.clotureForm = this.fb.group({
      dureeReelle: ['', [Validators.required, Validators.min(0.5)]],
      cout: ['0', Validators.min(0)],
      observations: ['']
    });
  }

  ngOnInit(): void {
    this.chargerEngins();
    this.chargerTechniciens();
    this.chargerInterventions();
    this.chargerToutLeStock();
  }

  chargerToutLeStock(): void {
    this.api.getPieces().subscribe({
      next: (data) => this.toutesLesPieces = data,
      error: (err) => console.error('Erreur chargement stock', err)
    });
  }

  chargerEngins(): void {
    this.api.getMateriels().subscribe({
      next: (data) => this.listeEngins = data,
      error: (err) => console.error('Erreur de chargement des engins', err)
    });
  }

  chargerTechniciens(): void {
    this.api.getTechniciens().subscribe({
      next: (data) => this.listeTechniciens = data,
      error: (err) => console.error('Erreur de chargement des techniciens', err)
    });
  }

  chargerInterventions(): void {
    this.api.getInterventions().subscribe({
      next: (data) => {
        const validInterventions = data.map((dbInt: any) => {
          let strDate = '—';
          let strDateFin = '—';
          let joursArret = 0;

          if (dbInt.dateDebut) {
            const dateObj = new Date(dbInt.dateDebut);
            strDate = dateObj.toLocaleDateString('fr-FR');

            // Calcul du temps d'immobilisation
            const dateFinCal = dbInt.dateFin ? new Date(dbInt.dateFin) : new Date();
            if (dbInt.dateFin) {
              strDateFin = dateFinCal.toLocaleDateString('fr-FR');
            }

            const diffTime = Math.abs(dateFinCal.getTime() - dateObj.getTime());
            joursArret = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          return {
            idRaw: dbInt.idIntervention,
            idStr: '#INT-' + String(dbInt.idIntervention).padStart(3, '0'),
            engin: dbInt.engin ? ((dbInt.engin.codeMateriel || dbInt.engin.matricule) + ' - ' + dbInt.engin.marque + ' ' + dbInt.engin.modele) : (dbInt.enginDeclare || '— Non assigné'),
            type: dbInt.type,
            dateDebut: strDate,
            dateFin: strDateFin,
            joursArret: joursArret,
            technicien: dbInt.technicien ? `${dbInt.technicien.prenom} ${dbInt.technicien.nom}` : null,
            technicienId: dbInt.technicien?.idUser || null,
            statut: dbInt.statut || (dbInt.dateFin ? 'Clôturée' : 'Programmée'),
            cout: dbInt.cout || 0
          };
        });

        this.interventions = validInterventions.sort((a: any, b: any) => b.idRaw - a.idRaw);

        this.countEnCours = this.interventions.filter((i: any) => i.statut !== 'Clôturée').length;
        this.countTermine = this.interventions.filter((i: any) => i.statut === 'Clôturée').length;
        this.totalCout = this.interventions.reduce((sum: number, current: any) => sum + (current.cout || 0), 0);
      },
      error: (err) => console.error('Erreur chargement interventions', err)
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  onSubmit(): void {
    if (this.interventionForm.valid) {
      let selectedValue = this.interventionForm.value.engin;
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
        type: this.interventionForm.value.type,
        dateDebut: this.interventionForm.value.dateDebut ? this.interventionForm.value.dateDebut + 'T09:00:00' : null,
        technicien: this.interventionForm.value.technicien ? { idUser: this.interventionForm.value.technicien } : null
      };

      this.api.createIntervention(payload as any).subscribe({
        next: () => {
          this.chargerInterventions();
          this.interventionForm.reset({ type: 'Préventive' });
          this.showForm = false;
        },
        error: (err) => {
          console.error('Erreur sauvegarde intervention', err);
          // Fallback UI local si le backend ne marche pas pour cette requête
          const localInt = {
            id: '#INT-???',
            engin: selectedValue,
            type: this.interventionForm.value.type,
            dateDebut: this.interventionForm.value.dateDebut,
            technicien: this.interventionForm.value.technicien,
            statut: 'Programmée'
          };
          this.interventions.unshift(localInt);
          this.interventionForm.reset({ type: 'Préventive' });
          this.showForm = false;
        }
      });
    }
  }

  getBadgeClass(statut: string): string {
    if (statut === 'Programmée' || statut === 'En Cours') return 'primary';
    if (statut === 'En Attente Pièces') return 'warning';
    if (statut === 'Clôturée') return 'success';
    return '';
  }

  ouvrirCloture(int: any): void {
    this.interventionACloturer = int;
    this.clotureForm.reset({ cout: 0 });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  soumettreCloture(): void {
    if (this.clotureForm.valid && this.interventionACloturer) {
      const id = this.interventionACloturer.idRaw;
      const vals = this.clotureForm.value;

      const params = new URLSearchParams();
      params.append('dureeReelle', vals.dureeReelle);
      if (vals.cout) params.append('cout', vals.cout);
      if (vals.observations) params.append('observations', vals.observations);

      this.api.validerEtCloturerIntervention(id, params.toString()).subscribe({
        next: () => {
          alert('Intervention clôturée avec succès !');
          this.interventionACloturer = null;
          this.chargerInterventions();
        },
        error: (err) => console.error(err)
      });
    }
  }

  mettreEnAttente(int: any): void {
    if (confirm(`Mettre l'intervention ${int.idStr} en attente de pièces ?`)) {
      this.api.mettreEnAttentePieces(int.idRaw).subscribe({
        next: () => {
          alert("L'intervention est maintenant en attente de pièces.");
          this.chargerInterventions();
        },
        error: (err) => console.error("Erreur mise en attente", err)
      });
    }
  }

  assignerTechnicien(int: any, event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const techId = Number(selectEl.value);
    if (!techId) return;

    this.api.assignerTechnicien(int.idRaw, techId).subscribe({
      next: () => {
        const tech = this.listeTechniciens.find(t => t.idUser === techId);
        if (tech) {
          int.technicien = `${tech.prenom} ${tech.nom}`;
          int.technicienId = tech.idUser;
          int.statut = 'En Cours';
        }
        this.chargerInterventions();
      },
      error: (err) => console.error("Erreur affectation technicien", err)
    });
  }

  supprimerIntervention(int: any): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'intervention ${int.idStr} de l'historique ? Cette action est irréversible.`)) {
      this.api.deleteIntervention(int.idRaw).subscribe({
        next: () => {
          this.chargerInterventions();
        },
        error: (err) => {
          console.error("Erreur suppression intervention", err);
          alert("Erreur lors de la suppression. Il est possible qu'elle soit liée à d'autres données.");
        }
      });
    }
  }

  // --- MODAL BESOIN EN PIECES ---
  ouvrirModalPieces(int: any): void {
    this.modalPiecesActif = int;
    this.searchPiece = '';
    this.searchResultsPieces = [];
    this.besoinPanier = [];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  fermerModalPieces(): void {
    this.modalPiecesActif = null;
    this.searchPiece = '';
    this.searchResultsPieces = [];
    this.besoinPanier = [];
    this.enSoumission = false;
  }

  rechercherPieces(): void {
    const q = this.searchPiece.toLowerCase().trim();
    if (!q) {
      this.searchResultsPieces = [];
      return;
    }
    this.searchResultsPieces = this.toutesLesPieces
      .filter(p => p.designation?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q))
      .slice(0, 8);
  }

  ajouterAuBesoin(piece: any): void {
    const existe = this.besoinPanier.find(it => it.piece.idPiece === piece.idPiece);
    if (!existe) {
      this.besoinPanier.push({ piece, quantite: 1 });
    }
    this.searchPiece = '';
    this.searchResultsPieces = [];
  }

  retirerDuBesoin(i: number): void {
    this.besoinPanier.splice(i, 1);
  }

  verifierQteBesoin(item: any): void {
    if (item.quantite < 1) item.quantite = 1;
  }

  get countSortie(): number {
    return this.besoinPanier.filter(it => it.piece.quantiteEnStock >= it.quantite).length;
  }

  get countPreco(): number {
    return this.besoinPanier.filter(it => it.piece.quantiteEnStock < it.quantite).length;
  }

  soumettreBesoinPieces(): void {
    if (!this.modalPiecesActif || this.besoinPanier.length === 0) return;
    this.enSoumission = true;

    const itemsEnStock = this.besoinPanier.filter(it => it.piece.quantiteEnStock >= it.quantite);
    const itemsRupture = this.besoinPanier.filter(it => it.piece.quantiteEnStock < it.quantite);

    const tasks: Promise<void>[] = [];

    // 1. Items en stock → Demande de Sortie
    if (itemsEnStock.length > 0) {
      const demande = {
        interventionId: this.modalPiecesActif.idRaw,
        motifOuEngin: `Lié à l'intervention ${this.modalPiecesActif.idStr} (${this.modalPiecesActif.engin})`,
        demandeur: this.modalPiecesActif.technicien || 'Chef Atelier',
        lignes: itemsEnStock.map(it => ({ piece: { idPiece: it.piece.idPiece }, quantiteDemandee: it.quantite }))
      };
      tasks.push(this.api.creerDemandeSortie(demande).toPromise());
    }

    // 2. Items en rupture → Précommandes ERP
    for (const item of itemsRupture) {
      const precom = {
        designation: item.piece.designation,
        reference: item.piece.reference || '',
        quantite: item.quantite,
        motif: `Intervention ${this.modalPiecesActif.idStr} — ${this.modalPiecesActif.engin}`
      };
      tasks.push(this.api.creerPrecommande(precom).toPromise());
    }

    Promise.all(tasks)
      .then(() => {
        let msg = '';
        if (itemsEnStock.length) msg += `✅ ${itemsEnStock.length} article(s) → Bon de Sortie soumis au Chef d'Atelier.\n`;
        if (itemsRupture.length) msg += `📦 ${itemsRupture.length} article(s) → Précommande(s) transmise(s) à l'ERP WinDev.`;
        alert(msg);
        this.fermerModalPieces();
        if (itemsRupture.length > 0) {
          this.api.mettreEnAttentePieces(this.modalPiecesActif?.idRaw).subscribe();
        }
      })
      .catch(err => {
        console.error('Erreur soumission besoins', err);
        this.enSoumission = false;
      });
  }
}
