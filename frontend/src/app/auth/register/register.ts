import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register  {
  registerForm: FormGroup;
  loading = false;
  error: string | null = null;
  isRegistered = false;
  userEmail = '';
  resendingEmail = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  submit() {
    if (this.registerForm.invalid) return;
    this.loading = true;
    this.error = null;
    
    const { name, email, password } = this.registerForm.value;
    this.auth.register({ name, email, password }).subscribe({
      next: () => {
        this.userEmail = email;
        this.isRegistered = true;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }

  resendVerificationEmail() {
    this.resendingEmail = true;
    this.error = null;
    
    this.auth.resendVerificationEmail(this.userEmail).subscribe({
      next: () => {
        this.resendingEmail = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to resend verification email';
        this.resendingEmail = false;
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
