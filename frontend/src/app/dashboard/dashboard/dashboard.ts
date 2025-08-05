
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostStatusWidget } from '../post-status-widget/post-status-widget';
import { PostList } from '../post-list/post-list';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PostStatusWidget, PostList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  constructor() {}
  ngOnInit(): void {}
}