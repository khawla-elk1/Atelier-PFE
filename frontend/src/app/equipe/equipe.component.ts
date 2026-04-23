import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-equipe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipe.component.html',
  styleUrls: ['./equipe.component.css']
})
export class EquipeComponent implements OnInit {

  // Trigger recompile
  techniciens: any[] = [];
  techniciensEnAttente: any[] = [];
  
  showSaisieForm = false;
  nouveauTech = {
    nom: '',
    prenom: '',
    specialite: 'MECANICIEN' // Default
  };

  specialites = [
    'MECANICIEN',
    'ELECTRICIEN',
    'TOLIER',
    'PEINTRE',
    'SOUDEUR',
    'HYDRAULICIEN',
    'AIDE_MECANICIEN'
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.apiService.getTechniciens().subscribe({
      next: (data) => this.techniciens = data,
      error: (err) => console.error('Erreur chargement techniciens', err)
    });

    this.apiService.getTechniciensEnAttente().subscribe({
      next: (data) => this.techniciensEnAttente = data,
      error: (err) => console.error('Erreur chargement techniciens en attente', err)
    });
  }

  onSubmitSaisie(): void {
    if (!this.nouveauTech.nom || !this.nouveauTech.prenom) {
      alert("Veuillez renseigner le nom et le prénom.");
      return;
    }
    
    // Le technicien n'a pas forcément besoin de mot de passe à la création, on laisse le backend gérér ou on met null
    this.apiService.saisieTechnicien(this.nouveauTech).subscribe({
      next: (res) => {
        alert("Saisie réussie ! Le profil est en attente de l'accord du Chef d'Atelier.");
        this.nouveauTech = { nom: '', prenom: '', specialite: 'MECANICIEN' };
        this.showSaisieForm = false;
        this.loadData(); // Rafraîchir
      },
      error: (err) => {
        console.error('Erreur lors de la saisie', err);
        alert("Une erreur s'est produite lors de la saisie.");
      }
    });
  }

  valider(id: number, decision: 'APPROUVE' | 'REJETE'): void {
    if (confirm(`Voulez-vous vraiment ${decision === 'APPROUVE' ? 'approuver' : 'rejeter'} ce technicien ?`)) {
      this.apiService.validerTechnicien(id, decision).subscribe({
        next: () => {
          this.loadData();
        },
        error: (err) => {
          console.error("Erreur de validation", err);
        }
      });
    }
  }

}
