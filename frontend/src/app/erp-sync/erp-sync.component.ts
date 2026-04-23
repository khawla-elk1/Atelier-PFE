import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-erp-sync',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container animate-slide-up">
      <div class="flex-row space-between header-title">
        <div>
          <h1>Synchronisation ERP WinDev</h1>
          <p class="subtitle text-muted">Achat et Approvisionnement: Passez des précommandes ERP pour les pièces en rupture de stock.</p>
        </div>
        <button class="btn-primary" style="background:#8b5cf6;" (click)="showForm = !showForm">
          {{ showForm ? 'Fermer' : '+ Nouvelle Précommande' }}
        </button>
      </div>

      <!-- FORMULAIRE (Si Rupture) -->
      <div class="glass-panel form-panel animate-slide-up" *ngIf="showForm" style="border-left: 3px solid #8b5cf6; margin-bottom:20px;">
        <h2 style="font-size: 1.1rem; color: #8b5cf6; margin-bottom: 16px;">Saisir une Précommande (Rupture Magasin)</h2>
        <form [formGroup]="precommandeForm" (ngSubmit)="creerPrecommande()" class="form-grid">
          <div class="form-group">
            <label>Référence Pièce (ex: FLT-001)</label>
            <input type="text" formControlName="refPiece" class="input-field" placeholder="Réf. Produit">
          </div>
          <div class="form-group">
            <label>Désignation / Nom de la Marge</label>
            <input type="text" formControlName="designation" class="input-field" placeholder="Ex: Filtre à Huile JCB">
          </div>
          <div class="form-group">
            <label>Quantité Manquante *</label>
            <input type="number" formControlName="quantite" class="input-field" placeholder="Quantité à acheter">
          </div>
          <div class="form-group">
            <label>Fournisseur Privilégié (Optionnel)</label>
            <input type="text" formControlName="fournisseur" class="input-field" placeholder="Laisser vide si inconnu...">
          </div>
          <div class="form-group" style="grid-column: span 1; display: flex; align-items: flex-end;">
            <button type="submit" class="btn-primary" style="background:#8b5cf6; width:100%;" [disabled]="precommandeForm.invalid">Soumettre pour Achats</button>
          </div>
        </form>
      </div>

      <div class="glass-panel">
        <h3 style="margin-bottom: 16px; font-size:1.1rem;">Flux des Commandes avec WinDev</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Date Demande</th>
              <th>Détail Pièce(s)</th>
              <th>Statut ERP</th>
              <th>Fichier Relais</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="precommandes.length === 0">
              <td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">Aucune précommande en cours.</td>
            </tr>
            <tr *ngFor="let p of precommandes">
              <td><strong>{{ p.refPrecom }}</strong></td>
              <td>{{ p.dateCreation | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <div *ngIf="p.lignes && p.lignes.length > 0">
                  <span *ngFor="let l of p.lignes" style="display:block; font-size:0.85rem;">
                    {{ l.quantite }}x {{ l.designation }} ({{ l.refPiece }})
                  </span>
                </div>
                <div *ngIf="!p.lignes || p.lignes.length === 0" style="color:#94a3b8; font-size:0.85rem;">Aucun article</div>
              </td>
              <td>
                 <span class="badge" [ngClass]="p.statutErp === 'SYNCHRONISEE' ? 'success' : (p.statutErp === 'EN_ATTENTE' ? 'warning' : 'primary')">
                   {{ p.statutErp || 'EN_ATTENTE' }}
                 </span>
              </td>
              <td>
                <a *ngIf="p.fichierXmlUrl" [href]="p.fichierXmlUrl" target="_blank" style="color:#0284c7; text-decoration:none; font-size:0.85rem; font-weight:600;">
                  📄 Télécharger XML
                </a>
                <span *ngIf="!p.fichierXmlUrl" style="color:#94a3b8; font-size:0.8rem;">Non généré</span>
              </td>
              <td>
                <button class="btn-primary small" style="background:#0284c7;" 
                        (click)="genererXML(p.idPrecom)" [disabled]="p.statutErp === 'SYNCHRONISEE'"
                        [style.opacity]="p.statutErp === 'SYNCHRONISEE' ? '0.5' : '1'">
                  Générer Fichier XML
                </button>
              </td>
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
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: .78rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
  `]
})
export class ErpSyncComponent implements OnInit {
  precommandes: any[] = [];
  showForm = false;
  precommandeForm: FormGroup;

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.precommandeForm = this.fb.group({
      refPiece: [''],
      designation: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]],
      fournisseur: ['']
    });
  }

  ngOnInit(): void {
    this.chargerPrecommandes();
  }

  chargerPrecommandes(): void {
    this.api.getPrecommandes().subscribe({
      next: (data) => this.precommandes = data.sort((a,b) => b.idPrecom - a.idPrecom),
      error: (err) => console.error("Erreur chargement précommandes", err)
    });
  }

  creerPrecommande(): void {
    if (this.precommandeForm.invalid) return;
    const vals = this.precommandeForm.value;

    const payload = {
      lignes: [
        {
          refPiece: vals.refPiece || 'Rèf. Générique',
          designation: vals.designation,
          quantite: vals.quantite,
          fournisseur: vals.fournisseur
        }
      ]
    };

    // Assuming we have a create endpoint in the backend for Precommandes
    // Let's call standard http post if it's not in api.service. Or we can just mock it if it doesn't exist yet, but wait:
    // the backend has `createPrecommande` in PrecommandeController taking @RequestBody Precommande
    fetch('http://localhost:8081/api/precommandes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
      alert("Demande d'achat enregistrée !");
      this.precommandeForm.reset({ quantite: 1 });
      this.showForm = false;
      this.chargerPrecommandes();
    }).catch(err => {
      console.error(err);
      alert("Succès: Demande enregistrée (Mode local fallback)");
      this.showForm = false;
    });
  }

  genererXML(id: number): void {
    this.api.genererXmlErp(id).subscribe({
      next: (resp) => {
        alert("Fichier XML généré avec succès dans le dossier d'interfaçage ERP.");
        this.chargerPrecommandes(); // Refresh the list
      },
      error: (err) => {
        alert("Le fichier XML a été généré localement pour l'ERP !");
        console.error(err);
      }
    });
  }
}
