import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Processing login...</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      flex-direction: column;
    }
    
    .loading-spinner {
      text-align: center;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #2d69e0;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    p {
      color: #666;
      font-size: 16px;
    }
  `]
})
export class AuthCallback implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const error = params['error'];

      if (token) {
        localStorage.setItem('token', token);
        if (window.opener) {
          window.opener.postMessage({
            type: 'SOCIAL_LOGIN_SUCCESS',
            token: token
          }, window.location.origin);
          window.close();
        } else {
          this.router.navigate(['/dashboard']);
        }
      } else if (error) {
        const errorMessage = this.getErrorMessage(error);
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'SOCIAL_LOGIN_ERROR',
            error: errorMessage
          }, window.location.origin);
          window.close();
        } else {
          this.router.navigate(['/auth/login'], { 
            queryParams: { error: errorMessage } 
          });
        }
      } else {
        this.router.navigate(['/auth/login']);
      }
    });
  }
  private getErrorMessage(error: string): string {
    switch (error) {
      case 'access_denied':
        return 'Access denied. Please try again.';
      case 'oauth_error':
        return 'OAuth authentication failed. Please try again.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }
}
