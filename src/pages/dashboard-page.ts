/**
 * Page objects for the authenticated dashboard and its feature pages.
 *
 * `DashboardPage` models the shell plus a route map covering every core screen,
 * so authenticated tests can visit any feature page by name without hardcoding
 * paths in the test body.
 */
import { Response } from '@playwright/test';
import { BasePage } from './base-page';

/** name -> path for every authenticated feature screen. */
export const FEATURE_PAGES = {
  dashboard: '/dashboard',
  create: '/create',
  drafts: '/drafts',
  approval: '/approval',
  all_blogs: '/all-blogs',
  categories: '/categories',
  comments: '/comments',
  seo_tools: '/seo-tools',
  formatting_tools: '/formatting-tools',
  optimization: '/optimization',
  analytics: '/analytics',
  schedule: '/schedule',
  leads: '/leads',
  gallery: '/gallery',
  newsletter: '/newsletter',
  activity_log: '/activity-log',
  site_settings: '/site-settings',
  app_settings: '/app-settings',
  profile: '/profile',
  manage_users: '/manage-users', // admin only
} as const;

export type FeaturePageName = keyof typeof FEATURE_PAGES;

export class DashboardPage extends BasePage {
  path = '/dashboard';

  isLoaded(): boolean {
    return this.page.url().includes('/dashboard');
  }

  /** Navigate to a named feature page and return the response. */
  go(name: FeaturePageName): Promise<Response | null> {
    return this.open(FEATURE_PAGES[name]);
  }
}
