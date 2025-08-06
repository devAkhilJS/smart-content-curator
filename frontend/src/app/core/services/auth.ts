import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth'; 

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<{ token: string }>;
  login(credentials: { email: string, password: string }): Observable<{ token: string }>;
  login(usernameOrCredentials: string | { email: string, password: string }, password?: string): Observable<{ token: string }> {
    let credentials: { email: string, password: string };
    
    if (typeof usernameOrCredentials === 'string') {
      credentials = { email: usernameOrCredentials, password: password! };
    } else {
      credentials = usernameOrCredentials;
    }
    
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, credentials)
      .pipe(tap(res => localStorage.setItem('token', res.token)));
  }

  loginWithGoogle(): Observable<{ token: string }> {
    return this.handleSocialLogin('google');
  }

  private handleSocialLogin(provider: 'google'): Observable<{ token: string }> {
    return new Observable(observer => {
      const popup = this.openSocialLoginPopup(provider);
      
      if (!popup) {
        observer.error({ error: { message: 'Popup blocked. Please allow popups for social login.' } });
        return;
      }
      let completed = false;
      const messageListener = (event: MessageEvent) => {
        const backendUrl = 'http://localhost:5000';
        if (event.origin !== window.location.origin && event.origin !== backendUrl) {
          return;
        }

        if (completed) return;

        if (event.data.type === 'SOCIAL_LOGIN_SUCCESS') {
          completed = true;
          const { token } = event.data;
          localStorage.setItem('token', token);
          observer.next({ token });
          observer.complete();
          cleanup();
        } else if (event.data.type === 'SOCIAL_LOGIN_ERROR') {
          completed = true;
          observer.error({ error: { message: event.data.error || `${provider} login failed` } });
          cleanup();
        }
      };

      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          observer.error({ error: { message: 'Social login was cancelled or timed out' } });
          cleanup();
        }
      }, 300000);

      const cleanup = () => {
        window.removeEventListener('message', messageListener);
        clearTimeout(timeout);
        try {
          if (popup && !popup.closed) {
            popup.close();
          }
        } catch (e) {
        }
      };

      window.addEventListener('message', messageListener);

      return cleanup;
    });
  }

  private openSocialLoginPopup(provider: string): Window | null {
    const url = `${this.apiUrl}/social-login/${provider}`;
    const windowFeatures = [
      'width=500',
      'height=600',
      'scrollbars=yes',
      'resizable=yes',
      'status=yes',
      'location=yes',
      'toolbar=no',
      'menubar=no',
      'left=' + (window.screen.width / 2 - 250),
      'top=' + (window.screen.height / 2 - 300)
    ].join(',');

    try {
      const popup = window.open(url, `${provider}_login_${Date.now()}`, windowFeatures);
      
      if (popup) {
        popup.focus();
      }
      
      return popup;
    } catch (error) {
      console.error('Failed to open popup:', error);
      return null;
    }
  }
  register(data: any) {
    return this.http.post(`${this.apiUrl}/register`, data);
  }
  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-verification`, { email });
  }
  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
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