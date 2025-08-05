import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { User } from '../../core/services/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  profileForm: FormGroup;

  constructor(private fb: FormBuilder, private user: User) {
    this.profileForm = this.fb.group({
      name: [''],
      email: [{ value: '', disabled: true }],
    });
  }

  ngOnInit(): void {
    this.user.getProfile().subscribe(user => {
      this.profileForm.patchValue(user);
    });
  }

  save() {
    if (this.profileForm.valid) {
      this.user.updateProfile(this.profileForm.getRawValue()).subscribe();
    }
  }
}
