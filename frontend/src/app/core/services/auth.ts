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

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  setDevToken() {
    const devToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODkxMTExNjRmNDFhMWJiNmE5YzhmZTEiLCJyb2xlIjoidXNlciIsImlhdCI6MTc1NDM5Nzg4NiwiZXhwIjoxNzU1MDAyNjg2fQ.zIsz20Sdq18H6kuL342WcG8mKvSiukW95Ji3-htkosg';
    localStorage.setItem('token', devToken);
    console.log('Development token set successfully');
  }
}