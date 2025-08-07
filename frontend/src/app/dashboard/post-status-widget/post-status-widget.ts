import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { PostService } from '../../core/services/post';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-post-status-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './post-status-widget.html',
  styleUrl: './post-status-widget.scss'
})
export class PostStatusWidget implements OnInit {
  stats: any = {};
  isLoading = true;
  error: string | null = null;

  constructor(
    private post: PostService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('PostStatusWidget ngOnInit - checking authentication...');
    
    if (!this.authService.isAuthenticated()) {
      console.log('Not authenticated, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }

    console.log('Authenticated, loading stats...');
    this.loadStats();
  }

  loadStats() {
    console.log('Loading stats API call...');
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges(); 
    const timeout = setTimeout(() => {
      if (this.isLoading) {
        console.log('Stats API call timed out');
        this.error = 'Request timed out. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }, 10000);
    
    this.post.getPostStats().subscribe({
      next: (stats) => {
        console.log('Stats loaded successfully:', stats);
        clearTimeout(timeout);
        this.stats = stats;
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (error) => {
        console.error('Error loading post stats:', error);
        clearTimeout(timeout);
        this.error = `Failed to load statistics: ${error.message || error.status || 'Unknown error'}`;
        this.isLoading = false;
        this.cdr.detectChanges(); 
        
        if (error.status === 401) {
          console.log('401 error, logging out and redirecting');
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
      }
    });
  }

  retry() {
    console.log('Retrying stats load...');
    this.loadStats();
  }
}