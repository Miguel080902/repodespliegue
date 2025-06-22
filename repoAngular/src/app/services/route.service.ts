import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import {map, Observable} from 'rxjs';

interface Route {
  id: number;
  user: number;
  coordinates: { lat: number, lng: number }[]; // Cambiado a formato de objeto
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  createRoute(coordinates: number[][]): Observable<Route> {
    // Obtiene el ID del usuario del token decodificado
    const userId = this.authService.getUserId();

    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    return this.http.post<Route>(`${this.apiUrl}/routes/`, {
      coordinates,
      user: userId // Envía el ID del usuario
    });
  }
  getAllRoutes(): Observable<Route[]> {
    return this.http.get<Route[]>(`${this.apiUrl}/routes/`);
  }

  getRouteById(id: number): Observable<Route> {
    return this.http.get<Route>(`${this.apiUrl}/routes/${id}/`);
  }

  deleteRoute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/routes/${id}/`);
  }

  getLastRouteForCurrentUser(): Observable<{ coordinates: { lat: number, lng: number }[] }> {
    return this.http.get<{ coordinates: number[][] }>(`${this.apiUrl}/routes/last/`).pipe(
      map(response => ({
        ...response,
        coordinates: response.coordinates.map(coord => ({
          lat: coord[0],
          lng: coord[1]
        }))
      }))
    );
  }
}
