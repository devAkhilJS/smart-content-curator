import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth'; 

  constructor(private http: HttpClient) {}

  login(credentials: { email: string, password: string }) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, credentials)
      .pipe(tap(res => localStorage.setItem('token', res.token)));
  }

  register(data: any) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  logout() {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}