import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit {

  // Search logic
  searchQuery = '';
  pieces: any[] = [];
  piecesFiltrees: any[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 15;

  // Demande state
  demandes: any[] = [];
  demandesEnAttente: any[] = [];

  // Create Mode state
  showDemandeForm = false;
  nouvelleDemande: any = {
    lignes: [],
    interventionId: ''
  };
  interventions: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.chargerDemandes();
    this.chargerToutLeStock();
    this.chargerInterventions();
  }

  chargerInterventions(): void {
    this.apiService.getInterventions().subscribe({
      next: (data: any[]) => {
        this.interventions = data.filter((i: any) => i.statut !== 'Clôturée');
      },
      error: (err: any) => console.error("Erreur chargement interventions", err)
    });
  }

  chargerToutLeStock(): void {
    this.apiService.getPieces().subscribe({
      next: (data: any[]) => {
        this.pieces = data;
        this.piecesFiltrees = data;
        this.currentPage = 1;
      },
      error: (err: any) => console.error("Erreur chargement stock", err)
    });
  }

  get paginatedPieces(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.piecesFiltrees.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.piecesFiltrees.length / this.itemsPerPage);
  }

  changerPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  currentDemandesPage = 1;
  demandesPerPage = 5;

  get paginatedDemandes(): any[] {
    const start = (this.currentDemandesPage - 1) * this.demandesPerPage;
    return this.demandes.slice(start, start + this.demandesPerPage);
  }

  get totalDemandesPages(): number {
    return Math.ceil(this.demandes.length / this.demandesPerPage);
  }

  changerDemandesPage(page: number): void {
    if (page >= 1 && page <= this.totalDemandesPages) {
      this.currentDemandesPage = page;
    }
  }

  rechercherPieces(): void {
    this.currentPage = 1;
    if (!this.searchQuery) {
      this.piecesFiltrees = this.pieces;
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.piecesFiltrees = this.pieces.filter(p => 
      p.designation && p.designation.toLowerCase().includes(q)
    );
  }

  ajouterAuPanier(piece: any): void {
    if (!piece || piece.quantiteEnStock <= 0) {
      alert("⚠️ Rupture de stock ! Impossible d'ajouter cette pièce à la sortie.");
      return;
    }

    const exist = this.nouvelleDemande.lignes.find((l: any) => l.piece.idPiece === piece.idPiece);
    if (exist) {
      if (exist.quantiteDemandee < piece.quantiteEnStock) {
        exist.quantiteDemandee++;
      } else {
        alert("Stock maximal atteint pour cette pièce.");
      }
      return;
    }
    
    this.nouvelleDemande.lignes.push({
      piece: piece,
      quantiteDemandee: 1
    });
  }

  verifierQuantite(item: any): void {
    if (item.quantiteDemandee > item.piece.quantiteEnStock) {
      item.quantiteDemandee = item.piece.quantiteEnStock;
      alert(`Stock maximum disponible est de ${item.piece.quantiteEnStock}.`);
    } else if (item.quantiteDemandee < 1) {
      item.quantiteDemandee = 1;
    }
  }

  retirerDuPanier(index: number): void {
    this.nouvelleDemande.lignes.splice(index, 1);
  }

  soumettreDemande(): void {
    if (this.nouvelleDemande.lignes.length === 0) {
      alert("Le panier est vide.");
      return;
    }
    if (!this.nouvelleDemande.interventionId) {
      alert("Veuillez sélectionner l'Intervention (O.R) ciblée.");
      return;
    }

    const cible = this.interventions.find((i: any) => i.idIntervention == this.nouvelleDemande.interventionId);
    if (cible) {
       this.nouvelleDemande.motifOuEngin = `Lié à l'intervention #INT-${cible.idIntervention} (Matériel: ${cible.engin?.matricule || cible.engin?.codeMateriel})`;
       this.nouvelleDemande.demandeur = cible.technicien ? `${cible.technicien.prenom} ${cible.technicien.nom}` : 'Chef Atelier';
    }

    this.apiService.creerDemandeSortie(this.nouvelleDemande).subscribe({
      next: () => {
        alert("Fiche de sortie transmise au Chef d'Atelier avec succès !");
        this.nouvelleDemande = { lignes: [], interventionId: '' };
        this.chargerDemandes();
      },
      error: (err: any) => console.error(err)
    });
  }

  chargerDemandes(): void {
    this.apiService.getDemandesSortie().subscribe({
      next: (data: any[]) => this.demandes = data,
      error: (err: any) => console.error(err)
    });
    this.apiService.getDemandesEnAttente().subscribe({
      next: (data: any[]) => this.demandesEnAttente = data,
      error: (err: any) => console.error(err)
    });
  }

  validerDemande(id: number): void {
    if(confirm("Confirmez-vous la validation de cette sortie ? Le stock sera mis à jour.")) {
      this.apiService.validerDemandeSortie(id).subscribe({
        next: () => {
          this.chargerDemandes();
          this.chargerToutLeStock();
        },
        error: (err: any) => console.error(err)
      });
    }
  }

  rejeterDemande(id: number): void {
    const motif = prompt("Motif du refus de sortie de stock ?");
    if(motif !== null) {
      this.apiService.rejeterDemandeSortie(id, motif).subscribe({
        next: () => this.chargerDemandes(),
        error: (err: any) => console.error(err)
      });
    }
  }
}
