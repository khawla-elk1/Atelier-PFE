import { Component } from '@angular/core';

@Component({
  selector: 'app-carburant',
  standalone: true,
  template: `
    <div class="page-container animate-slide-up">
      <div class="flex-row space-between header-title">
        <div>
          <h1>Consommation Carburant</h1>
          <p class="subtitle">Suivi des pleins, coûts et calcul de la moyenne de consommation</p>
        </div>
        <button class="btn-primary">+ Ajouter un plein</button>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card glass-panel flex-row">
          <div class="kpi-icon" style="background: rgba(37, 99, 235, 0.1); color: var(--primary);">
             <i class="icon-gas">⛽</i>
          </div>
          <div class="kpi-info">
            <h3>Dépense Mensuelle</h3>
            <div class="kpi-value text-accent">12,450 DH</div>
            <p class="kpi-trend">-5% vs mois précédent</p>
          </div>
        </div>
      </div>

      <div class="glass-panel mt-4">
        <table class="data-table">
          <thead>
            <tr>
              <th>Matériel</th>
              <th>Date Plein</th>
              <th>Station</th>
              <th>Litres</th>
              <th>Coût (DH)</th>
              <th>Moyenne (L/100)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>CB-12</strong> Mercedes Arocs</td>
              <td>01/04/2026</td>
              <td>Afriquia Tanger</td>
              <td>350 L</td>
              <td>3,500 DH</td>
              <td><span class="badge warning">35 L/100km</span></td>
              <td><button class="btn-primary small">Détails</button></td>
            </tr>
            <tr>
              <td><strong>TR-402</strong> Dacia Duster</td>
              <td>30/03/2026</td>
              <td>Total Rabat</td>
              <td>45 L</td>
              <td>630 DH</td>
              <td><span class="badge success">5.2 L/100km</span></td>
              <td><button class="btn-primary small">Détails</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class CarburantComponent {}
