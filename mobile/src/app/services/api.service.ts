import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Auth: Simulated login for the accountant
  login(credentials: any): Observable<any> {
    // Ideally this goes to /api/auth/login. For now, we mock or use existing endpoint.
    return this.http.post(`${this.baseUrl}/auth/login`, credentials);
  }

  // Get Chantiers
  getChantiers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/chantiers`);
  }

  // Get Engins (Optionally by Chantier)
  getEngins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/engins`);
  }

  // Declare Anomalie
  declareAnomalie(anomalie: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/anomalies`, anomalie);
  }
}
