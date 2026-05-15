import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-engins',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="shell animate-slide-up">
      <!-- MAIN -->
      <div class="main">
        <div class="content">
          <div class="ph">
            <div>
              <div class="pt">Parc Matériels</div>
              <div class="ps">{{ filteredEngins.length }} matériels affichés sur {{ actuelsCount }} en parc — Flotte STAPORT</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="icon-btn" aria-label="Exporter Excel"><i class="ti ti-file-spreadsheet" aria-hidden="true"></i></button>
              <button class="icon-btn" aria-label="Imprimer"><i class="ti ti-printer" aria-hidden="true"></i></button>
              <button class="btn-add" (click)="toggleForm()"><i class="ti ti-plus" aria-hidden="true"></i> {{ showForm ? 'Annuler' : 'Ajouter' }}</button>
            </div>
          </div>

          <!-- KPI CARDS -->
          <div class="kpi-grid">
            <div class="kpi" *ngFor="let k of kpis" [class.active]="selectedCategory === getKpiCat(k.type)" (click)="onKpiClick(k.type)">
              <div class="kpi-icon" [ngClass]="{
                'ki-all': k.type === 'total',
                'ki-eng': k.type === 'engin',
                'ki-cam': k.type === 'camion',
                'ki-veh': k.type === 'voiture',
                'ki-acc': k.type === 'accessoire',
                'ki-out': k.type === 'vendu'
              }">
                 <i class="ti" [ngClass]="{
                   'ti-layout-grid': k.type === 'total',
                   'ti-crane': k.type === 'engin',
                   'ti-truck': k.type === 'camion',
                   'ti-car': k.type === 'voiture',
                   'ti-settings': k.type === 'accessoire',
                   'ti-x': k.type === 'vendu'
                 }"></i>
              </div>
              <div><div class="kpi-val">{{ k.value }}</div><div class="kpi-lbl">{{ k.label }}</div></div>
            </div>
          </div>

          <!-- TOOLBAR -->
          <div class="toolbar">
            <div class="search-row">
              <div class="sw"><i class="ti ti-search" aria-hidden="true"></i>
                <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Rechercher par code, marque, modèle, châssis, immatriculation…">
              </div>
              <div class="vbtns">
                <button class="vbtn" [class.active]="currentView === 'table'" (click)="currentView = 'table'"><i class="ti ti-layout-list"></i></button>
                <button class="vbtn" [class.active]="currentView === 'cards'" (click)="currentView = 'cards'"><i class="ti ti-layout-grid"></i></button>
              </div>
            </div>
            <div class="pills-row">
              <div class="pgrp">
                <span class="plbl">Catégorie :</span>
                <button *ngFor="let cat of categories" class="pill" [class.active]="selectedCategory === cat" (click)="selectCategory(cat)">{{ cat }}</button>
              </div>
              <div class="divider"></div>
              <div class="pgrp">
                <span class="plbl">Statut :</span>
                <button *ngFor="let stat of statusOptions" class="pill" [class.active]="selectedStatus === stat" (click)="selectStatus(stat)">{{ stat }}</button>
              </div>
            </div>
          </div>

          <!-- TABLE VIEW -->
          <div class="view" [class.active]="currentView === 'table'">
            <div class="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th style="width:42px"><input type="checkbox" style="cursor:pointer"></th>
                    <th style="width:160px">Matériel</th>
                    <th style="width:110px">Code</th>
                    <th style="width:100px">Marque</th>
                    <th style="width:130px">Modèle / Type</th>
                    <th style="width:100px">Catégorie</th>
                    <th style="width:140px">N° Châssis</th>
                    <th style="width:110px">Immatriculation</th>
                    <th style="width:100px">Heures Prod.</th>
                    <th style="width:85px">Statut</th>
                    <th style="width:90px">Chantier</th>
                    <th style="width:80px">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let engin of paginatedEngins" (click)="selectEngin(engin)" style="cursor:pointer">
                    <td><input type="checkbox" style="cursor:pointer" (click)="$event.stopPropagation()"></td>
                    <td>
                      <div class="mat-cell">
                        <div class="mat-thumb" [ngClass]="getCatColor(engin.categorie)">
                          <i class="ti" [ngClass]="getCatIcon(engin.categorie)"></i>
                        </div>
                        <div><div class="mat-name">{{ engin.codeMateriel || engin.matricule }}</div><div class="mat-sub">{{ engin.marque }}</div></div>
                      </div>
                    </td>
                    <td><span class="code-tag">{{ engin.codeMateriel || engin.matricule | slice:0:10 }}</span></td>
                    <td>{{ engin.marque }}</td>
                    <td style="font-size:12px;color:#5C6E8A">{{ engin.modele }}</td>
                    <td>{{ engin.categorie }}</td>
                    <td style="font-family:monospace;font-size:11px;color:#5C6E8A">{{ engin.serieChassis | slice:0:16 }}</td>
                    <td style="font-family:monospace;font-size:12px;font-weight:600">{{ engin.immatriculation || '—' }}</td>
                    <td><span class="num-blue" style="font-weight:700">{{ engin.heuresProductionCumulees || 0 | number:'1.0-0' }} h</span></td>
                    <td>
                      <span class="badge" [ngClass]="getStatBadge(engin.statut)">
                        <span class="dot"></span> {{ engin.statut }}
                      </span>
                    </td>
                    <td style="font-size:12px;color:#5C6E8A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      <span *ngIf="engin.chantier"><b>{{ engin.chantier.codeErp || 'LOCAL' }}</b> &middot; {{ engin.chantier.nom }}</span>
                      <span *ngIf="!engin.chantier">&mdash;</span>
                    </td>
                    <td>
                      <div class="actions-cell">
                        <button class="icon-btn" (click)="selectEngin(engin); $event.stopPropagation()" aria-label="Voir fiche"><i class="ti ti-eye"></i></button>
                        <button class="icon-btn" aria-label="Modifier" (click)="$event.stopPropagation()"><i class="ti ti-edit"></i></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pagination" *ngIf="totalPages > 1">
              <span style="font-size:12px;color:#8B9BB4">{{ filteredEngins.length }} résultat(s)</span>
              <div class="pg-btns">
                <button class="pg-btn" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1"><i class="ti ti-chevron-left"></i></button>
                <span style="font-size:12px; padding: 5px 10px; color:#5C6E8A;">Page {{ currentPage }} / {{ totalPages }}</span>
                <button class="pg-btn" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages"><i class="ti ti-chevron-right"></i></button>
              </div>
            </div>
          </div>

          <!-- CARDS VIEW -->
          <div class="view" [class.active]="currentView === 'cards'">
            <div class="card-grid">
              <div class="mat-card" *ngFor="let engin of paginatedEngins" (click)="selectEngin(engin)">
                <div class="mc-header">
                  <div class="mc-icon" [ngClass]="getCatColor(engin.categorie)"><i class="ti" [ngClass]="getCatIcon(engin.categorie)"></i></div>
                  <span class="badge" [ngClass]="getStatBadge(engin.statut)"><span class="dot"></span>{{ engin.statut }}</span>
                </div>
                <div style="font-size:14px;font-weight:700;color:#1B2438;margin-bottom:2px">{{ engin.codeMateriel || engin.matricule }}</div>
                <div style="font-size:12px;color:#8B9BB4">{{ engin.marque }} · {{ engin.categorie }}</div>
                <div class="mc-fields">
                  <div><div class="mc-field-lbl">Modèle</div><div class="mc-field-val">{{ engin.modele || '—' }}</div></div>
                  <div><div class="mc-field-lbl">Chantier</div><div class="mc-field-val">{{ engin.chantier ? (engin.chantier.codeErp || 'LOCAL') + ' &middot; ' + engin.chantier.nom : '&mdash;' }}</div></div>
                  <div><div class="mc-field-lbl">Heures Prod.</div><div class="mc-field-val" style="color:#2563EB;font-weight:700">{{ engin.heuresProductionCumulees || 0 | number:'1.0-0' }} h</div></div>
                  <div><div class="mc-field-lbl">Immat.</div><div class="mc-field-val" style="font-family:monospace">{{ engin.immatriculation || '—' }}</div></div>
                  <div><div class="mc-field-lbl">Châssis</div><div class="mc-field-val" style="font-family:monospace;font-size:11px">{{ engin.serieChassis | slice:0:14 }}</div></div>
                </div>
              </div>
            </div>
            <div class="pagination" style="margin-top:14px" *ngIf="totalPages > 1">
              <span style="font-size:12px;color:#8B9BB4">{{ filteredEngins.length }} résultat(s)</span>
              <div class="pg-btns">
                <button class="pg-btn" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1"><i class="ti ti-chevron-left"></i></button>
                <span style="font-size:12px; padding: 5px 10px; color:#5C6E8A;">Page {{ currentPage }} / {{ totalPages }}</span>
                <button class="pg-btn" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages"><i class="ti ti-chevron-right"></i></button>
              </div>
            </div>
          </div>

          <!-- DETAIL OVERLAY -->
          <div id="detail-overlay" *ngIf="showForm || selectedEngin" style="display:flex;position:fixed;inset:0;background:rgba(15,20,40,.45);z-index:100;align-items:center;justify-content:center">
            <div style="background:#fff;border-radius:14px;width:600px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.18)">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #E8ECF2">
                <div>
                  <div style="font-size:16px;font-weight:700;color:#1B2438">{{ selectedEngin ? 'Fiche Matériel' : 'Nouveau Matériel' }}</div>
                  <div style="font-size:12px;color:#8B9BB4;margin-top:2px">{{ selectedEngin ? (selectedEngin.codeMateriel || selectedEngin.matricule) : 'Ajouter à la flotte' }}</div>
                </div>
                <button class="icon-btn" (click)="closeDetail()" aria-label="Fermer"><i class="ti ti-x" aria-hidden="true"></i></button>
              </div>
              
              <form [formGroup]="enginForm" (ngSubmit)="onSubmit()">
                <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  
                  <div *ngIf="selectedEngin" style="grid-column:1/-1;display:flex;align-items:center;gap:12px;padding:12px;background:#F8FAFC;border-radius:9px;border:1px solid #E8ECF2">
                    <div class="mat-thumb" [ngClass]="getCatColor(selectedEngin.categorie)"><i class="ti" [ngClass]="getCatIcon(selectedEngin.categorie)"></i></div>
                    <div>
                      <div style="font-size:14px;font-weight:700;color:#1B2438">{{ selectedEngin.codeMateriel || selectedEngin.matricule }}</div>
                      <div style="font-size:12px;color:#8B9BB4">{{ selectedEngin.marque }} · {{ selectedEngin.type }}</div>
                    </div>
                    <div style="margin-left:auto">
                      <span class="badge" [ngClass]="getStatBadge(selectedEngin.statut)"><span class="dot"></span> {{ selectedEngin.statut }}</span>
                    </div>
                  </div>

                  <div><div class="mc-field-lbl">Code Matériel (ex: C754) *</div><input formControlName="codeMateriel" class="custom-input" placeholder="Ex: C754"></div>
                  <div><div class="mc-field-lbl">Matricule (Identifiant) *</div><input formControlName="matricule" class="custom-input"></div>
                  <div><div class="mc-field-lbl">Marque *</div><input formControlName="marque" class="custom-input"></div>
                  <div><div class="mc-field-lbl">Modèle *</div><input formControlName="modele" class="custom-input"></div>
                  <div><div class="mc-field-lbl">Type / Genre *</div><input formControlName="type" class="custom-input"></div>
                  
                  <div><div class="mc-field-lbl">Catégorie</div>
                    <select formControlName="categorie" class="custom-input">
                      <option value="Engin">Engin</option>
                      <option value="Camion">Camion</option>
                      <option value="Voiture">Voiture</option>
                      <option value="Accessoire / Organe">Accessoire / Organe</option>
                    </select>
                  </div>
                  <div><div class="mc-field-lbl">N° Châssis</div><input formControlName="serieChassis" class="custom-input" style="font-family:monospace"></div>
                  <div><div class="mc-field-lbl">Statut</div>
                    <select formControlName="statut" class="custom-input">
                      <option value="ACTIF">ACTIF</option>
                      <option value="EN_PANNE">EN_PANNE</option>
                      <option value="VENDU">VENDU</option>
                      <option value="FERRAILLE">FERRAILLE</option>
                    </select>
                  </div>
                  
                  <div><div class="mc-field-lbl">Heures Production (ERP)</div>
                    <div style="position:relative;">
                      <input [value]="selectedEngin?.heuresProductionCumulees || 0" class="custom-input" readonly style="background:#F1F5F9; color:#2563EB; font-weight:700;">
                      <span style="position:absolute; right:10px; top:50%; transform:translateY(-50%); font-size:11px; font-weight:700; color:#2563EB;">h</span>
                    </div>
                  </div>

                  <div>
                    <div class="mc-field-lbl" style="display:flex;align-items:center;gap:4px">
                      Prix Moyen Pondéré (Loyer J.) <i class="ti ti-info-circle" title="En cours de développement par l'expert comptable" style="font-size:12px;color:#2563EB"></i>
                    </div>
                    <div style="position:relative;">
                      <input formControlName="prixMoyenPondere" class="custom-input" placeholder="Ex: 1500" type="number" style="padding-right:45px;">
                      <span style="position:absolute; right:10px; top:50%; transform:translateY(-50%); font-size:11px; font-weight:700; color:#8B9BB4;">MAD</span>
                    </div>
                  </div>
                  
                  <div *ngIf="selectedEngin" style="grid-column:1/-1; margin-top: 10px;">
                    <div class="mc-field-lbl">Chantier Affecté</div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                      <select class="custom-input" [ngModel]="selectedEngin?.chantier?.idChantier" (ngModelChange)="affecterChantier(selectedEngin.idEngin, $event)" [ngModelOptions]="{standalone: true}">
                        <option [ngValue]="null">Aucun (Au parc)</option>
                        <option *ngFor="let c of tousChantiers" [ngValue]="c.idChantier">
                          {{ c.codeErp ? '[' + c.codeErp + '] ' : '' }}{{ c.nom }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #E8ECF2">
                  <button type="button" (click)="closeDetail()" style="padding:8px 14px;border:1px solid #E8ECF2;background:none;border-radius:7px;font-size:13px;color:#5C6E8A;cursor:pointer">Annuler</button>
                  <button type="submit" [disabled]="enginForm.invalid && !selectedEngin" style="display:inline-flex;align-items:center;gap:6px;background:#2563EB;color:#fff;border:none;padding:8px 16px;border-radius:7px;font-size:13px;font-weight:500;cursor:pointer">
                    <i class="ti ti-device-floppy"></i> Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    *{box-sizing:border-box;}
    .shell{display:flex;min-height:100%;}
    .main{flex:1;background:#F4F6FA;overflow:hidden;border-radius:12px;border:1px solid #E8ECF2;}
    .content{padding:20px;}
    .ph{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}
    .pt{font-size:22px;font-weight:700;color:#1B2438}
    .ps{font-size:13px;color:#8B9BB4;margin-top:3px}
    .btn-add{display:inline-flex;align-items:center;gap:7px;background:#2563EB;color:#fff;border:none;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;transition:0.2s;}
    .btn-add:hover{background:#1d4ed8;}
    .kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:18px}
    .kpi{background:#fff;border:1px solid #E8ECF2;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:11px;cursor:pointer;transition:border-color .15s}
    .kpi:hover{border-color:#2563EB}
    .kpi.active{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
    .kpi-icon{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
    .ki-all{background:#EBF1FE;color:#2563EB}
    .ki-eng{background:#FEF3EB;color:#EA7C1B}
    .ki-cam{background:#EBFAF3;color:#16A34A}
    .ki-veh{background:#F0EBFE;color:#7C3AED}
    .ki-acc{background:#FEF9EB;color:#CA8A04}
    .ki-out{background:#FEEBEB;color:#E24B4A}
    .kpi-val{font-size:20px;font-weight:700;color:#1B2438;line-height:1}
    .kpi-lbl{font-size:11px;color:#8B9BB4;margin-top:2px;white-space:nowrap}
    .toolbar{background:#fff;border:1px solid #E8ECF2;border-radius:10px;padding:14px 16px;margin-bottom:14px}
    .search-row{display:flex;align-items:center;gap:10px;margin-bottom:12px}
    .sw{flex:1;position:relative}
    .sw i{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#8B9BB4;font-size:16px;pointer-events:none}
    .sw input{padding:8px 10px 8px 36px;width:100%;border:1px solid #E8ECF2;border-radius:8px;font-size:13px;color:#1B2438;background:#F8FAFC;outline:none;transition:0.2s;}
    .sw input:focus{border-color:#2563EB;background:#fff}
    .vbtns{display:flex;gap:3px;background:#F4F6FA;border-radius:7px;padding:3px}
    .vbtn{padding:5px 9px;border:none;background:none;border-radius:5px;cursor:pointer;color:#8B9BB4;font-size:14px;display:flex;align-items:center;transition:0.2s;}
    .vbtn.active{background:#fff;color:#2563EB;box-shadow:0 1px 3px rgba(0,0,0,.08)}
    .pills-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .pgrp{display:flex;align-items:center;gap:5px}
    .plbl{font-size:11px;color:#8B9BB4;font-weight:500;margin-right:2px}
    .pill{padding:5px 12px;border-radius:99px;border:1px solid #E8ECF2;background:#fff;font-size:12px;font-weight:500;color:#5C6E8A;cursor:pointer;transition:0.2s;}
    .pill.active{background:#2563EB;color:#fff;border-color:#2563EB}
    .pill:hover:not(.active){background:#F4F6FA}
    .divider{width:1px;height:20px;background:#E8ECF2}
    .tbl-wrap{background:#fff;border:1px solid #E8ECF2;border-radius:10px;overflow:hidden}
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th{text-align:left;padding:10px 13px;font-size:10px;font-weight:700;color:#8B9BB4;text-transform:uppercase;letter-spacing:.07em;background:#F8FAFC;border-bottom:1px solid #E8ECF2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    td{padding:0 13px;font-size:13px;color:#1B2438;border-bottom:1px solid #F0F2F6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;height:48px;vertical-align:middle}
    tr:last-child td{border-bottom:none}
    tbody tr:hover{background:#F8FAFC}
    .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600}
    .b-actif{background:#EBFAF3;color:#15803D;border:1px solid #BBF7D0}
    .b-panne{background:#FEEBEB;color:#C41D1D;border:1px solid #FCA5A5}
    .b-vendu{background:#F1EFE8;color:#5F5E5A;border:1px solid #D3D1C7}
    .b-ferr{background:#FEF3EB;color:#C05621;border:1px solid #FED7AA}
    .dot{width:5px;height:5px;border-radius:50%;background:currentColor;display:inline-block}
    .mat-thumb{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
    .mt-eng{background:#FEF3EB;color:#EA7C1B}
    .mt-cam{background:#EBFAF3;color:#16A34A}
    .mt-veh{background:#EBF1FE;color:#2563EB}
    .mt-acc{background:#F0EBFE;color:#7C3AED}
    .mat-cell{display:flex;align-items:center;gap:9px}
    .mat-name{font-size:13px;font-weight:600;color:#1B2438}
    .mat-sub{font-size:11px;color:#8B9BB4}
    .code-tag{font-family:monospace;font-size:11px;background:#F0F2F6;color:#5C6E8A;padding:2px 7px;border-radius:4px}
    .icon-btn{background:none;border:1px solid #E8ECF2;border-radius:6px;padding:5px 7px;cursor:pointer;color:#5C6E8A;display:inline-flex;align-items:center;font-size:15px;transition:0.2s;}
    .icon-btn:hover{background:#F4F6FA;color:#1B2438}
    .actions-cell{display:flex;gap:5px;align-items:center}
    .card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .mat-card{background:#fff;border:1px solid #E8ECF2;border-radius:10px;padding:16px;cursor:pointer;transition:border-color .15s,box-shadow .15s}
    .mat-card:hover{border-color:#2563EB;box-shadow:0 2px 8px rgba(37,99,235,.1)}
    .mc-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .mc-icon{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px}
    .mc-fields{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #F0F2F6}
    .mc-field-lbl{font-size:10px;font-weight:600;color:#8B9BB4;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
    .mc-field-val{font-size:12px;color:#1B2438;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .pagination{display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-size:12px;color:#8B9BB4}
    .pg-btns{display:flex;gap:4px}
    .pg-btn{padding:5px 10px;border:1px solid #E8ECF2;border-radius:6px;background:#fff;font-size:12px;color:#5C6E8A;cursor:pointer}
    .pg-btn:disabled{opacity:0.5;cursor:not-allowed;}
    .view{display:none}.view.active{display:block}
    .custom-input{border:1px solid #E8ECF2;border-radius:7px;padding:7px 10px;font-size:13px;width:100%;color:#1B2438;background:#FAFBFC;outline:none;}
    .custom-input:focus{border-color:#2563EB;background:#fff;}
  `]
})
export class EnginsComponent implements OnInit {
  listeEngins: any[] = [];
  actuelsCount: number = 0;
  filteredEngins: any[] = [];
  paginatedEngins: any[] = [];
  searchTerm = '';
  selectedCategory = 'Tous';
  selectedEngin: any = null;
  showForm = false;
  enginForm: FormGroup;
  categories = ['Tous', 'Engin', 'Camion', 'Voiture', 'Accessoire / Organe'];
  kpis: any[] = [];
  // New status filter options
  statusOptions = ['Tous', 'ACTIF', 'EN_PANNE', 'VENDU', 'FERRAILLE'];
  selectedStatus = 'Tous';

  // Interventions for History
  toutesInterventions: any[] = [];
  historiqueEngin: any[] = [];
  tousChantiers: any[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 25;
  totalPages = 1;

  // New View Options
  currentView = 'table';

  getKpiCat(type: string): string {
    const map: any = { 'total': 'Tous', 'engin': 'Engin', 'camion': 'Camion', 'voiture': 'Voiture', 'accessoire': 'Accessoire / Organe', 'vendu': 'Vendu' };
    return map[type];
  }

  getCatIcon(cat: string): string {
    const cats: any = { 'Engin': 'ti-crane', 'Camion': 'ti-truck', 'Voiture': 'ti-car', 'Accessoire / Organe': 'ti-settings', 'Vendu': 'ti-x' };
    return cats[cat] || 'ti-package';
  }

  getCatColor(cat: string): string {
    const cats: any = { 'Engin': 'mt-eng', 'Camion': 'mt-cam', 'Voiture': 'mt-veh', 'Accessoire / Organe': 'mt-acc', 'Vendu': 'mt-acc' };
    return cats[cat] || 'mt-acc';
  }

  getStatBadge(stat: string): string {
    const stats: any = { 'ACTIF': 'b-actif', 'EN_PANNE': 'b-panne', 'VENDU': 'b-vendu', 'FERRAILLE': 'b-ferr' };
    return stats[stat] || 'b-actif';
  }

  closeDetail(): void {
    this.selectedEngin = null;
    this.showForm = false;
  }

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.enginForm = this.fb.group({
      matricule: ['', Validators.required],
      codeMateriel: ['', Validators.required],
      marque: ['', Validators.required],
      modele: ['', Validators.required],
      type: ['', Validators.required],
      categorie: ['Engin'],
      serieChassis: [''],
      statut: ['ACTIF'],
      compteurActuel: [0],
      prixMoyenPondere: [''] // Nouveau champ
    });
  }

  ngOnInit(): void {
    this.chargerEngins();
    this.chargerInterventions();
    this.chargerChantiers();
  }

  chargerChantiers(): void {
    this.api.getChantiers().subscribe({
      next: (data) => {
        this.tousChantiers = data.filter((c: any) => c.statut === 'ACTIF');
      }
    });
  }

  affecterChantier(enginId: number, chantierId: number): void {
    const cid = chantierId ? chantierId : null;
    this.api.affecterEnginAuChantier(enginId, cid).subscribe({
      next: (updatedEngin) => {
        if (this.selectedEngin && this.selectedEngin.idEngin === updatedEngin.idEngin) {
          this.selectedEngin.chantier = updatedEngin.chantier;
        }
        // Update in the list
        const idx = this.listeEngins.findIndex(e => e.idEngin === updatedEngin.idEngin);
        if (idx !== -1) {
          this.listeEngins[idx] = updatedEngin;
          this.updateEnginStatuses();
        }
      }
    });
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
        this.updateEnginStatuses();
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
        
        this.updateEnginStatuses();
      },
      error: (err) => {
        console.error('API Error, données mock activées', err);
        this.listeEngins = [];
        this.actuelsCount = 0;
        this.buildKpis();
        this.applyFilters();
      }
    });
  }

  updateEnginStatuses(): void {
    if (!this.listeEngins || this.listeEngins.length === 0) return;

    this.listeEngins.forEach(e => {
      if (!this.isVendu(e)) {
        // Un matériel est en panne s'il a une intervention qui n'est pas clôturée
        const enPanne = this.toutesInterventions.some(i => 
          i.idEngin === e.idEngin && 
          i.statut !== 'Clôturée' && 
          i.statut !== 'CLOTUREE' &&
          i.statut !== 'Terminée' &&
          i.statut !== 'TERMINEE'
        );
        
        // Si la base de données disait déjà EN_PANNE on le garde, sinon on le met à jour
        if (enPanne) {
          e.statut = 'EN_PANNE';
        } else if (e.statut === 'EN_PANNE') {
          // Si l'intervention est clôturée mais qu'il était marqué EN_PANNE, il redevient ACTIF
          e.statut = 'ACTIF';
        }
      }
    });

    const actuels = this.listeEngins.filter(e => !this.isVendu(e));
    this.actuelsCount = actuels.length;

    this.buildKpis();
    this.applyFilters();
  }

  buildKpis(): void {
    const vendus = this.listeEngins.filter(e => this.isVendu(e)).length;
    const actuels = this.listeEngins.filter(e => !this.isVendu(e));
    
    const total = actuels.length;
    const engins = actuels.filter(e => e.categorie === 'Engin').length;
    const camions = actuels.filter(e => e.categorie === 'Camion').length;
    const voitures = actuels.filter(e => e.categorie === 'Voiture').length;
    const accessoires = actuels.filter(e => e.categorie === 'Accessoire / Organe').length;
    
    this.kpis = [
      { label: 'Parc Actuel', value: total, type: 'total', bg: 'linear-gradient(135deg, #dbeafe, #eff6ff)' },
      { label: 'Engins', value: engins, type: 'engin', bg: 'linear-gradient(135deg, #f3e8ff, #faf5ff)' },
      { label: 'Camions', value: camions, type: 'camion', bg: 'linear-gradient(135deg, #fef3c7, #fffbeb)' },
      { label: 'Voitures & Véh.', value: voitures, type: 'voiture', bg: 'linear-gradient(135deg, #d1fae5, #ecfdf5)' },
      { label: 'Organes & Acc.', value: accessoires, type: 'accessoire', bg: 'linear-gradient(135deg, #ffedd5, #fff7ed)' },
      { label: 'Vendus / Sortis', value: vendus, type: 'vendu', bg: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }
    ];
  }

  isVendu(e: any): boolean {
    const stat = (e.statut || '').toString().toUpperCase();
    const cm = (e.codeMateriel || e.matricule || '').toString().toUpperCase();
    return stat === 'VENDU' || cm.includes('VENDU') || stat === 'FERRAILLE';
  }

  onKpiClick(type: string): void {
    switch(type) {
      case 'total':
        this.selectedCategory = 'Tous';
        this.selectedStatus = 'Tous';
        break;
      case 'engin':
        this.selectedCategory = 'Engin';
        this.selectedStatus = 'Tous';
        break;
      case 'camion':
        this.selectedCategory = 'Camion';
        this.selectedStatus = 'Tous';
        break;
      case 'voiture':
        this.selectedCategory = 'Voiture';
        this.selectedStatus = 'Tous';
        break;
      case 'accessoire':
        this.selectedCategory = 'Accessoire / Organe';
        this.selectedStatus = 'Tous';
        break;
      case 'vendu':
        this.selectedCategory = 'Tous';
        this.selectedStatus = 'VENDU';
        break;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
    this.currentPage = 1;
    this.applyFilters();
  }

  // New method to handle status selection and reset category filter
  selectStatus(stat: string): void {
    this.selectedStatus = stat;
    // Reset category to 'Tous' to avoid combined filters unintentionally hiding results
    this.selectedCategory = 'Tous';
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.listeEngins];

    // Category filter
    if (this.selectedCategory !== 'Tous') {
      result = result.filter(e => e.categorie === this.selectedCategory);
    }

    // Si l'utilisateur fait une recherche, on ne cache RIEN — la recherche est prioritaire
    const hasSearch = this.searchTerm.trim().length > 0;

    // Hide VENDUS by default ONLY when no search term is active
    if (this.selectedStatus === 'Tous' && !hasSearch) {
      result = result.filter(e => !this.isVendu(e));
    }

    // Status filter (case‑insensitive, safe for missing values)
    if (this.selectedStatus !== 'Tous') {
      const desired = this.selectedStatus.toUpperCase();
      result = result.filter(e => {
        const stat = (e.statut || '').toString().toUpperCase();
        if (stat === desired) return true;
        if (desired === 'VENDU') return this.isVendu(e);
        return false;
      });
    }

    // Search filter — cherche dans tous les champs identifiants
    if (hasSearch) {
      const term = this.searchTerm.trim().toLowerCase();
      result = result.filter(e =>
        (e.matricule || '').toLowerCase().includes(term) ||
        (e.codeMateriel || '').toLowerCase().includes(term) ||
        (e.marque || '').toLowerCase().includes(term) ||
        (e.modele || '').toLowerCase().includes(term) ||
        (e.type || '').toLowerCase().includes(term) ||
        (e.serieChassis || '').toLowerCase().includes(term) ||
        (e.immatriculation || '').toLowerCase().includes(term) ||
        (e.codeInterne || '').toLowerCase().includes(term) ||
        (e.categorie || '').toLowerCase().includes(term)
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
      this.enginForm.patchValue({
        matricule: engin.matricule,
        codeMateriel: engin.codeMateriel,
        marque: engin.marque,
        modele: engin.modele,
        type: engin.type,
        categorie: engin.categorie || 'Engin',
        serieChassis: engin.serieChassis,
        statut: engin.statut || 'ACTIF',
        compteurActuel: engin.compteurActuel || 0,
        prixMoyenPondere: engin.prixMoyenPondere || ''
      });
      // Filtrer l'historique
      this.historiqueEngin = this.toutesInterventions.filter(i => i.idEngin === engin.idEngin);
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    this.selectedEngin = null;
    this.enginForm.reset({ statut: 'ACTIF', compteurActuel: 0, categorie: 'Engin', prixMoyenPondere: '', codeMateriel: '' });
  }

  onSubmit(): void {
    if (this.enginForm.valid) {
      if (this.selectedEngin) {
        // Mode Modification
        this.api.updateMateriel(this.selectedEngin.idEngin, this.enginForm.value).subscribe({
          next: (updated) => {
            const idx = this.listeEngins.findIndex(e => e.idEngin === updated.idEngin);
            if (idx !== -1) {
              this.listeEngins[idx] = updated;
            }
            this.buildKpis();
            this.applyFilters();
            this.selectedEngin = null;
            this.showForm = false;
          },
          error: () => {
            // Fallback en cas d'erreur API
            const idx = this.listeEngins.findIndex(e => e.idEngin === this.selectedEngin.idEngin);
            if (idx !== -1) {
              this.listeEngins[idx] = { ...this.listeEngins[idx], ...this.enginForm.value };
            }
            this.buildKpis();
            this.applyFilters();
            this.selectedEngin = null;
            this.showForm = false;
          }
        });
      } else {
        // Mode Création
        this.api.createMateriel(this.enginForm.value).subscribe({
          next: (saved) => {
            this.listeEngins.unshift(saved);
            this.buildKpis();
            this.applyFilters();
            this.enginForm.reset({ statut: 'ACTIF', compteurActuel: 0, categorie: 'Engin', prixMoyenPondere: '', codeMateriel: '' });
            this.showForm = false;
          },
          error: () => {
            this.listeEngins.unshift({ ...this.enginForm.value, idEngin: Date.now() });
            this.buildKpis();
            this.applyFilters();
            this.enginForm.reset({ statut: 'ACTIF', compteurActuel: 0, categorie: 'Engin', prixMoyenPondere: '', codeMateriel: '' });
            this.showForm = false;
          }
        });
      }
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
