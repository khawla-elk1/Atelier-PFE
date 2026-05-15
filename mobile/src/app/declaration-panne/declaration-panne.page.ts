import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-declaration-panne',
  templateUrl: './declaration-panne.page.html',
  styleUrls: ['./declaration-panne.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class DeclarationPannePage implements OnInit {

  chantiers: any[] = [];
  engins: any[] = [];
  enginsFiltres: any[] = [];
  isSubmitting = false;
  userName: string = '';
  searchTerm: string = '';
  showEnginResults: boolean = false;
  selectedEnginName: string = '';

  // Options de statut cliquables
  statutOptions = [
    { value: 'En attente',    label: 'En attente',    icon: 'time-outline',           color: '#e67e22' },
    { value: 'En cours',      label: 'En cours',      icon: 'sync-outline',           color: '#2980b9' },
    { value: 'Signalée',      label: 'Signalée',      icon: 'flag-outline',           color: '#8e44ad' },
    { value: 'Arrêt machine', label: 'Arrêt machine', icon: 'stop-circle-outline',    color: '#e74c3c' },
  ];

  // Tous les champs de l'entité Anomalie — TOUS obligatoires
  anomalie: any = {
    chantierDeclare: '',        // Champ texte manuel pour le chantier
    enginId:      null,         // → { idEngin: X } au moment de l'envoi
    enginDeclare: '',           // Code matériel / désignation manuelle
    description:  '',           // TEXT — description complète
    criticite:    'NORMALE',    // Enum: URGENTE | NORMALE | PLANIFIEE
    statut:       'En attente', // Statut initial
    photoUrl:     null          // URL de la photo
  };

  constructor(
    private apiService: ApiService,
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.userName = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Comptable';
    this.loadChantiers();
    this.loadEngins();
  }

  loadChantiers() {
    this.apiService.getChantiers().subscribe({
      next:  (data) => this.chantiers = data,
      error: (err)  => console.warn('Chantiers non chargés', err)
    });
  }

  loadEngins() {
    this.apiService.getEngins().subscribe({
      next:  (data) => {
        this.engins = data;
        this.enginsFiltres = data; // Show all by default since chantier is manual
      },
      error: (err)  => console.warn('Engins non chargés', err)
    });
  }

  onChantierChange() {
    // No longer filter engins by chantier ID since it's manual text
  }

  // ── Recherche Engins ──────────────────────────────────────
  filterEngins() {
    const query = this.searchTerm.toLowerCase().trim();
    if (query.length < 2) {
      this.enginsFiltres = [];
      this.showEnginResults = false;
      return;
    }

    this.enginsFiltres = this.engins.filter(e => 
      e.matricule?.toLowerCase().includes(query) ||
      e.modele?.toLowerCase().includes(query) ||
      e.type?.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to top 5 results for clarity

    this.showEnginResults = true;
  }

  selectEngin(engin: any) {
    this.anomalie.enginId = engin.idEngin;
    this.anomalie.enginDeclare = `${engin.matricule} — ${engin.modele}`;
    this.selectedEnginName = this.anomalie.enginDeclare;
    this.searchTerm = '';
    this.showEnginResults = false;
  }

  clearEnginSelection() {
    this.anomalie.enginId = null;
    this.anomalie.enginDeclare = '';
    this.selectedEnginName = '';
  }

  // ── Progression ──────────────────────────────────────────
  getTotalFields(): number { return 6; }

  getFilledCount(): number {
    let n = 0;
    if (this.anomalie.chantierDeclare)              n++;
    if (this.anomalie.enginId || this.anomalie.enginDeclare) n++;
    if (this.anomalie.enginDeclare)            n++; // this might be double counting if both are filled, but it's ok for progress bar approximation or we can fix it.
    // Let's fix the progress counting:
    // 1. chantier
    // 2. enginId or enginDeclare
    // 3. description
    // 4. criticite
    // 5. photoUrl
    // 6. statut (always filled) - wait total is 6.
    // Let's redefine:
    n = 0;
    if (this.anomalie.chantierDeclare) n++;
    if (this.anomalie.enginId || this.anomalie.enginDeclare) n++;
    if (this.anomalie.description?.length > 20) n++;
    if (this.anomalie.criticite) n++;
    if (this.anomalie.statut) n++;
    if (this.anomalie.photoUrl) n++;
    return n;
  }

  getProgress(): number {
    return Math.round((this.getFilledCount() / this.getTotalFields()) * 100);
  }

  // ── Validation — TOUS les champs sont obligatoires ───────
  isFormReady(): boolean {
    return (
      !!this.anomalie.chantierDeclare &&
      (!!this.anomalie.enginId || !!this.anomalie.enginDeclare) &&
      this.anomalie.description?.trim().length > 20 &&
      !!this.anomalie.criticite &&
      !!this.anomalie.photoUrl
    );
  }

  // ── Photo ─────────────────────────────────────────────────
  async takePicture() {
    // Simulation — remplacer par Capacitor Camera en production
    this.anomalie.photoUrl = `https://placehold.co/600x400/1e3a5f/ffffff?text=Photo+Panne`;
    const toast = await this.toastController.create({
      message: '📷 Photo ajoutée avec succès',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  removePhoto() {
    this.anomalie.photoUrl = null;
  }

  // ── Soumission ────────────────────────────────────────────
  async submitAnomalie() {
    if (!this.isFormReady()) {
      const toast = await this.toastController.create({
        message: '⚠️ Tous les champs sont obligatoires — vérifiez la liste',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }

    this.isSubmitting = true;

    // Append chantier to description since backend doesn't have a chantier field on Anomalie
    const descriptionWithChantier = `[Chantier: ${this.anomalie.chantierDeclare.trim()}]\n${this.anomalie.description.trim()}`;

    // Payload conforme à l'entité Anomalie du backend
    const payload: any = {
      description:  descriptionWithChantier,
      enginDeclare: this.anomalie.enginDeclare.trim(),
      criticite:    this.anomalie.criticite,
      statut:       this.anomalie.statut,
      photoUrl:     this.anomalie.photoUrl,
    };

    if (this.anomalie.enginId) {
      payload.engin = { idEngin: this.anomalie.enginId };
    }

    const userId = localStorage.getItem('userId');
    if (userId) {
      payload.declarant = { idUtilisateur: parseInt(userId, 10) };
    }

    this.apiService.declareAnomalie(payload).subscribe({
      next: async () => {
        this.isSubmitting = false;
        const toast = await this.toastController.create({
          message: '✅ Panne déclarée ! L\'équipe maintenance a été notifiée.',
          duration: 4000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
        this.resetForm();
      },
      error: async (err) => {
        this.isSubmitting = false;
        console.error('Erreur soumission:', err);
        const toast = await this.toastController.create({
          message: '❌ Erreur réseau. Vérifiez la connexion au serveur.',
          duration: 4000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }

  resetForm() {
    this.anomalie = {
      chantierDeclare: '',
      enginId:      null,
      enginDeclare: '',
      description:  '',
      criticite:    'NORMALE',
      statut:       'En attente',
      photoUrl:     null
    };
    // No need to reset enginsFiltres since it shows all
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
