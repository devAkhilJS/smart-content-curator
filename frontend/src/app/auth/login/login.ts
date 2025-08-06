import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
   standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',

  styleUrl: './login.scss'
})
export class Login {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  showPassword = false;
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  submit() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.error = null;
    const { username, password } = this.loginForm.value;
    this.auth.login(username, password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
        console.log('Login successful! Dashboard will be implemented later.');
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Login failed';
        this.loading = false;
      }
    });
  }
  loginWithGoogle() {
    this.loading = true;
    this.error = null;
    this.auth.loginWithGoogle().subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Google login failed';
        this.loading = false;
      }
    });
  }
}
