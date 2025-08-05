import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource } from '@angular/material/table';
import { Post } from '../../core/services/post';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule],
  templateUrl: './post-list.html',
  styleUrl: './post-list.scss'
})
export class PostList implements OnInit {
  displayedColumns = ['title', 'status', 'scheduledAt', 'actions'];
  dataSource = new MatTableDataSource<any>([]);

  constructor(private post: Post) {}

  ngOnInit(): void {
    this.post.getDashboardPosts().subscribe(posts => {
      this.dataSource.data = posts;
    });
  }
}