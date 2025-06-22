import {Component, OnInit} from '@angular/core';
import { UserTableComponent} from './components/user-table/user-table.component';
import { UserFormDialogComponent} from './components/user-form-dialog/user-form-dialog.component';
import {AuthService} from '../services/auth.service';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {CommonModule} from '@angular/common'
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbar} from '@angular/material/toolbar';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    UserTableComponent, // Importa el componente de tabla
    UserFormDialogComponent,
    MatToolbar,
    // Importa el componente de diálogo
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit{
  users: any[] = [];

  constructor(
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
      }
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers(); // Recargar la tabla si se creó un usuario
      }
    });
  }
}
