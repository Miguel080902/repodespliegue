import {Component, ElementRef, inject, OnInit, ViewChild} from '@angular/core';
import {Loader} from '@googlemaps/js-api-loader';
import {RouteService} from '../services/route.service';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-maps',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './maps.component.html',
  styleUrl: './maps.component.css'
})
export class MapsComponent implements OnInit{
  private routeService = inject(RouteService);
  private drawingManager!: google.maps.drawing.DrawingManager;
  @ViewChild('map') mapElement!: ElementRef;
  private map!: google.maps.Map;
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;
  protected path: google.maps.LatLng[] = [];
  private markers: google.maps.Marker[] = [];
  private animationInterval: any;
  private currentPositionIndex = 0;
  protected isPlaying = false;
  private routePolyline!: google.maps.Polyline;
  private originalWaypoints: google.maps.DirectionsWaypoint[] = [];
  private optimizedWaypoints: google.maps.DirectionsWaypoint[] = [];
  protected isOptimized = false;
  private vehicleMarker!: google.maps.Marker;

  ngOnInit(): void {
    this.loadMap().then(() => {
      this.loadLastRoute(); // Load the last route after the map is loaded
    });
  }

  private loadMap(): Promise<void> {
    const loader = new Loader({
      apiKey: 'AIzaSyBTGDBpsd0lWv0A0Cz6CdGOkiAP6GsvKQU', // <--- IMPORTANT: Replace with your actual Google Maps API Key
      version: 'weekly',
      libraries: ['drawing', 'geometry']
    });

    return loader.load().then(() => {
      this.directionsService = new google.maps.DirectionsService();
      this.initializeMap();
      this.initializeDrawingTools();
    }).catch(error => {
      console.error('Error al cargar Google Maps API:', error);
      throw error; // Re-throw to propagate the error if needed
    });
  }


