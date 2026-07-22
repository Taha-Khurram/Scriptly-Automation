/** Page object for the Login screen (/login). */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  path = '/login';

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly forgotLink: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator("input[name='email']");
    this.passwordInput = page.locator("input[name='password']");
    this.submitButton = page.locator("form button[type='submit']");
    this.googleButton = page.locator('#googleSignIn');
    this.forgotLink = page.getByRole('link', { name: 'Forgot Password?' });
    this.signupLink = page.getByRole('link', { name: 'Create an Account' });
  }

  // --- queries ---------------------------------------------------------------

  async isLoaded(): Promise<boolean> {
    return (
      (await this.emailInput.isVisible()) &&
      (await this.passwordInput.isVisible()) &&
      (await this.submitButton.isVisible())
    );
  }

  // --- actions ---------------------------------------------------------------

  /** Fill the credentials and submit (real Firebase JS auth runs client-side). */
  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
