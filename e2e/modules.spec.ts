import { expect, test } from "@playwright/test";
import { collectErrors, routePattern } from "./helpers";

/**
 * Every module is opened for every role that may use it.
 *
 * Each check asserts that the page (a) stays on its route, (b) renders the app
 * shell (navbar title + main region), (c) raised no uncaught exception and no
 * console error, and (d) is not showing a fatal error screen.
 */

const EMPLOYEE_ROUTES = [
  "/dashboard",
  "/my-info",
  "/time-off",
  "/time-off/leaves",
  "/time-off/permissions",
  "/time-off/regularization",
  "/time-off/extra-hours",
  "/attendance",
  "/payroll",
  "/holidays",
  "/policies",
  "/desk-management",
  "/calendars",
  "/events",
  "/it-support",
  "/hr-helpdesk",
  "/expenses",
  "/chat",
];

const HR_ROUTES = [
  ...EMPLOYEE_ROUTES,
  "/time-off/approvals",
  "/time-off/flows",
  "/employees",
  "/reports",
  "/organization/departments",
  "/organization/locations",
  "/organization/sub-locations",
  "/organization/hierarchy",
  "/roles",
  "/roles/permissions",
  "/roles/assignee",
];

const ADMIN_ROUTES = [...HR_ROUTES, "/settings"];

/** Routes an employee must never be able to reach (module not granted). */
const EMPLOYEE_DENIED = [
  "/employees",
  "/reports",
  "/organization/departments",
  "/organization/locations",
  "/organization/sub-locations",
  "/organization/hierarchy",
  "/roles",
  "/roles/permissions",
  "/roles/assignee",
  "/settings",
  "/time-off/flows",
];

async function expectHealthyPage(page: import("@playwright/test").Page, route: string, problems: string[]) {
  await page.goto(route);
  await expect(page).toHaveURL(routePattern(route), { timeout: 20_000 });
  await expect(page.locator("h1")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("main")).toBeVisible();
  await expect(page.getByText(/Something went wrong|Application error|Unhandled Runtime Error/i)).toHaveCount(0);
  expect(problems, `Console/page errors on ${route}:\n${problems.join("\n")}`).toEqual([]);
}

test.describe("employee modules", () => {
  test.use({ storageState: ".auth/employee.json" });
  for (const route of EMPLOYEE_ROUTES) {
    test(`opens ${route}`, async ({ page }) => {
      const problems = collectErrors(page);
      await expectHealthyPage(page, route, problems);
    });
  }
});

test.describe("hr modules", () => {
  test.use({ storageState: ".auth/hr.json" });
  for (const route of HR_ROUTES) {
    test(`opens ${route}`, async ({ page }) => {
      const problems = collectErrors(page);
      await expectHealthyPage(page, route, problems);
    });
  }
});

test.describe("admin modules", () => {
  test.use({ storageState: ".auth/admin.json" });
  for (const route of ADMIN_ROUTES) {
    test(`opens ${route}`, async ({ page }) => {
      const problems = collectErrors(page);
      await expectHealthyPage(page, route, problems);
    });
  }
});

test.describe("employee is redirected away from ungranted modules", () => {
  test.use({ storageState: ".auth/employee.json" });
  for (const route of EMPLOYEE_DENIED) {
    test(`blocks ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    });
  }
});
