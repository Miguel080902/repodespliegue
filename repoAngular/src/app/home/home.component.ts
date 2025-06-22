import {Component, inject} from '@angular/core';
import {trigger, transition, style, animate, query, stagger} from '@angular/animations';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../services/auth.service';
import {MatIconModule} from '@angular/material/icon';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [
    trigger('fadeInUp', [ // Nombre de la animación cambiado a fadeInUp
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }), // Inicialmente invisible y un poco abajo
        animate('0.7s ease-out', style({ opacity: 1, transform: 'translateY(0)' })), // Sube y se desvanece
      ]),
    ]),
    // Opcional: Animación escalonada para los ítems de la lista
    trigger('listStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger('100ms', [ // Cada ítem aparece con un retraso
            animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
})
export class HomeComponent {
  protected authService = inject(AuthService);

  username: string | null = null;

  constructor() {
    this.username = this.authService.getUsername();
  }

  // O usando el observable
  currentUser$ = this.authService.getCurrentUser();
}
