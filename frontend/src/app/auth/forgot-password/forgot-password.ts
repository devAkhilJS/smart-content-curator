import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword implements OnInit {
  forgotForm: FormGroup;
  loading = false;
  message: string | null = null;
  error: string | null = null;
  emailSent = false;
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }
  ngOnInit() {
    setTimeout(() => {
      const emailInput = document.querySelector('input[formControlName="email"]') as HTMLElement;
      if (emailInput) {
        emailInput.focus();
      }
    }, 100);
  }
  submit() {
    if (this.forgotForm.invalid) return;
    this.loading = true;
    this.error = null;
    this.message = null;
    const email = this.forgotForm.value.email;
    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.emailSent = true;
        this.message = 'If an account with this email exists, you will receive a password reset link shortly.';
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Error sending reset email. Please try again.';
        this.loading = false;
      }
    });
  }
  resendResetEmail() {
    if (this.forgotForm.valid) {
      this.submit();
    }
  }
  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}