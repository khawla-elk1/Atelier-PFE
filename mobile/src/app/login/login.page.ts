import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class LoginPage implements OnInit {
  email: string = '';
  motDePasse: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {}

  login() {
    if (!this.email || !this.motDePasse) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }
    this.errorMessage = '';
    this.isLoading = true;

    // Tentative de login via le backend
    this.apiService.login({ email: this.email, password: this.motDePasse }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        localStorage.setItem('userEmail', this.email);
        localStorage.setItem('userId', response?.user?.idUtilisateur ?? '');
        localStorage.setItem('userName', response?.user?.nom ?? this.email);
        this.router.navigate(['/declaration-panne']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 403) {
            this.errorMessage = 'Email ou mot de passe incorrect.';
        } else {
            this.errorMessage = 'Erreur de connexion au serveur. Vérifiez votre réseau.';
        }
      }
    });
  }
}
