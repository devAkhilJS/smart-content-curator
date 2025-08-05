import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Post } from '../../core/services/post';

@Component({
  selector: 'app-post-status-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './post-status-widget.html',
  styleUrl: './post-status-widget.scss'
})
export class PostStatusWidget implements OnInit {
  stats: any = {};

  constructor(private post: Post) {}

  ngOnInit(): void {
    this.post.getPostStats().subscribe(stats => {
      this.stats = stats;
    });
  }
}
