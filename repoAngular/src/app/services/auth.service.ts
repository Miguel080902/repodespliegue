import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;  // Añade esta propiedad
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:8000/api';
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor() {
    this.loadUserFromStorage();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, { email, password }).pipe(
      tap(response => {
        this.storeTokens(response.access, response.refresh, response.user.username, response.user.is_staff); // Pasa el username
        this.currentUserSubject.next(response.user);
      })
    );
  }

  createUser(userData: {username: string, email: string, password: string}): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getAccessToken()}`
    });

    return this.http.post(`${this.apiUrl}/users/create/`, userData, { headers });
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/`);
  }

  private storeTokens(access: string, refresh: string, username: string, isAdmin: boolean): void {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('username', username);
    localStorage.setItem('is_admin', String(isAdmin));  // Guarda si es admin
  }

  isAdmin(): boolean {
    return localStorage.getItem('is_admin') === 'true';
  }

  loadUserFromStorage(): void {
    const accessToken = this.getAccessToken();
    const username = localStorage.getItem('username');
    const isAdmin = localStorage.getItem('is_admin') === 'true';

    if (accessToken && username) {
      this.currentUserSubject.next({
        id: JSON.parse(atob(accessToken.split('.')[1])).user_id,
        username: username,
        email: JSON.parse(atob(accessToken.split('.')[1])).email,
        is_staff: isAdmin
      });
    }
  }

  getUserId(): number | null {
    const accessToken = this.getAccessToken();
    if (accessToken) {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      return payload.user_id;
    }
    return null;
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getCurrentUser(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username'); // Limpia el username
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post(`${this.apiUrl}/token/refresh/`, { refresh: refreshToken }).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access);
      })
    );
  }
}
