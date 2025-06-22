import {Component, EventEmitter, inject, Output} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {Router} from '@angular/router';
import {animate, style, transition, trigger} from '@angular/animations';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import {AuthService} from '../../../services/auth.service';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-form-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    MatIconModule,
    ReactiveFormsModule],
  templateUrl: './form-card.component.html',
  styleUrl: './form-card.component.scss',
  animations: [
    trigger('fadeInCard', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }), // Empieza invisible y ligeramente abajo
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateY(0)' })), // Sube y se desvanece
      ]),
    ]),
  ],
})
export class FormCardComponent {
  @Output() loginSuccess = new EventEmitter<void>();
  loginForm: FormGroup;
  errorMessage: string = '';

  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Añade Validators.email
      password: ['', Validators.required]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: () => {
          this.loginSuccess.emit();
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 200);
        },
        error: (err) => {
          this.errorMessage = 'Credenciales incorrectas';
          console.error('Login error:', err);
        }
      });
    }
  }
}
