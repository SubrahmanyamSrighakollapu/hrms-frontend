import { expect, type Page } from "@playwright/test";

/** Seeded accounts (see hrms-backend/prisma/seed.ts). */
export const ACCOUNTS = {
  admin: { email: "admin@hrms.local", password: "Admin@123" },
  hr: { email: "hr@hrms.local", password: "Hr@12345" },
  employee: { email: "employee@hrms.local", password: "Employee@123" },
} as const;

export type RoleName = keyof typeof ACCOUNTS;

/** Fill the sign-in form with a seeded account. */
export async function submitLogin(page: Page, role: RoleName) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(ACCOUNTS[role].email);
  await page.locator('input[type="password"]').fill(ACCOUNTS[role].password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

/** Sign in and wait until the dashboard has rendered. */
export async function signIn(page: Page, role: RoleName) {
  await submitLogin(page, role);
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
}

/**
 * Starts recording uncaught exceptions and console errors on the page.
 * Returns a live array of problem strings (empty when the page is healthy).
 */
export function collectErrors(page: Page): string[] {
  const problems: string[] = [];
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    // Dev-server noise that is not an application defect.
    if (/favicon|React DevTools|Download the React|_next\/static.*\.map/i.test(text)) return;
    // Next.js 16 dev-only validation warning about instant-navigation segments.
    if (/instant navigation|instant-unrendered-segment/i.test(text)) return;
    problems.push(`console: ${text}`);
  });
  return problems;
}

/**
 * Build a RegExp that matches a URL whose path ends with `route`.
 * `expect(page).toHaveURL(regex)` tests against the *full* URL (origin included),
 * so the pattern must not be anchored at the start.
 */
export function routePattern(route: string): RegExp {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}/?(?:[?#].*)?$`);
}

/** Current pathname of the page (no origin, no query). */
export function currentPath(page: Page): string {
  return new URL(page.url()).pathname;
}
