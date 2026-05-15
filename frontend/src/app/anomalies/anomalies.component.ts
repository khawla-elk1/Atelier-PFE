import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-anomalies',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="enterprise-container">
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">Centre de Gestion des Anomalies</h1>
          <p class="page-subtitle">
            Suivi, priorisation et traitement des signalements matériels
          </p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="search-icon"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              placeholder="Rechercher une anomalie..."
              class="search-input"
            />
          </div>
          <button class="btn-primary" (click)="toggleForm()">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nouveau Signalement
          </button>
        </div>
      </div>

      <!-- KPI Metrics -->
      <div class="metrics-grid">
        <div class="metric-card gradient-primary">
          <div class="metric-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              ></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div class="metric-content">
            <div class="metric-title">Total Signalements</div>
            <div class="metric-value">{{ anomalies.length }}</div>
          </div>
        </div>
        <div class="metric-card gradient-warning">
          <div class="metric-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="metric-content">
            <div class="metric-title">À traiter</div>
            <div class="metric-value">{{ countATraiter }}</div>
          </div>
        </div>
        <div class="metric-card gradient-danger">
          <div class="metric-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              ></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="metric-content">
            <div class="metric-title">Urgentes</div>
            <div class="metric-value">{{ countUrgentes }}</div>
          </div>
        </div>
        <div class="metric-card gradient-success">
          <div class="metric-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="metric-content">
            <div class="metric-title">Résolues</div>
            <div class="metric-value">{{ countResolues }}</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <button
            class="filter-btn"
            [class.active]="filterStatus === 'ALL'"
            (click)="setFilter('ALL')"
          >
            Toutes
          </button>
          <button
            class="filter-btn"
            [class.active]="filterStatus === 'A_TRAITER'"
            (click)="setFilter('A_TRAITER')"
          >
            À Traiter
          </button>
          <button
            class="filter-btn"
            [class.active]="filterStatus === 'RESOLUE'"
            (click)="setFilter('RESOLUE')"
          >
            Résolues
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-card">
        <table class="enterprise-table">
          <thead>
            <tr>
              <th width="90">Référence</th>
              <th width="220">Équipement</th>
              <th>Description du problème</th>
              <th width="140">Date Signalement</th>
              <th width="120">Criticité</th>
              <th width="140">Statut</th>
              <th width="200" class="text-right">Actions Rapides</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ano of filteredAnomalies" class="table-row">
              <td>
                <span class="ref-badge"
                  >ANO-{{ ano.idAnomalie | number: '3.0-0' }}</span
                >
              </td>
              <td>
                <div class="engin-card">
                  <div class="engin-avatar">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
                      ></path>
                      <circle cx="7" cy="17" r="2"></circle>
                      <path d="M9 17h6"></path>
                      <circle cx="17" cy="17" r="2"></circle>
                    </svg>
                  </div>
                  <div>
                    <div class="engin-name">
                      {{
                        ano.engin
                          ? ano.engin.codeMateriel || ano.engin.matricule
                          : ano.enginDeclare || 'Non assigné'
                      }}
                    </div>
                    <div class="engin-sub" *ngIf="ano.engin">
                      {{ ano.engin.marque }} {{ ano.engin.modele }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div class="desc-text" [title]="ano.description">
                  {{ ano.description }}
                </div>
              </td>
              <td>
                <div class="date-container">
                  <div class="date-text">
                    {{ ano.dateSignalement | date: 'dd MMM yyyy' }}
                  </div>
                  <div class="time-text">
                    {{ ano.dateSignalement | date: 'HH:mm' }}
                  </div>
                </div>
              </td>
              <td>
                <div
                  class="priority-indicator"
                  [class.prio-danger]="ano.criticite === 'URGENTE'"
                  [class.prio-warning]="ano.criticite === 'NORMALE'"
                  [class.prio-info]="ano.criticite === 'PLANIFIEE'"
                >
                  <span class="prio-dot"></span>
                  {{ ano.criticite | titlecase }}
                </div>
              </td>
              <td>
                <span
                  class="status-badge"
                  [class.status-pending]="isATraiter(ano.statut)"
                  [class.status-resolved]="isResolu(ano.statut)"
                >
                  {{ ano.statut.replace('_', ' ') | titlecase }}
                </span>
              </td>
              <td class="actions-cell">
                <div class="dropdown-actions" *ngIf="isATraiter(ano.statut)">
                  <button class="btn-action-main" (click)="genererPlan(ano)">
                    Créer Plan
                  </button>
                  <button
                    class="btn-action-alt"
                    (click)="creerIntervention(ano)"
                    title="OT Simple"
                  >
                    OT
                  </button>
                </div>
                <button
                  class="btn-action-disabled"
                  *ngIf="!isATraiter(ano.statut)"
                  disabled
                >
                  Traité
                </button>
                <button
                  class="btn-icon btn-icon-danger ml-2"
                  (click)="supprimerAnomalie(ano)"
                  title="Supprimer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    ></path>
                  </svg>
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredAnomalies.length === 0">
              <td colspan="7">
                <div class="empty-state">
                  <div class="empty-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="9" y1="3" x2="9" y2="21"></line>
                    </svg>
                  </div>
                  <h3>Aucune anomalie trouvée</h3>
                  <p>
                    Essayez de modifier vos filtres ou de créer un nouveau
                    signalement.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Plan d'Intervention Modal -->
      <div class="modal-backdrop" *ngIf="showPlanForm" (click)="togglePlanForm()">
        <div class="modal-container modal-large" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Planifier l'Intervention</h2>
              <p class="modal-subtitle">
                Définir les tâches pour l'anomalie 
                <strong *ngIf="selectedAnomalieForPlan">ANO-{{ selectedAnomalieForPlan.idAnomalie }}</strong>
              </p>
            </div>
            <button class="btn-close" (click)="togglePlanForm()">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <form [formGroup]="planForm" (ngSubmit)="soumettrePlan()">
            <div class="modal-body">
              <div class="form-group">
                <label>Titre du Plan <span class="required">*</span></label>
                <input type="text" formControlName="titre" class="form-control" />
              </div>

              <div class="interventions-header">
                <h3>Tâches (Interventions)</h3>
                <button type="button" class="btn-action-main" (click)="ajouterIntervention()">
                  + Ajouter une tâche
                </button>
              </div>

              <div formArrayName="interventions" class="interventions-list">
                <div *ngFor="let inv of interventionsArray.controls; let i = index" [formGroupName]="i" class="intervention-card">
                  <div class="intervention-card-header">
                    <h4>Tâche {{ i + 1 }}</h4>
                    <button type="button" class="btn-icon btn-icon-danger" (click)="supprimerIntervention(i)" *ngIf="interventionsArray.length > 1" title="Supprimer cette tâche">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group flex-1">
                      <label>Type / Spécialité <span class="required">*</span></label>
                      <select formControlName="type" class="form-control">
                        <option value="Mécanique">Mécanique</option>
                        <option value="Électrique">Électrique</option>
                        <option value="Hydraulique">Hydraulique</option>
                        <option value="Pneumatique">Pneumatique</option>
                        <option value="Carrosserie">Carrosserie</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                    <div class="form-group flex-1">
                      <label>Assigner à (Technicien)</label>
                      <select formControlName="technicienId" class="form-control">
                        <option value="">-- Non assigné --</option>
                        <option *ngFor="let t of techniciens" [value]="t.idUser">
                          {{ t.nom }} {{ t.prenom }}
                        </option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label>Description des travaux <span class="required">*</span></label>
                    <textarea formControlName="description" class="form-control" rows="2" placeholder="Que doit faire le technicien ?"></textarea>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="togglePlanForm()">Annuler</button>
              <button type="submit" class="btn-submit" [disabled]="planForm.invalid">Créer le Plan et Assigner</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Enhanced Modal Form -->
      <div class="modal-backdrop" *ngIf="showForm" (click)="toggleForm()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Nouveau Signalement</h2>
              <p class="modal-subtitle">
                Déclarez une nouvelle anomalie sur un équipement
              </p>
            </div>
            <button class="btn-close" (click)="toggleForm()">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <form [formGroup]="anomalieForm" (ngSubmit)="soumettreAnomalie()">
            <div class="modal-body">
              <div class="form-section">
                <div class="form-row">
                  <div class="form-group flex-1">
                    <label>Équipement Concerné <span class="required">*</span></label>
                    <div class="custom-dropdown-wrapper">
                      <input
                        type="text"
                        formControlName="engin"
                        class="form-control"
                        placeholder="Chercher par nom, marque, code..."
                        (focus)="showEnginsList = true"
                        (blur)="cacherListeEngins()"
                      />
                      <svg
                        class="select-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <div class="custom-options-list" *ngIf="showEnginsList">
                        <div
                          class="custom-option"
                          *ngFor="let e of getFilteredEngins()"
                          (mousedown)="selectEngin(e, $event)"
                        >
                          {{ getEnginDisplay(e) }}
                        </div>
                        <div class="custom-option empty" *ngIf="getFilteredEngins().length === 0">
                          Aucun équipement trouvé
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="form-group flex-1">
                    <label
                      >Niveau de Criticité
                      <span class="required">*</span></label
                    >
                    <div class="select-wrapper">
                      <select formControlName="criticite" class="form-control">
                        <option value="NORMALE">
                          Normale - Traitement régulier
                        </option>
                        <option value="PLANIFIEE">
                          Planifiée - Lors de la prochaine révision
                        </option>
                        <option value="URGENTE">
                          Urgente - Intervention immédiate
                        </option>
                      </select>
                      <svg
                        class="select-icon"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-section">
                <div class="form-group">
                  <label
                    >Description du problème
                    <span class="required">*</span></label
                  >
                  <textarea
                    formControlName="description"
                    class="form-control"
                    rows="5"
                    placeholder="Décrivez les symptômes, le contexte d'apparition de l'anomalie..."
                  ></textarea>
                  <div class="form-hint">
                    Une description précise aidera les techniciens à mieux
                    préparer l'intervention.
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="toggleForm()">
                Annuler
              </button>
              <button
                type="submit"
                class="btn-submit"
                [disabled]="anomalieForm.invalid"
              >
                Enregistrer l'Anomalie
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

      .enterprise-container {
        padding: 32px 40px;
        background-color: #f8fafc;
        min-height: 100vh;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #0f172a;
      }

      /* Header */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
      }
      .header-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .page-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.02em;
      }
      .page-subtitle {
        font-size: 0.95rem;
        color: #64748b;
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .search-box {
        position: relative;
        width: 300px;
      }
      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
      }
      .search-input {
        width: 100%;
        padding: 10px 16px 10px 40px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        font-family: inherit;
        transition: all 0.2s ease;
        background: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
      }
      .search-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      /* Buttons */
      .btn-primary {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        border: none;
        padding: 10px 20px;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
      }
      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
      }

      /* Metrics */
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 32px;
      }
      .metric-card {
        display: flex;
        align-items: center;
        gap: 16px;
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        border: 1px solid #e2e8f0;
        transition: transform 0.2s ease;
      }
      .metric-card:hover {
        transform: translateY(-2px);
      }
      .metric-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
      }
      .metric-content {
        display: flex;
        flex-direction: column;
      }
      .metric-title {
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .metric-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.2;
      }

      .gradient-primary .metric-icon {
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        color: #2563eb;
      }
      .gradient-warning .metric-icon {
        background: linear-gradient(135deg, #fffbeb, #fef3c7);
        color: #d97706;
      }
      .gradient-danger .metric-icon {
        background: linear-gradient(135deg, #fef2f2, #fee2e2);
        color: #dc2626;
      }
      .gradient-success .metric-icon {
        background: linear-gradient(135deg, #f0fdf4, #dcfce3);
        color: #16a34a;
      }

      /* Filters */
      .filters-section {
        margin-bottom: 20px;
        display: flex;
        justify-content: flex-start;
      }
      .filter-group {
        display: inline-flex;
        background: #f1f5f9;
        padding: 4px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .filter-btn {
        background: transparent;
        border: none;
        padding: 6px 16px;
        font-size: 0.875rem;
        font-weight: 500;
        color: #64748b;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      .filter-btn:hover {
        color: #0f172a;
      }
      .filter-btn.active {
        background: white;
        color: #0f172a;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        font-weight: 600;
      }

      /* Table */
      .table-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
      }
      .enterprise-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        text-align: left;
      }
      .enterprise-table th {
        background-color: #f8fafc;
        padding: 14px 20px;
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e2e8f0;
      }
      .enterprise-table td {
        padding: 16px 20px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
      }
      .table-row {
        transition: background-color 0.15s ease;
      }
      .table-row:hover {
        background-color: #f8fafc;
      }
      .enterprise-table tbody tr:last-child td {
        border-bottom: none;
      }

      .ref-badge {
        display: inline-block;
        padding: 4px 8px;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-family: 'SFMono-Regular', Consolas, monospace;
        color: #475569;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .engin-card {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .engin-avatar {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
      }
      .engin-name {
        font-weight: 600;
        color: #0f172a;
        font-size: 0.875rem;
      }
      .engin-sub {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 2px;
      }

      .desc-text {
        color: #334155;
        max-width: 280px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.875rem;
      }

      .date-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .date-text {
        color: #0f172a;
        font-size: 0.875rem;
        font-weight: 500;
      }
      .time-text {
        color: #64748b;
        font-size: 0.75rem;
      }

      .text-right {
        text-align: right;
      }
      .ml-2 {
        margin-left: 8px;
      }

      /* Empty State */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        color: #64748b;
        text-align: center;
      }
      .empty-icon {
        color: #cbd5e1;
        margin-bottom: 16px;
      }
      .empty-state h3 {
        color: #0f172a;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 8px 0;
      }
      .empty-state p {
        margin: 0;
        font-size: 0.875rem;
      }

      /* Badges & Indicators */
      .priority-indicator {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8125rem;
        font-weight: 500;
      }
      .prio-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .prio-danger .prio-dot {
        background-color: #ef4444;
        box-shadow: 0 0 0 2px #fee2e2;
      }
      .prio-danger {
        color: #b91c1c;
      }
      .prio-warning .prio-dot {
        background-color: #f59e0b;
        box-shadow: 0 0 0 2px #fef3c7;
      }
      .prio-warning {
        color: #b45309;
      }
      .prio-info .prio-dot {
        background-color: #3b82f6;
        box-shadow: 0 0 0 2px #dbeafe;
      }
      .prio-info {
        color: #1d4ed8;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      .status-pending {
        background-color: #fff7ed;
        color: #c2410c;
        border: 1px solid #ffedd5;
      }
      .status-resolved {
        background-color: #f0fdf4;
        color: #15803d;
        border: 1px solid #dcfce3;
      }

      /* Actions */
      .actions-cell {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
      }
      .dropdown-actions {
        display: flex;
        background: #f1f5f9;
        border-radius: 6px;
        padding: 2px;
        border: 1px solid #e2e8f0;
      }
      .btn-action-main {
        background: white;
        color: #2563eb;
        border: none;
        padding: 6px 12px;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 4px;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        font-family: inherit;
        transition: all 0.2s;
      }
      .btn-action-main:hover {
        color: #1d4ed8;
        background: #f8fafc;
      }
      .btn-action-alt {
        background: transparent;
        color: #64748b;
        border: none;
        padding: 6px 10px;
        font-size: 0.75rem;
        font-weight: 500;
        border-radius: 4px;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s;
      }
      .btn-action-alt:hover {
        background: #e2e8f0;
        color: #0f172a;
      }

      .btn-action-disabled {
        background-color: transparent;
        color: #94a3b8;
        border: none;
        padding: 6px 12px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .btn-icon {
        background: white;
        border: 1px solid #e2e8f0;
        color: #64748b;
        width: 30px;
        height: 30px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .btn-icon:hover {
        background-color: #fee2e2;
        color: #dc2626;
        border-color: #fca5a5;
      }

      /* Modal Form */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(15, 23, 42, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
        opacity: 1;
        animation: fadeIn 0.2s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-container {
        background: white;
        border-radius: 16px;
        box-shadow:
          0 20px 25px -5px rgba(0, 0, 0, 0.1),
          0 10px 10px -5px rgba(0, 0, 0, 0.04);
        width: 100%;
        max-width: 640px;
        overflow: hidden;
        transform: scale(1);
        animation: scaleUp 0.2s ease-out;
      }
      .modal-container.modal-large {
        max-width: 800px;
      }
      .interventions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 24px 0 16px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
      }
      .interventions-header h3 {
        margin: 0;
        font-size: 1.125rem;
        color: #0f172a;
      }
      .intervention-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
      }
      .intervention-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .intervention-card-header h4 {
        margin: 0;
        font-size: 0.95rem;
        color: #3b82f6;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      @keyframes scaleUp {
        from {
          transform: scale(0.95);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      .modal-header {
        padding: 24px 32px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .modal-header h2 {
        margin: 0 0 4px 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #0f172a;
      }
      .modal-subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: #64748b;
      }
      .btn-close {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .btn-close:hover {
        background: #f1f5f9;
        color: #0f172a;
      }

      .modal-body {
        padding: 32px;
        max-height: 70vh;
        overflow-y: auto;
      }
      .form-section {
        margin-bottom: 24px;
      }
      .form-row {
        display: flex;
        gap: 20px;
      }
      .flex-1 {
        flex: 1;
      }
      .form-group {
        margin-bottom: 20px;
      }
      .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
      }
      .required {
        color: #dc2626;
      }

      .select-wrapper {
        position: relative;
      }
      .select-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #64748b;
        pointer-events: none;
      }

      .form-control {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.95rem;
        color: #0f172a;
        background: white;
        box-sizing: border-box;
        transition: all 0.2s;
        font-family: inherit;
        appearance: none;
      }
      select.form-control {
        padding-right: 40px;
      }
      .form-control:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .custom-dropdown-wrapper {
        position: relative;
        width: 100%;
      }
      .custom-options-list {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        max-height: 250px;
        overflow-y: auto;
        z-index: 1000;
        animation: fadeIn 0.1s ease-out;
      }
      .custom-option {
        padding: 10px 14px;
        font-size: 0.95rem;
        color: #334155;
        cursor: pointer;
        transition: background-color 0.1s;
      }
      .custom-option:hover {
        background-color: #eff6ff;
        color: #1d4ed8;
      }
      .custom-option.empty {
        color: #94a3b8;
        cursor: default;
      }
      .custom-option.empty:hover {
        background-color: transparent;
      }
      textarea.form-control {
        resize: vertical;
        min-height: 100px;
        line-height: 1.5;
      }

      .form-hint {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 6px;
      }

      .modal-footer {
        padding: 20px 32px;
        background-color: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      .btn-cancel {
        background: white;
        color: #475569;
        border: 1px solid #cbd5e1;
        padding: 10px 20px;
        font-size: 0.95rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      .btn-cancel:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
        color: #0f172a;
      }
      .btn-submit {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        border: none;
        padding: 10px 24px;
        font-size: 0.95rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        font-family: inherit;
      }
      .btn-submit:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
      }
      .btn-submit:disabled {
        background: #94a3b8;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
      }
    `,
  ],
})
export class AnomaliesComponent implements OnInit {
  anomalies: any[] = [];
  listeEngins: any[] = [];

  searchTerm: string = '';
  filterStatus: 'ALL' | 'A_TRAITER' | 'RESOLUE' = 'ALL';

  showForm = false;
  anomalieForm: FormGroup;
  showEnginsList = false;

  countATraiter = 0;
  countUrgentes = 0;
  countResolues = 0;

  // Variables Plan
  showPlanForm = false;
  planForm: FormGroup;
  selectedAnomalieForPlan: any = null;
  techniciens: any[] = [];

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.anomalieForm = this.fb.group({
      engin: ['', Validators.required],
      criticite: ['NORMALE', Validators.required],
      description: ['', Validators.required],
    });

    this.planForm = this.fb.group({
      titre: ['', Validators.required],
      interventions: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.chargerAnomalies();
    this.chargerEngins();
    this.chargerTechniciens();
  }

  chargerTechniciens(): void {
    this.api.getTechniciens().subscribe({
      next: (data) => (this.techniciens = data),
      error: (err) => console.error('Erreur chargement techniciens', err),
    });
  }

  get interventionsArray(): FormArray {
    return this.planForm.get('interventions') as FormArray;
  }

  chargerEngins(): void {
    this.api.getMateriels().subscribe({
      next: (data) => {
        this.listeEngins = data.filter((e: any) => {
          const stat = (e.statut || '').toString().toUpperCase();
          const cm = (e.codeMateriel || e.matricule || '').toString().toUpperCase();
          return stat !== 'VENDU' && stat !== 'FERRAILLE' && !cm.includes('VENDU');
        });
      },
      error: (err) => console.error('Erreur de chargement des engins', err),
    });
  }

  chargerAnomalies(): void {
    this.api.getAnomalies().subscribe({
      next: (data) => {
        // Trier par date décroissante
        this.anomalies = data.sort(
          (a: any, b: any) =>
            new Date(b.dateSignalement).getTime() -
            new Date(a.dateSignalement).getTime(),
        );
        this.countATraiter = this.anomalies.filter((a) =>
          this.isATraiter(a.statut),
        ).length;
        this.countResolues = this.anomalies.filter((a) =>
          this.isResolu(a.statut),
        ).length;
        this.countUrgentes = this.anomalies.filter(
          (a) => a.criticite === 'URGENTE' && this.isATraiter(a.statut),
        ).length;
      },
      error: (err) => console.error('Erreur chargement anomalies', err),
    });
  }

  get filteredAnomalies(): any[] {
    let filtered = this.anomalies;

    // Filtre statut
    if (this.filterStatus === 'A_TRAITER') {
      filtered = filtered.filter((a) => this.isATraiter(a.statut));
    } else if (this.filterStatus === 'RESOLUE') {
      filtered = filtered.filter((a) => this.isResolu(a.statut));
    }

    // Recherche texte
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.description?.toLowerCase().includes(term) ||
          a.engin?.codeMateriel?.toLowerCase().includes(term) ||
          a.engin?.matricule?.toLowerCase().includes(term) ||
          a.idAnomalie?.toString().includes(term),
      );
    }

    return filtered;
  }

  setFilter(status: 'ALL' | 'A_TRAITER' | 'RESOLUE'): void {
    this.filterStatus = status;
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.anomalieForm.reset({ criticite: 'NORMALE', engin: '' });
    }
  }

  soumettreAnomalie(): void {
    if (this.anomalieForm.valid) {
      let selectedValue = this.anomalieForm.value.engin;
      if (typeof selectedValue === 'string') {
        selectedValue = selectedValue.trim();
      }

      const matchedEngin = this.listeEngins.find(
        (e) => this.getEnginDisplay(e) === selectedValue
      );

      const payload = {
        engin: matchedEngin ? { idEngin: matchedEngin.idEngin } : null,
        enginDeclare: matchedEngin
          ? (matchedEngin.codeMateriel || matchedEngin.matricule) +
            ' - ' +
            matchedEngin.marque +
            ' ' +
            matchedEngin.modele
          : selectedValue
            ? selectedValue
            : 'Matériel Inconnu',
        criticite: this.anomalieForm.value.criticite,
        description: this.anomalieForm.value.description,
        statut: 'A_TRAITER',
        dateSignalement: new Date().toISOString(),
      };

      this.api.createAnomalie(payload as any).subscribe({
        next: () => {
          this.chargerAnomalies();
          this.toggleForm();
        },
        error: (err) => {
          console.error('Erreur création anomalie', err);
          alert("Erreur lors de l'enregistrement de l'anomalie.");
        },
      });
    }
  }

  isATraiter(statut: string): boolean {
    if (!statut) return true;
    const s = statut.toLowerCase();
    return (
      s.includes('signal') || s.includes('traiter') || s.includes('attente')
    );
  }

  isResolu(statut: string): boolean {
    if (!statut) return false;
    const s = statut.toLowerCase();
    return s.includes('resolu') || s.includes('termin') || s.includes('clotur');
  }

  genererPlan(ano: any): void {
    this.selectedAnomalieForPlan = ano;
    const ref = ano.idAnomalie;
    const engin = ano.engin ? (ano.engin.codeMateriel || ano.engin.matricule) : ano.enginDeclare;
    
    this.planForm.reset({
      titre: `Plan d'action - ANO-${ref} (${engin})`
    });
    
    this.interventionsArray.clear();
    this.ajouterIntervention(); // Add first default task
    
    this.showPlanForm = true;
  }

  togglePlanForm(): void {
    this.showPlanForm = !this.showPlanForm;
    if (!this.showPlanForm) {
      this.selectedAnomalieForPlan = null;
    }
  }

  ajouterIntervention(): void {
    const group = this.fb.group({
      type: ['Mécanique', Validators.required],
      description: ['', Validators.required],
      technicienId: [''],
    });
    this.interventionsArray.push(group);
  }

  supprimerIntervention(index: number): void {
    if (this.interventionsArray.length > 1) {
      this.interventionsArray.removeAt(index);
    }
  }

  soumettrePlan(): void {
    if (this.planForm.valid && this.selectedAnomalieForPlan) {
      const planPayload = {
        titre: this.planForm.value.titre,
        dateCreation: new Date().toISOString()
      };

      this.api.createPlanFromAnomalie(this.selectedAnomalieForPlan.idAnomalie, planPayload).subscribe({
        next: (createdPlan) => {
          const interventions = this.planForm.value.interventions.map((inv: any) => {
            return {
              type: inv.type,
              description: inv.description,
              technicien: inv.technicienId ? { idUser: inv.technicienId } : null,
              statut: 'PROGRAMMEE',
              dateDebut: new Date().toISOString()
            };
          });

          // Créer chaque intervention
          let completed = 0;
          for (const inv of interventions) {
            this.api.addInterventionToPlan(createdPlan.idPlan, inv).subscribe({
              next: () => {
                completed++;
                if (completed === interventions.length) {
                  this.chargerAnomalies();
                  this.togglePlanForm();
                }
              },
              error: (err) => {
                console.error(err);
                completed++;
                if (completed === interventions.length) {
                  this.chargerAnomalies();
                  this.togglePlanForm();
                }
              }
            });
          }
          
          if(interventions.length === 0) {
            this.chargerAnomalies();
            this.togglePlanForm();
          }
        },
        error: (err) => {
          console.error('Erreur creation plan', err);
          alert("Erreur lors de la création du plan");
        }
      });
    }
  }

  creerIntervention(ano: any): void {
    if (
      confirm(
        'Créer un Ordre de Travail simple (Corrective) pour cette anomalie ?',
      )
    ) {
      const payload = {
        engin: ano.engin ? { idEngin: ano.engin.idEngin } : null,
        enginDeclare: ano.enginDeclare,
        anomalie: { idAnomalie: ano.idAnomalie },
        type: 'Corrective',
        statut: 'PROGRAMMEE',
        dateDebut: new Date().toISOString(),
      };

      this.api.createIntervention(payload as any).subscribe({
        next: () => {
          this.chargerAnomalies();
          this.router.navigate(['/interventions']);
        },
        error: (err) => {
          console.error("Erreur lors de la création de l'intervention", err);
          alert("Impossible de créer l'ordre de travail.");
        },
      });
    }
  }

  supprimerAnomalie(ano: any): void {
    if (
      confirm(
        `Voulez-vous vraiment supprimer l'anomalie #${ano.idAnomalie} ? Cette action est définitive.`,
      )
    ) {
      this.api.deleteAnomalie(ano.idAnomalie).subscribe({
        next: () => {
          this.chargerAnomalies();
        },
        error: (err) => {
          console.error('Erreur suppression anomalie', err);
          alert(
            'Erreur lors de la suppression. Cette anomalie est peut-être déjà liée à un ordre de travail en cours.',
          );
        },
      });
    }
  }

  getEnginDisplay(e: any): string {
    if (!e) return '';
    return `${e.codeMateriel || e.matricule} - ${e.marque} ${e.modele || ''}`.trim();
  }

  getFilteredEngins(): any[] {
    const term = this.anomalieForm.get('engin')?.value;
    if (!term) return this.listeEngins;
    
    // Check if term matches exactly an engin
    const exactMatch = this.listeEngins.some(e => this.getEnginDisplay(e) === term);
    if (exactMatch) return this.listeEngins;

    const termLower = term.toLowerCase();
    return this.listeEngins.filter(e => 
      this.getEnginDisplay(e).toLowerCase().includes(termLower)
    );
  }

  selectEngin(e: any, event: MouseEvent): void {
    event.preventDefault();
    this.anomalieForm.patchValue({ engin: this.getEnginDisplay(e) });
    this.showEnginsList = false;
  }

  cacherListeEngins(): void {
    setTimeout(() => {
      this.showEnginsList = false;
    }, 200);
  }
}
