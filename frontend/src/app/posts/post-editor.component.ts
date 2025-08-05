import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Post } from '../core/services/post';
import { AuthService } from '../core/services/auth';

@Component({
  selector: 'app-post-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, MatCardModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './post-editor.component.html',
  styleUrl: './post-editor.component.scss'
})
export class PostEditorComponent implements OnInit {
  postForm: FormGroup;
  isSaving = false;
  postId: string | null = null;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private post: Post,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      body: ['', Validators.required],
      status: ['draft', Validators.required],
      scheduledAt: ['']
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.postId = this.route.snapshot.paramMap.get('id');
    if (this.postId) {
      this.post.getPostById(this.postId).subscribe({
        next: (postData) => {
          this.postForm.patchValue(postData);
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
    if (this.postForm.invalid) return;
    
    this.isSaving = true;
    this.error = null;
    
    const operation = this.postId 
      ? this.post.updatePost(this.postId, this.postForm.value)
      : this.post.createPost(this.postForm.value);
    
    operation.subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error saving post:', error);
        this.isSaving = false;
        this.error = 'Failed to save post. Please try again.';
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
      }
    });
  }
}
