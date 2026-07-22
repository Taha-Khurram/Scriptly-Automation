/** Page object for the Sign Up screen (/signup). */
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class SignupPage extends BasePage {
  path = '/signup';

  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.locator('#username');
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator("#signupForm button[type='submit']");
    this.loginLink = page.getByRole('link', { name: 'Login Here' });
  }

  // --- queries ---------------------------------------------------------------

  async isLoaded(): Promise<boolean> {
    return (
      (await this.nameInput.isVisible()) &&
      (await this.emailInput.isVisible()) &&
      (await this.passwordInput.isVisible())
    );
  }

  gmailHint(): Locator {
    return this.page.getByText('Only Gmail addresses').first();
  }

  passwordPolicyHint(): Locator {
    return this.page.getByText('8+ chars, 1 uppercase').first();
  }

  // --- actions ---------------------------------------------------------------

  async fillForm(name: string, email: string, password: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
