/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User roles in our News Publishing system
export type UserRole = 
  | 'Super Admin' 
  | 'Admin' 
  | 'Editor' 
  | 'Journalist' 
  | 'Moderator' 
  | 'Subscriber';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  bookmarks: string[]; // List of article slug/IDs
  readingHistory: { articleId: string; readAt: string }[];
  bio?: string;
  joinDate: string;
}

export type ArticleStatus = 'Draft' | 'Published' | 'Scheduled';

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string; // Dynamic rich content / Markdown strings
  summary: string; // Brief visual card deck / TL;DR
  featuredImage: string; // URL
  videoUrl?: string; // Opt video feed
  category: string; // ID / Slug of category
  authorId: string;
  authorName: string;
  authorAvatar: string;
  status: ArticleStatus;
  isBreaking: boolean;
  isFeatured: boolean;
  publishDate: string; // ISO String 
  scheduledDate?: string; // Opt ISO string
  readingTime: number; // in minutes
  tags: string[];
  views: number;
  likes: number;
  shares: number;
  commentCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string; // Tailwind accent color class, e.g. "emerald-600"
}

export type CommentStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Comment {
  id: string;
  articleId: string;
  articleTitle: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  content: string;
  date: string;
  status: CommentStatus;
  reportCount: number;
}

export type AdType = 'Banner' | 'Sidebar' | 'In-feed' | 'Sponsored';

export interface AdBanner {
  id: string;
  name: string;
  type: AdType;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  views: number;
  clicks: number;
  placement: 'top-header' | 'sidebar' | 'in-feed' | 'sticky-bottom';
  scheduleStart?: string;
  scheduleEnd?: string;
}

export interface Newsletter {
  email: string;
  subscribedAt: string;
}

export interface LiveFeedUpdate {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  articleId?: string; // Reference to main breaking story
}

export interface DashboardStats {
  totalUsers: number;
  totalArticles: number;
  totalPendingComments: number;
  categoryPerformance: { category: string; count: number; views: number }[];
  visitorViewsOverTime: { date: string; views: number; likes: number }[];
  adPerformance: { name: string; views: number; clicks: number }[];
  breakingCount: number;
}
