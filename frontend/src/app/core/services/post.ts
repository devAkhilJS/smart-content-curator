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
  getPosts(status?: string): Observable<any[]> {
    let params: any = {};
    if (status) params.status = status;
    return this.http.get<any[]>(this.apiUrl, { params });
  }
  getPostById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  createPost(postData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, postData);
  }
  updatePost(id: string, postData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, postData);
  }
  getPostStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}