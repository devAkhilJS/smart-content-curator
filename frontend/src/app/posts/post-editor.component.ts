import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { PostService } from '../core/services/post';
import { AuthService } from '../core/services/auth';
import { validateScheduleDateTime } from '../utils/simple-validation';

@Component({
  selector: 'app-post-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  templateUrl: './post-editor.component.html',
  styleUrl: './post-editor.component.scss'
})
export class PostEditorComponent implements OnInit {
  postForm: FormGroup;
  isSaving = false;
  postId: string | null = null;
  error: string | null = null;
  warning: string | null = null;
  validationError: string | null = null;
  constructor(
    private fb: FormBuilder,
    private post: PostService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      body: ['', Validators.required],
      status: ['draft', Validators.required],
      scheduledDate: [''],
      scheduledTime: ['']
    });
    this.postForm.get('status')?.valueChanges.subscribe(status => {
      this.validateScheduledDateTime();
      const scheduledDateControl = this.postForm.get('scheduledDate');
      const scheduledTimeControl = this.postForm.get('scheduledTime');
      if (status === 'scheduled') {
        scheduledDateControl?.setValidators([Validators.required]);
        scheduledTimeControl?.setValidators([Validators.required]);
      } else {
        scheduledDateControl?.clearValidators();
        scheduledTimeControl?.clearValidators();
        this.validationError = null;
        this.warning = null;
      }
      scheduledDateControl?.updateValueAndValidity();
      scheduledTimeControl?.updateValueAndValidity();
    });
    this.postForm.get('scheduledDate')?.valueChanges.subscribe(() => {
      this.validateScheduledDateTime();
    });
    
    this.postForm.get('scheduledTime')?.valueChanges.subscribe(() => {
      this.validateScheduledDateTime();
    });
  }
  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.postId = this.route.snapshot.paramMap.get('id');
    if (this.postId) {
      this.post.getPost(this.postId).subscribe({
        next: (postData) => {
          const formValue: any = { ...postData };
          if (formValue.scheduledAt) {
            const date = new Date(formValue.scheduledAt);
            if (!isNaN(date.getTime())) {
              formValue.scheduledDate = date.toISOString().split('T')[0]; 
              formValue.scheduledTime = date.toTimeString().slice(0, 5); 
            }
            delete formValue.scheduledAt; 
          }
          this.postForm.patchValue(formValue);
        },
        error: (error) => {
          console.error('Error loading post:', error);
          this.error = 'Failed to load post data.';
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          }
        }
      });
    }
  }
  onSubmit() {
    this.isSaving = true;
    this.error = null;
    this.warning = null;
    if (this.postForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      this.isSaving = false;
      return;
    }
    const formData = { ...this.postForm.value };
    if (formData.status === 'scheduled') {
      if (!formData.scheduledDate || !formData.scheduledTime) {
        this.error = 'Both scheduled date and time are required when status is "Scheduled"';
        this.isSaving = false;
        return;
      }
      const scheduledDateTime = `${formData.scheduledDate}T${formData.scheduledTime}`;
      const validationError = validateScheduleDateTime(scheduledDateTime);
      if (validationError) {
        this.error = validationError;
        this.isSaving = false;
        return;
      }
      const scheduledDateObj = new Date(scheduledDateTime);
      formData.scheduledAt = scheduledDateObj.toISOString();
      delete formData.scheduledDate;
      delete formData.scheduledTime;
      console.log(`Post will be scheduled for: ${scheduledDateObj.toLocaleString()}`);
    } else {
      delete formData.scheduledDate;
      delete formData.scheduledTime;
    }
    if (formData.status !== 'scheduled') {
      formData.scheduledAt = null;
    } 
    const operation = this.postId 
      ? this.post.updatePost(this.postId, formData)
      : this.post.createPost(formData);
    operation.subscribe({
      next: (response) => {
        this.isSaving = false;
        console.log('Post saved successfully:', response);
        this.error = null;
        this.router.navigate(['/dashboard']).then(() => {
          window.location.reload();
        });
      },
      error: (error) => {
        console.error('Error saving post:', error);
        this.isSaving = false;
        if (error.error && error.error.error) {
          this.error = error.error.error;
        } else {
          this.error = 'Failed to save post. Please try again.';
        }
        
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
      }
    });
  }
  private validateScheduledDateTime(): void {
    const status = this.postForm.get('status')?.value;
    const scheduledDate = this.postForm.get('scheduledDate')?.value;
    const scheduledTime = this.postForm.get('scheduledTime')?.value;
    this.validationError = null;
    this.warning = null;
    if (status === 'scheduled' && scheduledDate && scheduledTime) {
      this.validationError = validateScheduleDateTime(`${scheduledDate}T${scheduledTime}`);
    }
  }
  get scheduledDateError(): string | null {
    const status = this.postForm.get('status')?.value;
    const scheduledDateControl = this.postForm.get('scheduledDate');
    const scheduledTimeControl = this.postForm.get('scheduledTime');
    if (status === 'scheduled') {
      if (scheduledDateControl?.hasError('required') || scheduledTimeControl?.hasError('required')) {
        return 'Both scheduled date and time are required';
      }
      return this.validationError;
    }
    return null;
  }
  get canSubmit(): boolean {
    return this.postForm.valid && 
           !this.isSaving && 
           !this.validationError;
  }
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
