import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  forgotForm: FormGroup;
  loading = false;
  message: string | null = null;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    if (this.forgotForm.invalid) return;
    this.loading = true;
    this.error = null;
    this.message = null;
    this.auth.forgotPassword(this.forgotForm.value.email).subscribe({
      next: () => {
        this.message = 'Reset link sent (if account exists)';
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Error sending reset email';
        this.loading = false;
      }
    });
  }
}
