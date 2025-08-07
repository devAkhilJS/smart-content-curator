import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Post } from '../../core/services/post';

export interface PostData {
  id: string;
  title: string;
  body: string;
  status: 'draft' | 'scheduled' | 'published' | 'pending' | 'rejected';
  scheduledAt?: Date | string;
  publishedAt?: Date | string;
  channel?: string;
  channels?: string[];
  createdAt: Date | string;
  tags?: string[];
  author?: any;
}
@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss'
})
export class PostCardComponent {
  @Input() post!: PostData | Post;
  @Output() actionClicked = new EventEmitter<{action: string, postId: string}>();
  get statusStyle() {
    const statusColors = {
      draft: { backgroundColor: '#6c757d', color: 'white' },
      scheduled: { backgroundColor: '#007bff', color: 'white' },
      published: { backgroundColor: '#28a745', color: 'white' },
      pending: { backgroundColor: '#ffc107', color: 'black' },
      rejected: { backgroundColor: '#dc3545', color: 'white' }
    };
    return statusColors[this.post.status] || statusColors.draft;
  }
  get displayDate(): string {
    if (this.post.status === 'published' && this.post.publishedAt) {
      return `Published: ${this.formatDate(this.post.publishedAt)}`;
    } else if (this.post.status === 'scheduled' && this.post.scheduledAt) {
      return `Scheduled: ${this.formatDate(this.post.scheduledAt)}`;
    } else {
      return `Created: ${this.formatDate(this.post.createdAt)}`;
    }
  }
  get channelIcons(): { name: string, icon: string }[] {
    const channels = this.post.channels || (this.post.channel ? [this.post.channel] : []);
    return channels.map(channel => {
      switch (channel.toLowerCase()) {
        case 'telegram':
          return { name: 'Telegram', icon: 'telegram' };
        case 'slack':
          return { name: 'Slack', icon: 'work' };
        case 'rss':
          return { name: 'RSS', icon: 'rss_feed' };
        case 'twitter':
          return { name: 'Twitter', icon: 'alternate_email' };
        case 'linkedin':
          return { name: 'LinkedIn', icon: 'business' };
        default:
          return { name: channel, icon: 'share' };
      }
    });
  }
  truncateContent(content: string, maxLength: number = 150): string {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  }
  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  onView(): void {
    this.actionClicked.emit({ action: 'view', postId: this.post.id });
  }

  onEdit(): void {
    this.actionClicked.emit({ action: 'edit', postId: this.post.id });
  }

  onDelete(): void {
    this.actionClicked.emit({ action: 'delete', postId: this.post.id });
  }

  onDuplicate(): void {
    this.actionClicked.emit({ action: 'duplicate', postId: this.post.id });
  }
}
