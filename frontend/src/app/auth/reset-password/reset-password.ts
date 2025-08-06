import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {
  resetForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  token: string | null = null;
  showNewPassword = false;
  showConfirmPassword = false;
  tokenExpired = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  ngOnInit() {
    
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.error = 'Invalid or missing reset token. Please request a new password reset.';
        this.tokenExpired = true;
      }
    });

    setTimeout(() => {
      const passwordInput = document.querySelector('input[formControlName="newPassword"]') as HTMLElement;
      if (passwordInput) {
        passwordInput.focus();
      }
    }, 100);
  }
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }
  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  submit() {
    if (this.resetForm.invalid || !this.token) return;
    this.loading = true;
    this.error = null;
    const { newPassword } = this.resetForm.value;
    this.auth.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to reset password. Please try again.';
        if (this.error && (this.error.includes('expired') || this.error.includes('invalid'))) {
          this.tokenExpired = true;
        }
        this.loading = false;
      }
    });
  }
  goToForgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
