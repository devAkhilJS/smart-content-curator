import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { catchError, finalize, tap, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PostService, PostFilters, PostsResponse, Post } from '../../core/services/post';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    MatCardModule, 
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule, 
    MatMenuModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './post-list.html',
  styleUrl: './post-list.scss'
})
export class PostList implements OnInit, OnDestroy {
  posts: Post[] = []; 
  isLoading = false;
  isLoadingMore = false;
  error: string | null = null;
  hasMore = false;
  currentPage = 1;
  
  filters: PostFilters = {
    status: 'all',
    channel: 'all',
    search: '',
    sortBy: 'newest',
    dateRange: 'all',
    page: 1,
    limit: 12
  };
  statusTabs = [
    { label: 'All Posts', value: 'all', count: 0 },
    { label: 'Drafts', value: 'draft', count: 0 },
    { label: 'Scheduled', value: 'scheduled', count: 0 },
    { label: 'Published', value: 'published', count: 0 }
  ];
  channelOptions = [
    { label: 'All Channels', value: 'all' },
    { label: 'Telegram', value: 'telegram' },
    { label: 'Slack', value: 'slack' },
    { label: 'RSS', value: 'rss' }
  ];
  dateRangeOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'Last 7 days', value: '7days' },
    { label: 'Last 30 days', value: '30days' },
    { label: 'Last 90 days', value: '90days' }
  ];
  sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Alphabetical', value: 'title' }, 
    { label: 'Scheduled Date', value: 'scheduledAt' },
    { label: 'Published Date', value: 'publishedAt' }
  ];

  private destroy$ = new Subject<void>();
  private searchSubject = new BehaviorSubject<string>('');

  constructor(
    private post: PostService, 
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
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filters.search = searchTerm;
      this.onFilterChange();
    });
    this.loadPosts();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPosts(append: boolean = false) {
    console.log('Loading posts with filters:', this.filters);

    if (append) {
      this.isLoadingMore = true;
    } else {
      this.isLoading = true;
      this.posts = [];
      this.currentPage = 1;
      this.filters.page = 1;
    }
    this.error = null;
    this.cdr.detectChanges();
    this.post.getPosts(this.filters).pipe(
      tap((response: PostsResponse) => {
        console.log('Posts loaded successfully:', response);
      }),
      catchError((error) => {
        console.error('Error loading posts:', error);
        this.error = 'Failed to load posts. Please try again.';
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
        return of({ posts: [], total: 0, page: 1, totalPages: 1, hasMore: false } as PostsResponse);
      }),
      finalize(() => {
        this.isLoading = false;
        this.isLoadingMore = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response: PostsResponse) => {
        if (append) {
          this.posts = [...this.posts, ...response.posts];
        } else {
          this.posts = response.posts;
        }
        this.hasMore = response.hasMore;
        this.currentPage = response.page;
        this.updateTabCounts();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Posts subscription error:', error);
      }
    });
  }
  onFilterChange() {
    this.filters.page = 1;
    this.loadPosts(false);
  }
  onSearchChange(searchTerm: string) {
    this.searchSubject.next(searchTerm);
  }
  onTabChange(selectedIndex: number) {
    const selectedTab = this.statusTabs[selectedIndex];
    this.filters.status = selectedTab.value;
    this.onFilterChange();
  }
  onLoadMore() {
    if (this.hasMore && !this.isLoadingMore) {
      this.filters.page = this.currentPage + 1;
      this.loadPosts(true);
    }
  }
  onPostAction(action: string, postId: string) {
    console.log(`Action: ${action} on post: ${postId}`);
    if (!postId) {
      console.error('PostId is undefined or null');
      this.error = 'Invalid post ID. Please refresh the page and try again.';
      return;
    }
    switch (action) {
      case 'edit':
        this.router.navigate(['/posts/edit', postId]);
        break;
      case 'view':
        this.router.navigate(['/posts/view', postId]);
        break;
      case 'delete':
        this.deletePost(postId);
        break;
      case 'duplicate':
        this.duplicatePost(postId);
        break;
    }
  }
  private deletePost(postId: string) {
    if (confirm('Are you sure you want to delete this post?')) {
      this.isLoading = true;
      this.error = null;
      this.post.deletePost(postId).pipe(
        catchError(error => {
          console.error('Error deleting post:', error);
          this.error = 'Failed to delete post. Please try again.';
          this.isLoading = false;
          this.cdr.detectChanges(); 
          return of(null);
        })
      ).subscribe(response => {
        console.log('Delete response:', response);
        this.loadPosts(false);
        this.cdr.detectChanges(); 
        if (response !== null) {
          console.log('Post deleted successfully');
        }
      });
    }
  }
  private duplicatePost(postId: string) {
    this.isLoading = true;
    this.error = null;
    this.post.duplicatePost(postId).pipe(
      catchError(error => {
        console.error('Error duplicating post:', error);
        this.error = 'Failed to duplicate post. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges(); 
        return of(null);
      })
    ).subscribe(response => {
      console.log('Duplicate response:', response);
      this.loadPosts(false); 
      this.cdr.detectChanges(); 
      if (response) {
        console.log('Post duplicated successfully');
      }
    });
  }
  private updateTabCounts() {
    this.statusTabs.forEach(tab => {
      tab.count = tab.value === 'all' ? 
        this.posts.length : 
        this.posts.filter(post => post.status === tab.value).length;
    });
  }
  @HostListener('window:scroll', [])
  onScroll() {
    const threshold = 100;
    const position = window.pageYOffset + window.innerHeight;
    const height = document.body.scrollHeight;
    
    if (position > height - threshold && this.hasMore && !this.isLoadingMore) {
      this.onLoadMore();
    }
  }
  getStatusClass(status: string): string {
    return `status-${status}`;
  }
  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
  getChannelIcon(channel: string | undefined): string {
    if (!channel) return 'public';
    const icons: { [key: string]: string } = {
      'telegram': 'send',
      'slack': 'chat',
      'rss': 'rss_feed',
      'default': 'public'
    };
    return icons[channel] || icons['default'];
  }
}