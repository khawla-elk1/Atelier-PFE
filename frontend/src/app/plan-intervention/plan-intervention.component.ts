import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-plan-intervention',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="enterprise-layout">
      <!-- Sidebar / List of Plans -->
      <aside class="sidebar-plans">
        <div class="sidebar-header">
          <div class="sidebar-title-row">
            <h2>Plans d'Intervention</h2>
            <span class="badge-count">{{ plans.length }}</span>
          </div>
          <p class="sidebar-subtitle">Coordination multi-métiers</p>
          <button class="btn-primary w-100 mt-3" (click)="ouvrirNouveauPlan()">
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
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nouveau Plan
          </button>

          <div class="search-box mt-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
              placeholder="Rechercher un plan..."
              class="search-input"
            />
          </div>
        </div>

        <div class="plans-list">
          <div
            class="plan-item"
            *ngFor="let plan of filteredPlans"
            [class.active]="planSelectionne?.idPlan === plan.idPlan"
            (click)="selectionnerPlan(plan)"
          >
            <div class="plan-item-header">
              <span class="plan-ref"
                >PLAN-{{ plan.idPlan | number: '3.0-0' }}</span
              >
              <span
                class="status-dot"
                [class.dot-draft]="plan.statut === 'BROUILLON'"
                [class.dot-progress]="plan.statut === 'EN_COURS'"
                [class.dot-done]="plan.statut === 'TERMINE'"
              ></span>
            </div>
            <h3 class="plan-item-title">{{ plan.titre || 'Sans titre' }}</h3>
            <div class="plan-item-engin">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
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
              {{ plan.engin?.codeMateriel || plan.engin?.matricule }}
            </div>
            <div class="plan-item-footer">
              <span class="plan-date">{{
                plan.dateCreation | date: 'dd MMM yyyy'
              }}</span>
              <div class="plan-progress-mini">
                <div
                  class="progress-bar-mini"
                  [style.width.%]="calculerProgression(plan)"
                ></div>
              </div>
            </div>
          </div>

          <div class="empty-sidebar" *ngIf="filteredPlans.length === 0">
            Aucun plan trouvé.
          </div>
        </div>
      </aside>

      <!-- Main Content / Plan Details -->
      <main class="main-content">
        <div *ngIf="!planSelectionne" class="empty-state-main">
          <div class="empty-icon-large">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <path d="M8 14h.01"></path>
              <path d="M12 14h.01"></path>
              <path d="M16 14h.01"></path>
              <path d="M8 18h.01"></path>
              <path d="M12 18h.01"></path>
              <path d="M16 18h.01"></path>
            </svg>
          </div>
          <h2>Aucun plan sélectionné</h2>
          <p>
            Sélectionnez un plan dans la liste à gauche ou créez-en un nouveau
            pour commencer la coordination.
          </p>
          <button class="btn-primary mt-4" (click)="ouvrirNouveauPlan()">
            Créer un Plan
          </button>
        </div>

        <div *ngIf="planSelectionne" class="plan-details-view fade-in">
          <!-- Plan Header -->
          <div class="detail-header-card">
            <div class="detail-header-top">
              <div>
                <div class="detail-ref-badge">
                  PLAN-{{ planSelectionne.idPlan | number: '3.0-0' }}
                </div>
                <h1 class="detail-title">{{ planSelectionne.titre }}</h1>
              </div>
              <div class="detail-actions">
                <span
                  class="status-badge-large"
                  [class.bg-draft]="planSelectionne.statut === 'BROUILLON'"
                  [class.bg-progress]="planSelectionne.statut === 'EN_COURS'"
                  [class.bg-done]="planSelectionne.statut === 'TERMINE'"
                >
                  {{ planSelectionne.statut.replace('_', ' ') }}
                </span>
                <button
                  class="btn-success"
                  (click)="validerPlan()"
                  *ngIf="planSelectionne.statut === 'BROUILLON'"
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
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Lancer le Plan
                </button>
                <button
                  class="btn-success"
                  (click)="cloturerPlan()"
                  *ngIf="
                    planSelectionne.statut === 'EN_COURS' &&
                    calculerProgression(planSelectionne) === 100
                  "
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
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Clôturer le Plan
                </button>
              </div>
            </div>

            <div class="detail-info-grid">
              <div class="info-block">
                <span class="info-label">Équipement</span>
                <span class="info-value"
                  >{{
                    planSelectionne.engin?.codeMateriel ||
                      planSelectionne.engin?.matricule
                  }}
                  - {{ planSelectionne.engin?.marque }}</span
                >
              </div>
              <div class="info-block">
                <span class="info-label">Date Création</span>
                <span class="info-value">{{
                  planSelectionne.dateCreation | date: 'dd MMMM yyyy'
                }}</span>
              </div>
              <div class="info-block">
                <span class="info-label">Origine</span>
                <span class="info-value">{{
                  planSelectionne.description?.includes('Anomalie')
                    ? 'Anomalie Signalée'
                    : 'Planification Manuelle'
                }}</span>
              </div>
            </div>

            <div class="progress-section">
              <div class="progress-header">
                <span class="progress-title">Progression Globale</span>
                <span class="progress-pct"
                  >{{ calculerProgression(planSelectionne) }}%</span
                >
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  [style.width.%]="calculerProgression(planSelectionne)"
                  [class.fill-success]="
                    calculerProgression(planSelectionne) === 100
                  "
                ></div>
              </div>
              <div class="progress-stats">
                {{ tachesTerminees(planSelectionne) }} tâche(s) terminée(s) sur
                {{ planSelectionne.interventions?.length || 0 }}
              </div>
            </div>

            <div class="description-block" *ngIf="planSelectionne.description">
              <span class="info-label">Description / Contexte</span>
              <p class="desc-text">{{ planSelectionne.description }}</p>
            </div>
          </div>

          <!-- Tasks Section -->
          <div class="tasks-section">
            <div class="tasks-header">
              <h2>Tâches d'Intervention</h2>
              <button
                class="btn-outline"
                (click)="ajouterTache()"
                *ngIf="planSelectionne.statut !== 'TERMINE'"
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
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Ajouter Tâche
              </button>
            </div>

            <div class="tasks-timeline">
              <div
                class="task-card"
                *ngFor="let int of planSelectionne.interventions; let i = index"
              >
                <div
                  class="task-metier-indicator"
                  [ngClass]="getMetierClass(int.metier)"
                >
                  <span class="metier-icon" [ngSwitch]="int.metier">
                    <svg
                      *ngSwitchCase="'MECANIQUE'"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                      ></path>
                    </svg>
                    <svg
                      *ngSwitchCase="'ELECTRICITE'"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polygon
                        points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                      ></polygon>
                    </svg>
                    <svg
                      *ngSwitchCase="'PNEUMATIQUE'"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="4"></circle>
                      <line x1="21.17" y1="8" x2="12" y2="8"></line>
                      <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                      <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
                    </svg>
                    <svg
                      *ngSwitchDefault
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon>
                      <line x1="3" y1="22" x2="21" y2="22"></line>
                    </svg>
                  </span>
                </div>

                <div class="task-content">
                  <div class="task-top-row">
                    <div class="task-title">
                      <h3>{{ int.metier || 'Général' | titlecase }}</h3>
                      <span
                        class="prio-badge"
                        [class.prio-high]="
                          int.priorite === 'HAUTE' ||
                          int.priorite === 'CRITIQUE'
                        "
                      >
                        {{ int.priorite }}
                      </span>
                    </div>
                    <div class="task-status">
                      <span
                        class="task-status-badge"
                        [class.status-done]="int.statut === 'CLOTUREE'"
                      >
                        {{ int.statut }}
                      </span>
                    </div>
                  </div>

                  <p class="task-desc">
                    {{
                      int.observations ||
                        'Aucune instruction spécifique fournie.'
                    }}
                  </p>

                  <div class="task-bottom-row">
                    <div class="tech-assignment">
                      <div class="tech-avatar" *ngIf="int.technicien">
                        {{ int.technicien.prenom.charAt(0)
                        }}{{ int.technicien.nom.charAt(0) }}
                      </div>
                      <div
                        class="tech-avatar empty-avatar"
                        *ngIf="!int.technicien"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path
                            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                          ></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <span class="tech-name">{{
                        int.technicien
                          ? int.technicien.prenom + ' ' + int.technicien.nom
                          : 'Non assigné'
                      }}</span>
                    </div>
                    <div class="task-id">OT #{{ int.idIntervention }}</div>
                  </div>
                </div>
              </div>

              <div
                class="empty-state-tasks"
                *ngIf="
                  !planSelectionne.interventions ||
                  planSelectionne.interventions.length === 0
                "
              >
                <div class="empty-icon-small">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
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
                <p>Aucune tâche n'a encore été ajoutée à ce plan.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Modal Nouveau Plan -->
      <div
        class="modal-backdrop"
        *ngIf="showModalPlan"
        (click)="showModalPlan = false"
      >
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Nouveau Plan d'Intervention</h2>
              <p class="modal-subtitle">
                Initialiser un nouveau workflow de coordination
              </p>
            </div>
            <button class="btn-close" (click)="showModalPlan = false">
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
          <form [formGroup]="planForm" (ngSubmit)="creerPlan()">
            <div class="modal-body">
              <div class="form-group">
                <label>Titre du Plan <span class="required">*</span></label>
                <input
                  type="text"
                  formControlName="titre"
                  class="form-control"
                  placeholder="Ex: Révision complète moteur T-04"
                />
              </div>
              <div class="form-group">
                <label>Équipement Cible <span class="required">*</span></label>
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
              <div class="form-group">
                <label>Description & Contexte</label>
                <textarea
                  formControlName="description"
                  class="form-control"
                  rows="4"
                  placeholder="Objectifs globaux du plan d'intervention..."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn-cancel"
                (click)="showModalPlan = false"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="btn-submit"
                [disabled]="planForm.invalid"
              >
                Créer le Plan
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Nouvelle Tâche -->
      <div
        class="modal-backdrop"
        *ngIf="showModalTache"
        (click)="showModalTache = false"
      >
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Ajouter une Tâche</h2>
              <p class="modal-subtitle">
                Affecter un nouvel ordre de travail au plan
              </p>
            </div>
            <button class="btn-close" (click)="showModalTache = false">
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
          <form [formGroup]="tacheForm" (ngSubmit)="soumettreTache()">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label
                    >Spécialité / Métier <span class="required">*</span></label
                  >
                  <div class="select-wrapper">
                    <select formControlName="metier" class="form-control">
                      <option value="MECANIQUE">Mécanique</option>
                      <option value="ELECTRICITE">Électricité</option>
                      <option value="PNEUMATIQUE">Pneumatique</option>
                      <option value="CHAUDRONNERIE">Chaudronnerie</option>
                      <option value="CLIMATISATION">Climatisation</option>
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
                <div class="form-group flex-1">
                  <label>Priorité <span class="required">*</span></label>
                  <div class="select-wrapper">
                    <select formControlName="priorite" class="form-control">
                      <option value="BASSE">Basse</option>
                      <option value="MOYENNE">Moyenne</option>
                      <option value="HAUTE">Haute</option>
                      <option value="CRITIQUE">Critique</option>
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
              <div class="form-group">
                <label>Technicien Assigné</label>
                <div class="select-wrapper">
                  <select formControlName="technicien" class="form-control">
                    <option [value]="null">
                      -- À définir ultérieurement --
                    </option>
                    <option
                      *ngFor="let t of listeTechniciens"
                      [value]="t.idUser"
                    >
                      {{ t.prenom }} {{ t.nom }} ({{ t.specialite }})
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
              <div class="form-group">
                <label>Instructions Techniques</label>
                <textarea
                  formControlName="observations"
                  class="form-control"
                  rows="4"
                  placeholder="Détaillez le travail à effectuer par le technicien..."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn-cancel"
                (click)="showModalTache = false"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="btn-submit"
                [disabled]="tacheForm.invalid"
              >
                Ajouter la Tâche
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

      .enterprise-layout {
        display: flex;
        height: calc(100vh - 60px);
        background-color: #f8fafc;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        overflow: hidden;
      }

      /* Utility */
      .mt-3 {
        margin-top: 16px;
      }
      .mt-4 {
        margin-top: 24px;
      }
      .w-100 {
        width: 100%;
        justify-content: center;
      }
      .required {
        color: #ef4444;
      }
      .fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Sidebar */
      .sidebar-plans {
        width: 340px;
        min-width: 340px;
        background: white;
        border-right: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        z-index: 10;
        box-shadow: 1px 0 10px rgba(0, 0, 0, 0.02);
      }
      .sidebar-header {
        padding: 24px 20px;
        border-bottom: 1px solid #e2e8f0;
        background: #fafafa;
      }
      .sidebar-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .sidebar-title-row h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.02em;
      }
      .badge-count {
        background: #e2e8f0;
        color: #475569;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .sidebar-subtitle {
        font-size: 0.85rem;
        color: #64748b;
        margin: 0;
      }

      .search-box {
        position: relative;
        width: 100%;
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
        padding: 10px 12px 10px 36px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.85rem;
        font-family: inherit;
        transition: all 0.2s;
        background: white;
        box-sizing: border-box;
      }
      .search-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .plans-list {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8fafc;
      }
      .plan-item {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        position: relative;
        overflow: hidden;
      }
      .plan-item:hover {
        border-color: #93c5fd;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }
      .plan-item.active {
        border-color: #3b82f6;
        background-color: #eff6ff;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      }
      .plan-item.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: #2563eb;
      }

      .plan-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .plan-ref {
        font-family: 'SFMono-Regular', Consolas, monospace;
        font-size: 0.7rem;
        color: #64748b;
        font-weight: 600;
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .dot-draft {
        background: #f59e0b;
        box-shadow: 0 0 0 2px #fef3c7;
      }
      .dot-progress {
        background: #3b82f6;
        box-shadow: 0 0 0 2px #dbeafe;
      }
      .dot-done {
        background: #10b981;
        box-shadow: 0 0 0 2px #d1fae5;
      }

      .plan-item-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 6px 0;
        line-height: 1.3;
      }
      .plan-item-engin {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        color: #475569;
        margin-bottom: 12px;
        font-weight: 500;
      }

      .plan-item-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .plan-date {
        font-size: 0.75rem;
        color: #94a3b8;
      }
      .plan-progress-mini {
        width: 60px;
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }
      .progress-bar-mini {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #2563eb);
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .empty-sidebar {
        text-align: center;
        color: #94a3b8;
        padding: 32px 16px;
        font-size: 0.875rem;
      }

      /* Main Content */
      .main-content {
        flex: 1;
        overflow-y: auto;
        padding: 40px;
        background: #f8fafc;
      }

      .empty-state-main {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        text-align: center;
        color: #64748b;
      }
      .empty-icon-large {
        color: #cbd5e1;
        margin-bottom: 24px;
      }
      .empty-state-main h2 {
        color: #1e293b;
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 12px 0;
      }
      .empty-state-main p {
        max-width: 400px;
        margin: 0;
        line-height: 1.5;
      }

      .plan-details-view {
        max-width: 900px;
        margin: 0 auto;
      }

      /* Header Card */
      .detail-header-card {
        background: white;
        border-radius: 16px;
        padding: 32px;
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.05),
          0 1px 3px -1px rgba(0, 0, 0, 0.03);
        border: 1px solid #e2e8f0;
        margin-bottom: 32px;
      }
      .detail-header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
      }
      .detail-ref-badge {
        display: inline-block;
        font-family: monospace;
        font-size: 0.85rem;
        color: #2563eb;
        font-weight: 600;
        background: #eff6ff;
        padding: 4px 12px;
        border-radius: 6px;
        margin-bottom: 8px;
        border: 1px solid #bfdbfe;
      }
      .detail-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.02em;
      }

      .detail-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
      }
      .status-badge-large {
        padding: 6px 16px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .bg-draft {
        background: #fef3c7;
        color: #b45309;
        border: 1px solid #fde68a;
      }
      .bg-progress {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
      }
      .bg-done {
        background: #f0fdf4;
        color: #15803d;
        border: 1px solid #bbf7d0;
      }

      .detail-info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        padding: 24px;
        background: #f8fafc;
        border-radius: 12px;
        margin-bottom: 32px;
        border: 1px solid #f1f5f9;
      }
      .info-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .info-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .info-value {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1e293b;
      }

      .progress-section {
        margin-bottom: 24px;
      }
      .progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .progress-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: #1e293b;
      }
      .progress-pct {
        font-size: 0.9rem;
        font-weight: 700;
        color: #2563eb;
      }
      .progress-track {
        height: 10px;
        background: #e2e8f0;
        border-radius: 5px;
        overflow: hidden;
        margin-bottom: 8px;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        border-radius: 5px;
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .fill-success {
        background: linear-gradient(90deg, #10b981, #059669);
      }
      .progress-stats {
        font-size: 0.8rem;
        color: #64748b;
        text-align: right;
      }

      .description-block {
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
      }
      .desc-text {
        font-size: 0.95rem;
        color: #334155;
        line-height: 1.6;
        margin: 8px 0 0 0;
      }

      /* Tasks Section */
      .tasks-section {
        margin-top: 40px;
      }
      .tasks-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .tasks-header h2 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }

      .tasks-timeline {
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: relative;
      }

      .task-card {
        display: flex;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        transition: all 0.2s;
      }
      .task-card:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      .task-metier-indicator {
        width: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
      .metier-icon {
        display: flex;
      }
      .metier-meca {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }
      .metier-elec {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      }
      .metier-pneu {
        background: linear-gradient(135deg, #64748b, #475569);
      }
      .metier-clima {
        background: linear-gradient(135deg, #06b6d4, #0891b2);
      }
      .metier-chaud {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }
      .metier-default {
        background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      }

      .task-content {
        flex: 1;
        padding: 20px;
      }
      .task-top-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      .task-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .task-title h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .prio-badge {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 4px;
        background: #f1f5f9;
        color: #64748b;
        border: 1px solid #e2e8f0;
      }
      .prio-high {
        background: #fef2f2;
        color: #dc2626;
        border-color: #fecaca;
      }

      .task-status-badge {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 99px;
        background: #f1f5f9;
        color: #475569;
      }
      .status-done {
        background: #dcfce3;
        color: #15803d;
      }

      .task-desc {
        font-size: 0.9rem;
        color: #475569;
        line-height: 1.5;
        margin: 0 0 16px 0;
      }

      .task-bottom-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid #f1f5f9;
      }
      .tech-assignment {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .tech-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #e0e7ff;
        color: #3730a3;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 1px;
      }
      .empty-avatar {
        background: #f1f5f9;
        color: #94a3b8;
      }
      .tech-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
      }
      .task-id {
        font-family: monospace;
        font-size: 0.8rem;
        color: #94a3b8;
      }

      .empty-state-tasks {
        text-align: center;
        padding: 40px;
        background: white;
        border-radius: 12px;
        border: 1px dashed #cbd5e1;
        color: #64748b;
      }
      .empty-icon-small {
        color: #cbd5e1;
        margin-bottom: 12px;
        display: flex;
        justify-content: center;
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
      .btn-success {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        padding: 10px 20px;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
      }
      .btn-success:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 8px -1px rgba(16, 185, 129, 0.3);
      }
      .btn-outline {
        display: flex;
        align-items: center;
        gap: 8px;
        background: white;
        color: #334155;
        border: 1px solid #cbd5e1;
        padding: 8px 16px;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-outline:hover {
        background: #f8fafc;
        border-color: #94a3b8;
        color: #0f172a;
      }

      /* Modals - Reusing Anomalies styles */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(15, 23, 42, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease-out;
      }
      .modal-container {
        background: white;
        border-radius: 16px;
        box-shadow:
          0 20px 25px -5px rgba(0, 0, 0, 0.1),
          0 10px 10px -5px rgba(0, 0, 0, 0.04);
        width: 100%;
        max-width: 600px;
        overflow: hidden;
        transform: scale(1);
        animation: scaleUp 0.2s ease-out;
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
        min-height: 80px;
        line-height: 1.5;
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
        font-family: inherit;
      }
      .btn-submit:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }
    `,
  ],
})
export class PlanInterventionComponent implements OnInit {
  plans: any[] = [];
  listeEngins: any[] = [];
  listeTechniciens: any[] = [];
  planSelectionne: any = null;
  searchTerm: string = '';

  showModalPlan = false;
  showModalTache = false;
  planForm: FormGroup;
  tacheForm: FormGroup;
  showEnginsList = false;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
  ) {
    this.planForm = this.fb.group({
      titre: ['', Validators.required],
      engin: ['', Validators.required],
      description: [''],
      anomalieId: [null],
    });

    this.tacheForm = this.fb.group({
      metier: ['MECANIQUE', Validators.required],
      priorite: ['MOYENNE', Validators.required],
      technicien: [null],
      observations: [''],
    });
  }

  ngOnInit(): void {
    this.chargerPlans();
    this.chargerEngins();
    this.chargerTechniciens();

    this.route.queryParams.subscribe((params) => {
      if (params['anomalieId']) {
        const anoId = params['anomalieId'];
        this.api.getAnomalies().subscribe((anomalies: any[]) => {
          const ano = anomalies.find((a: any) => a.idAnomalie == anoId);
          if (ano) {
            this.planForm.patchValue({
              titre: `Plan pour Anomalie #${anoId}: ${ano.description.substring(0, 30)}...`,
              engin: ano.engin ? this.getEnginDisplay(ano.engin) : '',
              description: `Origine: Anomalie #${anoId}\n${ano.description}`,
              anomalieId: anoId,
            });
            this.showModalPlan = true;
          }
        });
      }
    });
  }

  chargerPlans(): void {
    this.api.getPlansIntervention().subscribe((data: any[]) => {
      this.plans = data.sort((a: any, b: any) => b.idPlan - a.idPlan);
      if (this.planSelectionne) {
        this.planSelectionne =
          this.plans.find(
            (p: any) => p.idPlan === this.planSelectionne.idPlan,
          ) || null;
      }
    });
  }

  chargerEngins(): void {
    this.api.getMateriels().subscribe((data: any[]) => {
      this.listeEngins = data.filter((e: any) => {
        const stat = (e.statut || '').toString().toUpperCase();
        const cm = (e.codeMateriel || e.matricule || '').toString().toUpperCase();
        return stat !== 'VENDU' && stat !== 'FERRAILLE' && !cm.includes('VENDU');
      });
    });
  }

  chargerTechniciens(): void {
    this.api
      .getTechniciens()
      .subscribe((data: any[]) => (this.listeTechniciens = data));
  }

  get filteredPlans(): any[] {
    if (!this.searchTerm) return this.plans;
    const term = this.searchTerm.toLowerCase();
    return this.plans.filter(
      (p) =>
        p.titre?.toLowerCase().includes(term) ||
        p.engin?.matricule?.toLowerCase().includes(term) ||
        p.engin?.codeMateriel?.toLowerCase().includes(term) ||
        p.idPlan?.toString().includes(term),
    );
  }

  ouvrirNouveauPlan(): void {
    this.planForm.reset();
    this.showModalPlan = true;
  }

  creerPlan(): void {
    if (this.planForm.valid) {
      const val = this.planForm.value;
      const selectedEngin = this.listeEngins.find(e => this.getEnginDisplay(e) === val.engin);
      
      if (!selectedEngin) {
        alert("Veuillez sélectionner un équipement valide depuis la liste.");
        return;
      }

      const payload = {
        titre: val.titre,
        engin: { idEngin: selectedEngin.idEngin },
        description: val.description,
        statut: 'BROUILLON',
      };

      const sub = val.anomalieId
        ? this.api.createPlanFromAnomalie(val.anomalieId, payload)
        : this.api.createPlanFromAnomalie(0, payload); // Adapt based on backend

      sub.subscribe(() => {
        this.chargerPlans();
        this.showModalPlan = false;
      });
    }
  }

  selectionnerPlan(plan: any): void {
    this.planSelectionne = plan;
  }

  ajouterTache(): void {
    this.tacheForm.reset({ metier: 'MECANIQUE', priorite: 'MOYENNE' });
    this.showModalTache = true;
  }

  soumettreTache(): void {
    if (this.tacheForm.valid && this.planSelectionne) {
      const val = this.tacheForm.value;
      const payload = {
        metier: val.metier,
        priorite: val.priorite,
        technicien: val.technicien ? { idUser: val.technicien } : null,
        observations: val.observations,
        statut: 'PROGRAMMEE',
        type: 'Planifiée',
      };
      this.api
        .addInterventionToPlan(this.planSelectionne.idPlan, payload)
        .subscribe(() => {
          this.chargerPlans();
          this.showModalTache = false;
        });
    }
  }

  validerPlan(): void {
    if (this.planSelectionne) {
      const updated = { ...this.planSelectionne, statut: 'EN_COURS' };
      this.api
        .updatePlan(this.planSelectionne.idPlan, updated)
        .subscribe(() => {
          this.chargerPlans();
        });
    }
  }

  cloturerPlan(): void {
    if (
      this.planSelectionne &&
      confirm("Voulez-vous clôturer ce plan d'intervention ?")
    ) {
      const updated = { ...this.planSelectionne, statut: 'TERMINE' };
      this.api
        .updatePlan(this.planSelectionne.idPlan, updated)
        .subscribe(() => {
          this.chargerPlans();
        });
    }
  }

  tachesTerminees(plan: any): number {
    if (!plan || !plan.interventions) return 0;
    return plan.interventions.filter((i: any) => i.statut === 'CLOTUREE')
      .length;
  }

  calculerProgression(plan: any): number {
    if (!plan || !plan.interventions || plan.interventions.length === 0)
      return 0;
    const terminees = this.tachesTerminees(plan);
    return Math.round((terminees / plan.interventions.length) * 100);
  }

  getMetierClass(metier: string): string {
    switch (metier) {
      case 'MECANIQUE':
        return 'metier-meca';
      case 'ELECTRICITE':
        return 'metier-elec';
      case 'PNEUMATIQUE':
        return 'metier-pneu';
      case 'CHAUDRONNERIE':
        return 'metier-chaud';
      case 'CLIMATISATION':
        return 'metier-clima';
      default:
        return 'metier-default';
    }
  }

  getEnginDisplay(e: any): string {
    if (!e) return '';
    return `${e.codeMateriel || e.matricule} - ${e.marque}`;
  }

  getFilteredEngins(): any[] {
    const term = this.planForm.get('engin')?.value;
    if (!term) return this.listeEngins;
    
    // Check if term matches exactly an engin (meaning it was selected)
    const exactMatch = this.listeEngins.some(e => this.getEnginDisplay(e) === term);
    if (exactMatch) return this.listeEngins; // Show all options if a selection was already made so they can change it

    const termLower = term.toLowerCase();
    return this.listeEngins.filter(e => 
      this.getEnginDisplay(e).toLowerCase().includes(termLower)
    );
  }

  selectEngin(e: any, event: MouseEvent): void {
    event.preventDefault(); // Prevents the input from losing focus immediately
    this.planForm.patchValue({ engin: this.getEnginDisplay(e) });
    this.showEnginsList = false;
  }

  cacherListeEngins(): void {
    setTimeout(() => {
      this.showEnginsList = false;
    }, 200);
  }
}
