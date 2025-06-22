import {CanActivate, Router, RouterModule, Routes} from '@angular/router';
import {AdminComponent} from './admin/admin.component';
import {MapsComponent} from './maps/maps.component';
import {HomeComponent} from './home/home.component';
import {LoginComponent} from './login/login.component';
import {Injectable, NgModule} from '@angular/core';
import {AuthService} from './services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAdmin()) {
      return true;
    }
    this.router.navigate(['/home']);
    return false;
  }
}

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'maps', component: MapsComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AdminGuard]  // Guard para proteger la ruta
  },
  { path: '**', redirectTo: '/home' }
];