  private initializeMap(): void {
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: { lat: -12.033628, lng: -77.028937 }, // Lima, Peru coordinates
      zoom: 12,
      mapTypeId: 'roadmap'
    });

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true, // Hide default markers from DirectionsRenderer
      preserveViewport: true // Keep current zoom
    });
    this.directionsRenderer.setMap(this.map);
  }

  private initializeDrawingTools(): void {
    this.drawingManager = new google.maps.drawing.DrawingManager({ // Assign to class property
      drawingMode: google.maps.drawing.OverlayType.MARKER,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.MARKER]
      },
      markerOptions: {
        draggable: true,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png', // A clearer marker icon
          scaledSize: new google.maps.Size(32, 32)
        }
      }
    });

    this.drawingManager.setMap(this.map);

    google.maps.event.addListener(this.drawingManager, 'markercomplete', (marker: google.maps.Marker) => {
      this.markers.push(marker); // Store the marker reference
      this.path.push(marker.getPosition()!);

      marker.addListener('dragend', () => {
        this.updatePathFromMarkers(); // Update path if marker is dragged
        this.updateRoute(); // Recalculate route
      });

      if (this.path.length >= 2) {
        this.updateRoute();
      }
    });
  }

  // New method to update 'path' array based on current marker positions
  private updatePathFromMarkers(): void {
    this.path = this.markers.map(marker => marker.getPosition()!);
  }

  private updateRoute(optimize = false): void {
    if (this.path.length < 2) {
      this.directionsRenderer.setDirections(null); // Clear directions if not enough points
      if (this.routePolyline) {
        this.routePolyline.setMap(null);
      }
      return;
    }

    if (this.routePolyline) {
      this.routePolyline.setMap(null); // Clear previous polyline
    }

    // Ensure the path array is updated before forming waypoints
    this.updatePathFromMarkers();

    // The origin is always the first point
    const origin = this.path[0];
    // The destination is always the last point
    const destination = this.path[this.path.length - 1];

    // Waypoints are all points between origin and destination
    const intermediatePoints = this.path.slice(1, -1);

    console.log('Directions request:', {
      origin: origin.toJSON(),
      destination: destination.toJSON(),
      waypoints: intermediatePoints.map(p => p.toJSON()),
      optimizeWaypoints: optimize
    }); // <-- Add this
    // If optimizing, and we have enough points, use the optimized waypoints if available,
    // otherwise use the current intermediate points for the optimization request.
    let waypointsToUse: google.maps.DirectionsWaypoint[] = [];
    if (optimize) {
      // When optimize is true, we always want the DirectionsService to re-calculate the optimal order.
      // So, we pass all intermediate points as waypoints, and set optimizeWaypoints: true.
      waypointsToUse = intermediatePoints.map(location => ({
        location: location,
        stopover: true
      }));
    } else {
      // When not optimizing, use the stored original order or the optimized order if it was previously set.
      waypointsToUse = this.isOptimized ? this.optimizedWaypoints : intermediatePoints.map(location => ({
        location: location,
        stopover: true
      }));
    }


    this.directionsService.route({
      origin: origin,
      destination: destination,
      waypoints: waypointsToUse,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: optimize // This is the key for optimization
    }, (response, status) => {
      if (status === 'OK' && response) {
        this.directionsRenderer.setDirections(response);
        const route = response.routes[0];

        // If optimized, update the path and store optimized waypoints
        if (optimize) {
          // Reorder the original markers to match the optimized route order
          const orderedWaypoints = response.routes[0].waypoint_order.map(index => intermediatePoints[index]);
          this.path = [origin, ...orderedWaypoints, destination];

          this.optimizedWaypoints = orderedWaypoints.map(wp => ({
            location: wp,
            stopover: true
          }));

          // Now, re-position the actual markers on the map to reflect the new order
          // (optional, but good for visual consistency)
          this.markers.forEach((marker, index) => {
            // Ensure index is within bounds of this.path
            if (index < this.path.length) {
              marker.setPosition(this.path[index]);
              marker.setLabel(`${index + 1}`); // Update marker labels if desired
            }
          });

          this.isOptimized = true;
        } else {
          // If not optimizing, ensure isOptimized is false
          this.isOptimized = false;
        }

        // Get the full detailed path for animation (all small steps)
        this.path = this.getFullPathFromResponse(response);

        // Draw the polyline with appropriate color
        this.routePolyline = new google.maps.Polyline({
          path: this.path,
          geodesic: true,
          strokeColor: this.isOptimized ? '#00FF00' : '#FF0000', // Green for optimized, Red for original
          strokeOpacity: 1.0,
          strokeWeight: 4
        });
        this.routePolyline.setMap(this.map);

        this.initializeVehicleMarker(); // Initialize or update vehicle marker
      } else {
        console.error('Directions request failed due to ' + status);
        // Clear route if request fails
        this.directionsRenderer.setDirections(null);
        if (this.routePolyline) {
          this.routePolyline.setMap(null);
        }
      }
    });
  }

  private getFullPathFromResponse(response: google.maps.DirectionsResult): google.maps.LatLng[] {
    const path: google.maps.LatLng[] = [];
    const route = response.routes[0];

    for (const leg of route.legs) {
      for (const step of leg.steps) {
        path.push(...step.path);
      }
    }
    return path;
  }


  optimizeRoute(): void {
    if (this.path.length < 3) {
      alert('Necesitas al menos 3 puntos (origen, destino y al menos 1 parada) para optimizar la ruta.');
      return;
    }
    this.updateRoute(true); // Force optimization
  }


  private initializeVehicleMarker(): void {
    if (this.vehicleMarker) {
      this.vehicleMarker.setMap(null);
    }

    if (this.path.length > 0) {
      this.vehicleMarker = new google.maps.Marker({
        position: this.path[0],
        map: this.map,
        title: 'Posición actual',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', // Blue icon for the vehicle
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20) // Center the icon
        }
      });
    }
  }

  startRoute(): void {
    if (this.path.length < 2) {
      alert('Por favor coloca al menos dos puntos en el mapa para iniciar la ruta.');
      return;
    }

    if (this.isPlaying) {
      this.stopRoute();
      return;
    }

    this.isPlaying = true;
    this.currentPositionIndex = 0;
    this.initializeVehicleMarker(); // Ensure vehicle marker is initialized before starting
    this.animateMarker();
  }

  private animateMarker(): void {
    this.animationInterval = setInterval(() => {
      if (this.currentPositionIndex < this.path.length - 1) {
        this.currentPositionIndex++;
        const newPosition = this.path[this.currentPositionIndex];
        this.vehicleMarker.setPosition(newPosition);

        // Center the map on the current marker position
        this.map.panTo(newPosition);

        // Rotate the marker based on direction
        if (this.currentPositionIndex > 0) {
          const heading = google.maps.geometry.spherical.computeHeading(
            this.path[this.currentPositionIndex - 1],
            newPosition
          );
          // Set rotation for the icon
          this.vehicleMarker.setIcon({
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
            rotation: heading // Note: Marker rotation might not be directly supported by all Google Maps default icons.
                              // Custom SVG or more advanced icon handling might be needed for precise rotation.
                              // For simple icons, the rotation might not be visually apparent.
          });
        }
      } else {
        this.stopRoute();
      }
    }, 100); // Faster animation speed (ms)
  }

  stopRoute(): void {
    clearInterval(this.animationInterval);
    this.isPlaying = false;
  }

  clearRoute(): void {
    this.stopRoute();

    // Clear all markers from the map and the array
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];

    // Clear waypoints and path
    this.path = [];
    this.originalWaypoints = [];
    this.optimizedWaypoints = [];
    this.isOptimized = false;

    // Remove the vehicle marker
    if (this.vehicleMarker) {
      this.vehicleMarker.setMap(null);
      this.vehicleMarker = null!;
    }

    // Remove the polyline
    if (this.routePolyline) {
      this.routePolyline.setMap(null);
      this.routePolyline = null!;
    }

    // Clear rendered directions
    this.directionsRenderer.setDirections(null);

    // Reset drawing manager mode
    this.resetDrawingManager();
  }

  private resetDrawingManager(): void {
    if (this.drawingManager) {
      this.drawingManager.setDrawingMode(null); // Clear current drawing mode
      this.drawingManager.setMap(null); // Detach from map
      this.drawingManager.setMap(this.map); // Re-attach to map
      this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER); // Set drawing mode back to marker
    }
  }

  saveRoute(): void {
    if (this.markers.length >= 2) {
      const coordinates = this.markers.map(marker => {
        const position = marker.getPosition();
        return position ? [position.lng(), position.lat()] : null;
      }).filter(Boolean) as number[][]; // Filtra nulos y asegura el tipo

      this.routeService.createRoute(coordinates).subscribe({
        next: (savedRoute) => {
          console.log('Ruta guardada:', savedRoute);
          alert('Ruta guardada exitosamente!');
          // Opcional: resetear los marcadores después de guardar
          // this.markers = [];
        },
        error: (err) => {
          console.error('Error guardando ruta:', err);
          alert('Error al guardar la ruta. Por favor intenta nuevamente.');
        }
      });
    } else {
      alert('Necesitas al menos 2 puntos (origen y destino) para guardar la ruta.');
    }
  }

  private loadLastRoute(): void {
    this.routeService.getLastRouteForCurrentUser().subscribe({
      next: (response) => {
        console.log('Last route response:', response); // This log is fine

        if (response && response.coordinates && response.coordinates.length > 0) {
          this.clearRoute(); // Clear any existing markers/route before loading new one

          const latLngs = response.coordinates.map(coord => {
            // Declare 'latLng' (singular) here for the current iteration's LatLng object
            const latLng = new google.maps.LatLng(coord.lng, coord.lat); // <-- Swap the order here!
            console.log('Loading point (inside map):', latLng.lat(), latLng.lng()); // This log is correct
            return latLng;
          });

          // The problematic line was here, remove it:
          // console.log('Loading point:', latLng.lat(), latLng.lng()); // THIS LINE IS WRONG AND NEEDS TO BE REMOVED

          latLngs.forEach((latLng, index) => { // This 'latLng' is also correct for the forEach loop
            const marker = new google.maps.Marker({
              position: latLng,
              map: this.map,
              draggable: true,
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              },
              label: `${index + 1}`
            });

            this.markers.push(marker);
            this.path.push(latLng);

            marker.addListener('dragend', () => {
              this.updatePathFromMarkers();
              this.updateRoute();
            });
          });

          // After adding all markers, update the route to draw the polyline
          if (this.path.length >= 2) {
            this.updateRoute();
            const bounds = new google.maps.LatLngBounds();
            this.path.forEach(point => bounds.extend(point));
            this.map.fitBounds(bounds);
          }
        } else {
          console.log('No previous route found for the current user.');
        }
      },
      error: (err) => {
        console.error('Error loading last route:', err);
        // Handle error, e.g., show a message to the user
      }
    });
  }
}

