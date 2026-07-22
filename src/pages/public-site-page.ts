/** Page object for the public blog site (/site/<slug> and sub-pages). */
import { Page, Locator, Response } from '@playwright/test';
import { BasePage } from './base-page';
import { config } from '../config/env';

export class PublicSitePage extends BasePage {
  readonly slug: string;

  constructor(page: Page, slug?: string) {
    super(page);
    this.slug = slug ?? config.siteSlug;
    this.path = `/site/${this.slug}`;
  }

  /** Open a sub-page such as '/blog', '/about', '/contact' (or '' for home). */
  openPage(subpath = ''): Promise<Response | null> {
    return this.open(`/site/${this.slug}${subpath}`);
  }

  /** The real contact form (the page also carries hidden subscribe/newsletter forms). */
  contactForm(): Locator {
    return this.page.locator("#contact-form, form[action*='/contact']").first();
  }

  contactEmailInput(): Locator {
    return this.contactForm().locator("input[name='email'], #email").first();
  }
}
