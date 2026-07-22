/**
 * BasePage — shared behaviour for every page object.
 *
 * Wraps a Playwright `Page` and provides intent-level navigation so individual
 * page objects stay small and tests never touch raw URLs. Paths are relative;
 * they resolve against `use.baseURL` from the Playwright config.
 */
import { Page, Response } from '@playwright/test';

export class BasePage {
  /** Path this page lives at, relative to baseURL. Overridden by subclasses. */
  path = '/';

  constructor(public readonly page: Page) {}

  /** Navigate to this page (or an explicit path) and wait for the DOM. */
  async open(pathOverride?: string, query?: Record<string, string>): Promise<Response | null> {
    let target = pathOverride ?? this.path;
    if (query && Object.keys(query).length > 0) {
      target = `${target}?${new URLSearchParams(query).toString()}`;
    }
    return this.page.goto(target, { waitUntil: 'domcontentloaded' });
  }
}
