import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-maintenance-predictive',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance-predictive.component.html',
  styleUrl: './maintenance-predictive.component.css'
})
export class MaintenancePredictiveComponent implements OnInit {
  predictions: any[] = [];
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadPredictions();
  }

  loadPredictions(): void {
    this.loading = true;
    this.apiService.getPredictiveMaintenance().subscribe({
      next: (data: any[]) => {
        this.predictions = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur maintenance:', err);
        this.loading = false;
      }
    });
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'CRITICAL': return 'bg-danger-subtle text-danger border-danger';
      case 'HIGH': return 'bg-warning-subtle text-warning-emphasis border-warning';
      default: return 'bg-info-subtle text-info-emphasis border-info';
    }
  }
}
