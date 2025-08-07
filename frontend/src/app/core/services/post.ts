import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
export interface PostFilterParams {
  status?: string;
  channel?: string;
  search?: string;
  sortBy?: string;
  dateRange?: string;
  page?: number;
  limit?: number;
}
export interface Post {
  id: string;
  title: string;
  body: string; 
  status: 'draft' | 'scheduled' | 'published' | 'pending' | 'rejected';
  scheduledAt?: string | Date;
  publishedAt?: string | Date;
  channel?: string;
  channels?: string[]; 
  tags?: string[];
  author?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  aiGenerated?: boolean;
  approval?: {
    reviewer?: string;
    reviewedAt?: string | Date;
    comment?: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}
export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}
export interface PostFilters extends PostFilterParams {}
export interface PostsResponse extends PostListResponse {}

@Injectable({ providedIn: 'root' })
export class PostService {
  private apiUrl = 'http://localhost:5000/api/posts';
  constructor(private http: HttpClient) {}
  getPosts(params?: PostFilterParams): Observable<PostListResponse> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('_t', Date.now().toString());
    if (params) {
      if (params.status && params.status !== 'all') {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.channel && params.channel !== 'all') {
        httpParams = httpParams.set('channel', params.channel);
      }
      if (params.search) {
        httpParams = httpParams.set('search', params.search);
      }
      if (params.sortBy) {
        let backendSortBy = params.sortBy;
        if (params.sortBy === 'alphabetical') {
          backendSortBy = 'title'; 
        }
        httpParams = httpParams.set('sortBy', backendSortBy);
      }
      if (params.dateRange && params.dateRange !== 'all') {
      }
      if (params.page) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.limit) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
    }
    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(response => this.transformPostListResponse(response)),
      retry(2),
      catchError(this.handleError)
    );
  }
  getPost(id: string): Observable<Post> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.transformPost(response)),
      retry(2),
      catchError(this.handleError)
    );
  }
  deletePost(id: string): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      map(() => void 0), // Transform to void
      retry(1),
      catchError(this.handleError)
    );
  }
  duplicatePost(id: string): Observable<Post> {
    return this.http.post<any>(`${this.apiUrl}/${id}/duplicate`, {}).pipe(
      map(response => this.transformPost(response)),
      retry(1),
      catchError(this.handleError)
    );
  }
  createPost(postData: Partial<Post>): Observable<Post> {
    return this.http.post<any>(this.apiUrl, postData).pipe(
      map(response => this.transformPost(response)),
      catchError(this.handleError)
    );
  }
  updatePost(id: string, postData: Partial<Post>): Observable<Post> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, postData).pipe(
      map(response => this.transformPost(response)),
      catchError(this.handleError)
    );
  }
  getPostStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }
  getDashboardPosts(): Observable<Post[]> {
    return this.http.get<any[]>(`${this.apiUrl}?limit=10`).pipe(
      map(response => Array.isArray(response) ? response.map(post => this.transformPost(post)) : []),
      retry(2),
      catchError(this.handleError)
    );
  }
  getPostById(id: string): Observable<Post> {
    return this.getPost(id);
  }
  private transformPost(backendPost: any): Post {
    return {
      id: backendPost._id || backendPost.id,
      title: backendPost.title,
      body: backendPost.body,
      status: backendPost.status,
      scheduledAt: backendPost.scheduledAt,
      publishedAt: backendPost.publishedAt,
      channel: backendPost.channel,
      channels: backendPost.channel ? [backendPost.channel] : [],
      tags: backendPost.tags || [],
      author: backendPost.author,
      aiGenerated: backendPost.aiGenerated,
      approval: backendPost.approval,
      createdAt: backendPost.createdAt,
      updatedAt: backendPost.updatedAt
    };
  }
  private transformPostListResponse(response: any): PostListResponse {
    if (Array.isArray(response)) {
      return {
        posts: response.map(post => this.transformPost(post)),
        total: response.length,
        page: 1,
        totalPages: 1,
        hasMore: false
      };
    } else if (response.posts) {
      return {
        posts: response.posts.map((post: any) => this.transformPost(post)),
        total: response.total || response.posts.length,
        page: response.page || 1,
        totalPages: response.totalPages || 1,
        hasMore: response.hasMore || false
      };
    } else {
      return {
        posts: [],
        total: 0,
        page: 1,
        totalPages: 1,
        hasMore: false
      };
    }
  }
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage: string;

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'You are not authorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested post was not found.';
          break;
        case 409:
          errorMessage = 'A conflict occurred. The post may have been modified by another user.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        default:
          errorMessage = error.error?.message || `An error occurred: ${error.message}`;
      }
    }

    console.error('PostService Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}
export { PostService as PostServiceLegacy };