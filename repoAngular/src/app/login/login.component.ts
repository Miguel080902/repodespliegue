import { Component } from '@angular/core';
import {FormCardComponent} from './components/form-card/form-card.component';
import {CommonModule} from '@angular/common';
import {animate, style, transition, trigger} from '@angular/animations';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormCardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  animations: [
    trigger('slideOutView', [
      transition(':leave', [
        animate('0.5s ease', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class LoginComponent {
  showLoginView = true;

  constructor(private router: Router) {}

  handleLoginSuccess() {
    this.showLoginView = false;
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 500); // espera a que la animación termine
  }
}
