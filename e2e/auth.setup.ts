import { expect, test as setup } from "@playwright/test";
import { submitLogin, type RoleName } from "./helpers";

const ROLES: RoleName[] = ["admin", "hr", "employee"];

// Sign in once per role and persist the session (localStorage tokens) so the
// module specs can start already authenticated.
for (const role of ROLES) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await submitLogin(page, role);
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    await page.context().storageState({ path: `.auth/${role}.json` });
  });
}
