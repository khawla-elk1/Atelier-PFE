import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-interventions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container animate-slide-up">
      <div class="flex-row space-between header-title">
        <div>
          <h1>Interventions / Ordres de Réparation</h1>
          <p class="subtitle">Gestion du cahier de charge de l'atelier</p>
        </div>
        <button class="btn-primary" (click)="toggleForm()">
          {{ showForm ? 'Annuler' : '+ Saisir Fiche Intervention' }}
        </button>
      </div>

      <!-- KPI METRICS -->
      <div class="kpi-grid">
        <div class="glass-panel kpi-card animate-slide-up" style="animation-delay: 0.05s;">
          <div class="kpi-icon" style="background: var(--primary-light); color: var(--primary);">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
          <div class="kpi-info">
            <h3>EN COURS / PROGRAMMÉES</h3>
            <div class="kpi-value">{{ countEnCours }}</div>
            <div class="kpi-trend" style="color: var(--primary)">Atelier occupé</div>
          </div>
        </div>

        <div class="glass-panel kpi-card animate-slide-up" style="animation-delay: 0.1s;">
          <div class="kpi-icon" style="background: var(--success-light); color: var(--success);">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
          <div class="kpi-info">
            <h3>TOTAL CLÔTURÉES</h3>
            <div class="kpi-value">{{ countTermine }}</div>
            <div class="kpi-trend" style="color: var(--success)">Machines remises en service</div>
          </div>
        </div>

        <div class="glass-panel kpi-card animate-slide-up" style="animation-delay: 0.15s;">
          <div class="kpi-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div class="kpi-info">
            <h3>COÛT TOTAL M.O / AUTRES</h3>
            <div class="kpi-value">{{ totalCout | number:'1.2-2' }} MAD</div>
            <div class="kpi-trend" style="color: #8b5cf6">Global des réparations</div>
          </div>
        </div>
      </div>

      <!-- ===== FORMULAIRE D'AJOUT ===== -->
      <div *ngIf="showForm" class="glass-panel form-panel animate-slide-up" style="margin-bottom: 20px; border-left: 3px solid var(--accent);">
        <h2 style="margin-bottom: 16px; font-size: 1.1rem;">Nouvelle Fiche Intervention</h2>
        <form [formGroup]="interventionForm" (ngSubmit)="onSubmit()" class="form-grid">
          <div class="form-group">
            <label>Véhicule / Matériel Concerné *</label>
            <input list="engins-list" formControlName="engin" class="input-field" placeholder="Rechercher un matériel (ex: CH-09, CAT)..." autocomplete="off">
            <datalist id="engins-list">
              <option *ngFor="let engin of listeEngins" [value]="engin.matricule || engin.codeMateriel">
                {{ engin.codeMateriel || engin.matricule }} - {{ engin.marque }} {{ engin.modele }}
              </option>
            </datalist>
          </div>
          <div class="form-group">
            <label>Type d'intervention *</label>
            <select formControlName="type" class="input-field">
              <option value="Préventive">Préventive</option>
              <option value="Corrective">Corrective</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date Début Prévu *</label>
            <input type="date" formControlName="dateDebut" class="input-field">
          </div>
          <div class="form-group">
            <label>Technicien Assigné</label>
            <select formControlName="technicien" class="input-field">
              <option value="">-- Sans assignation --</option>
              <option *ngFor="let tech of listeTechniciens" [value]="tech.idUser">
                {{ tech.prenom }} {{ tech.nom }}
              </option>
            </select>
          </div>
          <div class="form-group" style="display:flex; align-items: flex-end;">
            <button type="submit" class="btn-primary" [disabled]="interventionForm.invalid" style="width:100%">
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      <!-- ===== MODAL BESOIN EN PIECES ===== -->
      <div class="modal-overlay" *ngIf="modalPiecesActif">
        <div class="modal-content animate-slide-up" style="max-width: 720px; width: 95%;">
          <div class="modal-header" style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 12px 12px 0 0;">
            <h2 style="font-size: 1.15rem; color: #fff; margin: 0; display: flex; align-items: center; gap: 10px;">
              <svg width="22" height="22" fill="none" stroke="#60a5fa" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path></svg>
              Besoins en Pièces — {{ modalPiecesActif?.idStr }}
            </h2>
            <button (click)="fermerModalPieces()" style="background:rgba(255,255,255,.15); border:none; border-radius:6px; padding: 4px 10px; font-size:1.2rem; cursor:pointer; color:#fff; line-height:1;">&#x2715;</button>
          </div>

          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            <!-- Bloc Recherche -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <label style="font-size:0.78rem; font-weight:600; color:#475569; text-transform:uppercase; display:block; margin-bottom:8px;">Rechercher une Pièce dans le Catalogue</label>
              <div style="display:flex; gap:8px;">
                <input type="text" [(ngModel)]="searchPiece" (input)="rechercherPieces()" 
                       placeholder="Ex: filtre, courroie, roulement..." 
                       class="input-field" style="flex:1; font-size:0.9rem;">
              </div>

              <!-- Résultats de Recherche -->
              <div *ngIf="searchResultsPieces.length > 0" style="margin-top: 12px; border: 1px solid #e2e8f0; border-radius: 6px; overflow:hidden; background:#fff;">
                <div *ngFor="let piece of searchResultsPieces" 
                     class="piece-suggestion-item"
                     (click)="ajouterAuBesoin(piece)">
                  <div>
                    <span style="font-weight:600; font-size:0.9rem;">{{ piece.designation }}</span>
                    <span style="display:block; font-size:0.77rem; color:#64748b;">Réf: {{ piece.reference || 'N/A' }} &nbsp;|&nbsp; Emplacement: {{ piece.emplacement || 'N/A' }}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span class="badge" [ngClass]="piece.quantiteEnStock > 2 ? 'success' : (piece.quantiteEnStock > 0 ? 'warning' : 'danger')">
                      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-right:3px;"></span>
                      Stock: {{ piece.quantiteEnStock }}
                    </span>
                    <button class="btn-primary small" style="padding:4px 10px; font-size:0.78rem;">
                      + Ajouter
                    </button>
                  </div>
                </div>
              </div>
              <p *ngIf="searchPiece && searchResultsPieces.length === 0" style="color:#94a3b8; font-size:0.85rem; margin:8px 0 0;">
                Aucune pièce trouvée. Elle sera commandée via Précommande ERP.
              </p>
            </div>

            <!-- Panier des Besoins -->
            <div *ngIf="besoinPanier.length > 0">
              <h3 style="font-size:0.9rem; font-weight:700; color:#334155; margin-bottom:10px;">Pièces Sélectionnées :</h3>
              <table class="data-table" style="font-size:0.88rem;">
                <thead style="background:#f1f5f9;">
                  <tr>
                    <th>Désignation</th>
                    <th style="text-align:center;">Stock Dispo</th>
                    <th style="text-align:center; width:90px;">Qte Demandée</th>
                    <th style="text-align:center;">Route</th>
                    <th style="width:40px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of besoinPanier; let i = index">
                    <td style="font-weight:500;">{{ item.piece.designation }}</td>
                    <td style="text-align:center;">
                      <span class="badge" [ngClass]="item.piece.quantiteEnStock > 0 ? 'success' : 'danger'">{{ item.piece.quantiteEnStock }}</span>
                    </td>
                    <td style="text-align:center;">
                      <input type="number" [(ngModel)]="item.quantite" (ngModelChange)="verifierQteBesoin(item)" 
                             min="1" class="form-control" 
                             style="width:60px; text-align:center; padding:4px; border:1px solid #cbd5e1; border-radius:4px; font-weight:bold;">
                    </td>
                    <td style="text-align:center;">
                      <span *ngIf="item.piece.quantiteEnStock >= item.quantite" 
                            class="badge success" style="font-size:0.75rem; display:inline-flex; align-items:center; gap:4px;">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Sortie Magasin
                      </span>
                      <span *ngIf="item.piece.quantiteEnStock < item.quantite" 
                            class="badge" style="background:#f3e8ff; color:#7c3aed; font-size:0.75rem; display:inline-flex; align-items:center; gap:4px;">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path></svg>
                        Précommande ERP
                      </span>
                    </td>
                    <td>
                      <button (click)="retirerDuBesoin(i)" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1rem; font-weight:700;">✕</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <!-- Résumé -->
              <div style="margin-top: 14px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size:0.85rem; color:#475569; display:flex; gap:20px;">
                <span style="display:flex; align-items:center; gap:6px;"><svg width="16" height="16" fill="none" stroke="#16a34a" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> <strong>{{ countSortie }}</strong> article(s) → Bon de Sortie</span>
                <span style="display:flex; align-items:center; gap:6px;"><svg width="16" height="16" fill="none" stroke="#7c3aed" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path></svg> <strong>{{ countPreco }}</strong> article(s) → Précommande</span>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #f8fafc; display:flex; justify-content:space-between; align-items:center; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
            <button type="button" class="btn-primary" style="background:white; color:#475569; border:1px solid #cbd5e1; box-shadow:none;" (click)="fermerModalPieces()">Annuler</button>
            <button type="button" class="btn-primary" 
                    [disabled]="besoinPanier.length === 0 || enSoumission"
                    style="background: linear-gradient(135deg, #0f172a, #1d4ed8); display:flex; align-items:center; gap:8px;"
                    (click)="soumettreBesoinPieces()">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
              Valider les Besoins
            </button>
          </div>
        </div>
      </div>

      <!-- ===== MODAL DE CLOTURE ===== -->
      <div class="modal-overlay" *ngIf="interventionACloturer">
        <div class="modal-content animate-slide-up">
          <div class="modal-header">
            <h2 style="font-size: 1.25rem; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
              <svg width="24" height="24" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Clôturer l'Ordre de Réparation {{ interventionACloturer.idStr }}
            </h2>
            <button (click)="interventionACloturer = null" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; line-height: 1;">&times;</button>
          </div>
          
          <form [formGroup]="clotureForm" (ngSubmit)="soumettreCloture()">
            <div class="modal-body">
              <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; color: #475569; display: flex; align-items: center; gap: 16px;">
                <span class="badge" style="background:#e2e8f0; color:#334155"><svg width="14" height="14" style="margin-right:4px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>{{ interventionACloturer.engin }}</span>
                <span><strong>Type:</strong> {{ interventionACloturer.type }}</span>
                <span><strong>Ouvert le:</strong> {{ interventionACloturer.dateDebut }}</span>
              </div>

              <div class="form-group" style="margin-bottom: 16px;">
                <label>Durée d'Intervention (Total des Heures travaillées) <span style="color:red">*</span></label>
                <input type="number" step="0.5" formControlName="dureeReelle" class="input-field" placeholder="Ex: 5.5">
              </div>
              
              <div class="form-group" style="margin-bottom: 16px;">
                <label>Coût M.O ou Externe (MAD)</label>
                <input type="number" step="0.01" formControlName="cout" class="input-field" placeholder="Ex: 500">
                <p style="font-size:0.8rem; color:#94a3b8; margin-top:4px; margin-bottom:0;">Info: Le coût des pièces est calculé via le magasin.</p>
              </div>

              <div class="form-group" style="margin-bottom: 16px;">
                <label>Rapport Technique de Clôture</label>
                <textarea formControlName="observations" class="input-field" placeholder="Décrivez les réparations effectuées..." style="min-height: 100px; resize: vertical; padding: 12px;"></textarea>
              </div>
            </div>
            
            <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #f8fafc; display: flex; justify-content: flex-end; gap: 12px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
              <button type="button" class="btn-primary" style="background:white; color:#475569; border: 1px solid #cbd5e1; box-shadow: none;" (click)="interventionACloturer = null">Annuler</button>
              <button type="submit" class="btn-primary" style="background:#10b981; display:flex; align-items:center; gap:6px;" [disabled]="clotureForm.invalid">
                 <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg> 
                 Validation Finale
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="glass-panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Matériel / Véhicule</th>
              <th>Date Entrée</th>
              <th>Date Sortie</th>
              <th>Immobilisation</th>
              <th>Technicien</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let int of interventions">
              <td><strong>{{ int.idStr }}</strong></td>
              <td>{{ int.engin }} <span style="display:block; font-size:0.75rem; color:#64748b">{{ int.type }}</span></td>
              <td>{{ int.dateDebut }}</td>
              <td>
                <span *ngIf="int.dateFin !== '—'">{{ int.dateFin }}</span>
                <span *ngIf="int.dateFin === '—'" style="color:var(--text-muted); font-style:italic;">En cours...</span>
              </td>
              <td>
                <span style="font-weight:600;" [ngStyle]="{'color': int.joursArret > 30 && int.statut !== 'Clôturée' ? 'var(--danger)' : (int.joursArret > 7 && int.statut !== 'Clôturée' ? 'var(--warning)' : 'var(--text)')}">
                  {{ int.joursArret > 0 ? int.joursArret + ' Jours' : "Même jour" }}
                </span>
                <div *ngIf="int.joursArret > 30 && int.statut !== 'Clôturée'" style="font-size:0.75rem; color:var(--danger); display:flex; align-items:center; gap:4px; margin-top:4px;">
                   <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"></path></svg>
                   Charge critique
                </div>
              </td>
              <td>
                <div *ngIf="int.technicienId; else nonAssigne">
                  <span style="font-weight:500;">{{ int.technicien }}</span>
                </div>
                <ng-template #nonAssigne>
                  <select (change)="assignerTechnicien(int, $event)" 
                          class="input-field" 
                          style="padding: 4px 8px; font-size: 0.82rem; border-radius: 6px; border: 1px solid #cbd5e1; background: #fafafa; cursor:pointer; min-width: 130px;"
                          title="Affecter un technicien">
                    <option value="">-- Affecter --</option>
                    <option *ngFor="let tech of listeTechniciens" [value]="tech.idUser">
                      {{ tech.prenom }} {{ tech.nom }}
                    </option>
                  </select>
                </ng-template>
              </td>
              <td>
                <span class="badge" [ngClass]="getBadgeClass(int.statut)">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor; margin-right:4px;"></span>
                  {{ int.statut }}
                </span>
              </td>
              <td class="actions-cell">
                <div class="action-buttons-group">
                  <!-- Besoin Pièces -->
                  <button class="btn-action primary"
                          *ngIf="int.statut !== 'Clôturée'"
                          (click)="ouvrirModalPieces(int)"
                          title="Gérer les besoins en pièces">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path></svg>
                    <span>Pièces</span>
                  </button>
  
                  <!-- Bouton Attente Pièces -->
                  <button class="btn-action warning" 
                          *ngIf="int.statut === 'Programmée' || int.statut === 'En Cours'" 
                          (click)="mettreEnAttente(int)" 
                          title="Mettre en attente de pièces">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Pause</span>
                  </button>
  
                  <button class="btn-action success" *ngIf="int.statut !== 'Clôturée'" (click)="ouvrirCloture(int)" title="Clôturer l'intervention">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                    <span>Clôturer</span>
                  </button>

                  <!-- Suppression -->
                  <button class="btn-icon-ghost" (click)="supprimerIntervention(int)" title="Supprimer définitivement l'intervention">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                  
                  <span class="archived-label" *ngIf="int.statut === 'Clôturée'">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                    Archivée
                  </span>
                </div>
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
    
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
    }
    .modal-content {
      background: white; border-radius: 12px; width: 100%; max-width: 600px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .modal-header {
      padding: 16px 24px; border-bottom: 1px solid #e2e8f0;
      display: flex; justify-content: space-between; align-items: center;
      background: #f8fafc; border-top-left-radius: 12px; border-top-right-radius: 12px;
    }
    .modal-body { padding: 24px; }
    .piece-suggestion-item {
      display: flex; justify-content: space-between; align-items: center; 
      padding: 10px 14px; border-bottom: 1px solid #f1f5f9; 
      cursor: pointer; transition: background 0.15s;
    }
    .piece-suggestion-item:hover { background: #f8fafc; }

    .actions-cell { width: 1%; white-space: nowrap; }
    .action-buttons-group { display: flex; gap: 4px; }
    .btn-action {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px;
      border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s var(--ease); border: 1px solid #e2e8f0;
      background: #fff; color: #475569;
    }
    .btn-action:hover { border-color: #cbd5e1; background: #f8fafc; color: #1e293b; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .btn-action.primary { color: #1d4ed8; }
    .btn-action.primary:hover { border-color: #1d4ed8; background: #eff6ff; }
    .btn-action.warning { color: #d97706; }
    .btn-action.warning:hover { border-color: #d97706; background: #fffbeb; }
    .btn-action.success { color: #059669; }
    .btn-action.success:hover { border-color: #059669; background: #ecfdf5; }
    
    .btn-icon-ghost { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; border: none; background: transparent; color: #94a3b8; transition: all 0.2s; }
    .btn-icon-ghost:hover { color: #dc2626; background: #fef2f2; }
    
    .archived-label { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #94a3b8; font-weight: 500; padding: 6px 10px; background: #f1f5f9; border-radius: 6px; }
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

      this.api.createIntervention(payload).subscribe({
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
      if(vals.cout) params.append('cout', vals.cout);
      if(vals.observations) params.append('observations', vals.observations);

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
    if(confirm(`Mettre l'intervention ${int.idStr} en attente de pièces ?`)) {
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
