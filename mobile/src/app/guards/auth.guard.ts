import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      return true;
    }
    // Redirige vers le login si non authentifié
    return this.router.parseUrl('/login');
  }
}
