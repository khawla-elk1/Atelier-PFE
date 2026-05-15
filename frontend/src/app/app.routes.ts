import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ErpSyncComponent } from './erp-sync/erp-sync.component';
import { EnginsComponent } from './engins/engins.component';
import { AnomaliesComponent } from './anomalies/anomalies.component';
import { InterventionsComponent } from './interventions/interventions.component';
import { CarburantComponent } from './carburant/carburant.component';
import { EquipeComponent } from './equipe/equipe.component';
import { StockComponent } from './stock/stock.component';
import { MaintenancePredictiveComponent } from './maintenance-predictive/maintenance-predictive.component';
import { HistoriqueComponent } from './historique/historique.component';
import { PlanInterventionComponent } from './plan-intervention/plan-intervention.component';
import { ChantiersComponent } from './chantiers/chantiers.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'materiels', component: EnginsComponent },
  { path: 'chantiers', component: ChantiersComponent },
  { path: 'anomalies', component: AnomaliesComponent },
  { path: 'plans-intervention', component: PlanInterventionComponent },
  { path: 'interventions', component: InterventionsComponent },
  { path: 'historique', component: HistoriqueComponent },
  { path: 'maintenance-predictive', component: MaintenancePredictiveComponent },
  { path: 'erp-sync', component: ErpSyncComponent },
  { path: 'carburant', component: CarburantComponent },
  { path: 'equipe', component: EquipeComponent },
  { path: 'stock', component: StockComponent }
];

