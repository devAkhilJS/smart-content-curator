import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Post {
  private apiUrl = 'http://localhost:5000/api/posts';

  constructor(private http: HttpClient) {}

  getDashboardPosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?limit=10`);
  }

  getPostStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}