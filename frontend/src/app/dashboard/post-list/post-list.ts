import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Post } from '../../core/services/post';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
  templateUrl: './post-list.html',
  styleUrl: './post-list.scss'
})
export class PostList implements OnInit {
  displayedColumns = ['title', 'status', 'scheduledAt', 'actions'];
  posts: any[] = []; 
  isLoading = false;
  error: string | null = null;

  constructor(
    private post: Post, 
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('PostList ngOnInit - checking authentication...');
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.loadPosts();
  }

  loadPosts(status?: string) {
    console.log('Loading posts...');
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();
    
    this.post.getPosts(status).pipe(
      tap((posts) => {
        console.log('Posts loaded successfully:', posts);
      }),
      catchError((error) => {
        console.error('Error loading posts:', error);
        this.error = 'Failed to load posts. Please try again.';
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
        return of([]);
      }),
      finalize(() => {
        console.log('Posts loading finalized. isLoading set to false');
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (posts) => {
        console.log('Posts subscription next:', posts);
        this.posts = posts;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Posts subscription error:', error);
      }
    });
  }

  viewPost(post: any) {
    console.log('Viewing post:', post);
    this.router.navigate(['/posts/edit', post._id]);
  }
}