/** Page object for the Forgot Password screen (/forgot-password). */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class ForgotPasswordPage extends BasePage {
  path = '/forgot-password';

  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator("input[type='email']").first();
    this.submitButton = page.locator("form button[type='submit']").first();
    this.loginLink = page.getByRole('link', { name: 'Back to Sign In' }).first();
  }

  isLoaded(): Promise<boolean> {
    return this.emailInput.isVisible();
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
