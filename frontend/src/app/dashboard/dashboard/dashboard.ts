import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PostStatusWidget } from '../post-status-widget/post-status-widget';
import { PostList } from '../post-list/post-list';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, PostStatusWidget, PostList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, setting dev token...');
      this.authService.setDevToken();
      
      
      setTimeout(() => {
        console.log('Token set, reloading page...');
        window.location.reload();
      }, 500);
    } else {
      console.log('User is authenticated with token:', this.authService.getToken());
    }
  }
}