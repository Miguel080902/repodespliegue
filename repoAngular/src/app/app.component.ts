import { Component } from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {filter} from 'rxjs';
import {ToolbarComponent} from './toolbar/toolbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,ToolbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'desafio';

  showToolbar = true;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showToolbar = !event.urlAfterRedirects.includes('/login');
    });
  }
}
