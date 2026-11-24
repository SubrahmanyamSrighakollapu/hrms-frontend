import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, collectErrors, routePattern } from "./helpers";

/**
 * Interaction-level end-to-end flows. Each test drives a real module the way a
 * user would: open a form, fill it, submit, and assert the result is visible.
 */

const stamp = () => Date.now().toString().slice(-6);

/** Select the first real (non-placeholder) option of a <select>. */
async function selectFirstRealOption(locator: ReturnType<Page["locator"]>) {
  const values = await locator.locator("option").evaluateAll((opts) =>
    opts.map((o) => (o as HTMLOptionElement).value).filter((v) => v !== ""),
  );
  if (values.length === 0) throw new Error("Select has no selectable options");
  await locator.selectOption(values[0]);
}

/** Select a <select> option whose visible text matches a pattern. */
async function selectOptionByText(select: ReturnType<Page["locator"]>, matcher: RegExp) {
  const value = await select.locator("option").evaluateAll(
    (opts, source) => {
      const re = new RegExp(source);
      const match = opts.find((o) => re.test(o.textContent || ""));
      return match ? (match as HTMLOptionElement).value : "";
    },
    matcher.source,
  );
  if (!value) throw new Error(`No option matched ${matcher}`);
  await select.selectOption(value);
}

// ---------------------------------------------------------------------------
// Login page (no stored session)
// ---------------------------------------------------------------------------
test.describe("login", () => {
  test("rejects invalid credentials with an error message", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(ACCOUNTS.employee.email);
    await page.locator('input[type="password"]').fill("definitely-wrong");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login$/);
  });

  test("signs in with valid credentials and lands on the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(ACCOUNTS.employee.email);
    await page.locator('input[type="password"]').fill(ACCOUNTS.employee.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(routePattern("/dashboard"), { timeout: 30_000 });
  });
});

// ---------------------------------------------------------------------------
// Employee flows
// ---------------------------------------------------------------------------
test.describe("employee flows", () => {
  test.use({ storageState: ".auth/employee.json" });

  test("applies for a leave and sees it in the list", async ({ page }) => {
    const problems = collectErrors(page);
    const reason = `E2E leave ${stamp()}`;
    const day = "2030-06-03";

    await page.goto("/time-off/leaves");
    await page.getByRole("button", { name: /^apply$/i }).first().click();

    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText(/apply for leave/i)).toBeVisible();

    await drawer.locator("#to-leave-type").selectOption("UNPAID");
    await drawer.locator("#to-from").fill(day);
    await drawer.locator("#to-to").fill(day);
    await drawer.locator("#to-days").fill("1");
    await drawer.locator("#to-reason").fill(reason);

    await page.getByRole("button", { name: /submit request/i }).click();

    await expect(page.getByText(/leave request submitted/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(reason).first()).toBeVisible({ timeout: 15_000 });

    expect(problems, `Console/page errors:\n${problems.join("\n")}`).toEqual([]);
  });

  test("validation blocks an empty leave request", async ({ page }) => {
    await page.goto("/time-off/leaves");
    await page.getByRole("button", { name: /^apply$/i }).first().click();
    await page.getByRole("button", { name: /submit request/i }).click();
    await expect(page.getByText(/please provide a reason/i)).toBeVisible();
  });

  test("creates and submits an expense claim", async ({ page }) => {
    const title = `E2E claim ${stamp()}`;
    await page.goto("/expenses");
    await page.getByRole("button", { name: /new claim/i }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/new expense claim/i)).toBeVisible();

    await dialog.locator("#exp-title").fill(title);
    const line = dialog.locator("text=Line 1").locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    await selectFirstRealOption(line.getByLabel("Category"));
    await line.getByLabel("Amount").fill("250");

    await dialog.getByRole("button", { name: /save & submit/i }).click();

    await expect(dialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("tr", { hasText: title }).getByText(/submitted/i).first()).toBeVisible();
  });

  test("raises an IT support ticket", async ({ page }) => {
    const title = `E2E IT ${stamp()}`;
    await page.goto("/it-support");
    await page.getByRole("button", { name: /new ticket/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.locator("#t-title").fill(title);
    await selectFirstRealOption(dialog.locator("#t-category"));
    await dialog.locator("#t-desc").fill("Automated end-to-end check.");
    await dialog.getByRole("button", { name: /^create$/i }).click();

    await expect(dialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 15_000 });
  });

  test("raises an HR helpdesk ticket", async ({ page }) => {
    const title = `E2E HR ${stamp()}`;
    await page.goto("/hr-helpdesk");
    await page.getByRole("button", { name: /new ticket/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.locator("#t-title").fill(title);
    await selectFirstRealOption(dialog.locator("#t-category"));
    await dialog.locator("#t-desc").fill("Automated end-to-end check.");
    await dialog.getByRole("button", { name: /^create$/i }).click();

    await expect(dialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 15_000 });
  });

  test("books a desk and cancels the booking", async ({ page }) => {
    await page.goto("/desk-management");

    // Use a far-future date so the desk is guaranteed free.
    await page.locator('input[type="date"]').first().fill("2031-03-04");

    const bookBtn = page.getByRole("button", { name: /^book$/i }).first();
    await expect(bookBtn).toBeVisible({ timeout: 15_000 });
    await bookBtn.click();

    await page.getByRole("button", { name: /my bookings/i }).click();
    await expect(page.getByRole("button", { name: /^cancel$/i }).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /^cancel$/i }).first().click();
    const confirm = page.getByRole("dialog");
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.getByRole("button", { name: /cancel|confirm|yes/i }).last().click();
    }
  });

  test("starts a chat and sends a message", async ({ page }) => {
    await page.goto("/chat");

    await page.locator('button[title="New conversation"]').click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/new conversation/i)).toBeVisible();

    const firstPerson = dialog.locator(".max-h-64 button").first();
    await expect(firstPerson).toBeVisible({ timeout: 15_000 });
    await firstPerson.click();
    await dialog.getByRole("button", { name: /start chat/i }).click();

    await expect(dialog).toBeHidden({ timeout: 20_000 });

    const message = `E2E ping ${stamp()}`;
    const composer = page.getByPlaceholder(/type a message/i);
    await expect(composer).toBeVisible({ timeout: 15_000 });
    await composer.fill(message);
    await page.locator('button[title="Send"]').click();
    await expect(page.getByText(message).first()).toBeVisible({ timeout: 15_000 });
  });

  test("edits core profile information in My Info", async ({ page }) => {
    await page.goto("/my-info");
    await page.getByRole("button", { name: /^edit$/i }).first().click();

    const phone = page.getByPlaceholder("+91 98765 43210");
    await expect(phone).toBeVisible({ timeout: 15_000 });
    await phone.fill("+91 90000 12345");
    await page.getByRole("button", { name: /^save$/i }).first().click();

    await expect(page.getByText(/core information updated/i)).toBeVisible({ timeout: 15_000 });
  });

  test("applies for a permission request", async ({ page }) => {
    const reason = `E2E permission ${stamp()}`;
    await page.goto("/time-off/permissions");
    await page.getByRole("button", { name: /^apply$/i }).first().click();

    const drawer = page.getByRole("dialog");
    await drawer.locator("#to-perm-date").fill("2030-09-04");
    await drawer.locator("#to-perm-from").fill("10:00");
    await drawer.locator("#to-perm-to").fill("11:00");
    await drawer.locator("#to-reason").fill(reason);
    await page.getByRole("button", { name: /submit request/i }).click();

    await expect(page.getByText(/permission request submitted/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(reason).first()).toBeVisible({ timeout: 15_000 });
  });

  test("applies for a regularization request", async ({ page }) => {
    const reason = `E2E regularization ${stamp()}`;
    await page.goto("/time-off/regularization");
    await page.getByRole("button", { name: /^apply$/i }).first().click();

    const drawer = page.getByRole("dialog");
    await drawer.locator("#to-reg-date").fill("2030-09-05");
    await drawer.locator("#to-reg-in").fill("09:15");
    await drawer.locator("#to-reg-out").fill("18:30");
    await drawer.locator("#to-reason").fill(reason);
    await page.getByRole("button", { name: /submit request/i }).click();

    await expect(page.getByText(/regularization request submitted/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(reason).first()).toBeVisible({ timeout: 15_000 });
  });

  test("applies for extra hours", async ({ page }) => {
    const reason = `E2E extra hours ${stamp()}`;
    await page.goto("/time-off/extra-hours");
    await page.getByRole("button", { name: /^apply$/i }).first().click();

    const drawer = page.getByRole("dialog");
    await drawer.locator("#to-eh-date").fill("2030-09-06");
    await drawer.locator("#to-eh-from").fill("18:00");
    await drawer.locator("#to-eh-to").fill("20:00");
    await drawer.locator("#to-reason").fill(reason);
    await page.getByRole("button", { name: /submit request/i }).click();

    await expect(page.getByText(/extra hours request submitted/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(reason).first()).toBeVisible({ timeout: 15_000 });
  });

  test("RSVPs to a company event", async ({ page, request }) => {
    // Seed a future event (HR has events:MANAGE) so the RSVP buttons render.
    const login = await request.post("http://localhost:5000/api/v1/auth/login", {
      data: { email: ACCOUNTS.hr.email, password: ACCOUNTS.hr.password },
    });
    expect(login.ok()).toBeTruthy();
    const token = (await login.json()).data.tokens.accessToken as string;
    const title = `E2E Event ${stamp()}`;
    const created = await request.post("http://localhost:5000/api/v1/events", {
      headers: { Authorization: `Bearer ${token}` },
      data: { title, date: "2031-06-01T10:00:00.000Z", location: "Online", category: "Social" },
    });
    expect(created.ok()).toBeTruthy();

    await page.goto("/events");
    const card = page.locator("div.card").filter({ hasText: title }).first();
    await expect(card).toBeVisible({ timeout: 20_000 });
    await card.getByRole("button", { name: /^going$/i }).click();

    await expect(page.getByText(/rsvp updated/i)).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// HR flows
// ---------------------------------------------------------------------------
test.describe("hr flows", () => {
  test.use({ storageState: ".auth/hr.json" });

  test("approves a pending time-off request", async ({ page, request }) => {
    // Seed a guaranteed pending request as the employee (deterministic inbox).
    const login = await request.post("http://localhost:5000/api/v1/auth/login", {
      data: { email: ACCOUNTS.employee.email, password: ACCOUNTS.employee.password },
    });
    expect(login.ok()).toBeTruthy();
    const token = (await login.json()).data.tokens.accessToken as string;
    const reason = `E2E approval ${stamp()}`;
    const created = await request.post("http://localhost:5000/api/v1/timeoff", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: "LEAVE",
        reason,
        leaveType: "UNPAID",
        fromDate: "2030-07-01",
        toDate: "2030-07-01",
        days: 1,
      },
    });
    expect(created.ok()).toBeTruthy();

    await page.goto("/time-off/approvals");
    await expect(page.getByText(/approval inbox/i)).toBeVisible({ timeout: 20_000 });

    const row = page.locator("tr", { hasText: reason });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByRole("button", { name: /approve/i }).click();

    await page.getByRole("dialog").getByRole("button", { name: /^approve$/i }).click();
    await expect(page.getByText(/request approved/i)).toBeVisible({ timeout: 15_000 });
  });

  test("searches employees and paginates", async ({ page }) => {
    await page.goto("/employees");
    const search = page.getByPlaceholder(/search by name, email or code/i);
    await expect(search).toBeVisible({ timeout: 20_000 });

    await search.fill("employee@hrms.local");
    await expect(page.getByText(/employee@hrms.local/i).first()).toBeVisible({ timeout: 15_000 });
    await search.fill("");

    const next = page.getByRole("button", { name: /next page/i });
    if ((await next.count()) > 0 && (await next.isEnabled())) {
      await next.click();
      await expect(page.getByText(/showing/i)).toBeVisible();
    }
  });

  test("creates a holiday", async ({ page }) => {
    const name = `E2E Holiday ${stamp()}`;
    await page.goto("/holidays");
    await page.getByRole("button", { name: /add holiday/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.locator("#h-name").fill(name);
    await dialog.locator("#h-date").fill("2031-05-06");
    await dialog.getByRole("button", { name: /^create$/i }).click();

    await expect(page.getByText(/holiday created/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
  });

  test("sees a submitted expense claim in the approvals tab", async ({ page }) => {
    const title = `E2E HR claim ${stamp()}`;
    // Seed a submitted claim via the employee account.
    const login = await page.request.post("http://localhost:5000/api/v1/auth/login", {
      data: { email: ACCOUNTS.employee.email, password: ACCOUNTS.employee.password },
    });
    const token = (await login.json()).data.tokens.accessToken as string;
    const cats = await page.request.get("http://localhost:5000/api/v1/expenses/categories", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const categories = (await cats.json()).data.categories as { id: string }[];
    test.skip(categories.length === 0, "No expense categories seeded");

    const created = await page.request.post("http://localhost:5000/api/v1/expenses", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title,
        currency: "INR",
        submit: true,
        items: [{ categoryId: categories[0].id, expenseDate: "2030-07-02", amount: 199 }],
      },
    });
    expect(created.ok()).toBeTruthy();

    await page.goto("/expenses");
    await page.getByRole("button", { name: /approvals/i }).click();
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 20_000 });
  });

  test("creates and deletes a policy", async ({ page }) => {
    const title = `E2E Policy ${stamp()}`;
    await page.goto("/policies");
    await page.getByRole("button", { name: /new policy/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.locator("#p-title").fill(title);
    await dialog.locator("#p-category").fill("E2E");
    await dialog.locator("#p-file").setInputFiles({
      name: "policy.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Automated end-to-end policy document."),
    });
    await dialog.getByRole("button", { name: /^create$/i }).click();

    await expect(page.getByText(/policy created/i)).toBeVisible({ timeout: 15_000 });
    const row = page.locator("tr", { hasText: title });
    await expect(row).toBeVisible({ timeout: 15_000 });

    await row.getByTitle("Delete").click();
    await page.getByRole("dialog").getByRole("button", { name: /^delete$/i }).click();
    await expect(page.getByText(/policy deleted/i)).toBeVisible({ timeout: 15_000 });
  });

  test("creates and deletes a company event", async ({ page }) => {
    const title = `E2E Event ${stamp()}`;
    await page.goto("/events");
    await page.getByRole("button", { name: /create event/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.locator("#e-title").fill(title);
    await dialog.locator("#e-date").fill("2031-06-01T10:00");
    await dialog.locator("#e-loc").fill("Online");
    await dialog.getByRole("button", { name: /^create$/i }).click();

    await expect(page.getByText(/event created/i)).toBeVisible({ timeout: 15_000 });
    const card = page.locator("div.card").filter({ hasText: title }).first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    await card.getByTitle("Delete").click();
    await page.getByRole("dialog").getByRole("button", { name: /^delete$/i }).click();
    await expect(page.getByText(/event deleted/i)).toBeVisible({ timeout: 15_000 });
  });

  test("exports the report CSV", async ({ page }) => {
    await page.goto("/reports");
    await page.getByRole("button", { name: /export csv/i }).first().click();
    await expect(page.getByText(/report exported as csv/i)).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// Admin flows
// ---------------------------------------------------------------------------
test.describe("admin flows", () => {
  test.use({ storageState: ".auth/admin.json" });

  test("opens the roles module and the permission matrix", async ({ page }) => {
    const problems = collectErrors(page);
    await page.goto("/roles");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("link", { name: /^permissions/i }).click();
    await expect(page).toHaveURL(routePattern("/roles/permissions"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(problems, `Console/page errors:\n${problems.join("\n")}`).toEqual([]);
  });

  test("creates and deletes a department in Organization", async ({ page }) => {
    const s = stamp();
    const name = `E2E Dept ${s}`;
    const code = `D${s}`;

    await page.goto("/organization/departments");
    await page.getByRole("button", { name: /add department/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill(name);
    await dialog.getByLabel("Code").fill(code);
    await dialog.getByRole("button", { name: /create department/i }).click();

    await expect(page.getByText(/department created/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: `Actions for ${name}` }).click();
    await page.getByText("Delete department", { exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^delete$/i }).click();

    await expect(page.getByText(/department deleted/i)).toBeVisible({ timeout: 15_000 });
  });

  test("creates and deletes a location in Organization", async ({ page }) => {
    const name = `E2E Loc ${stamp()}`;
    await page.goto("/organization/locations");
    await page.getByRole("button", { name: /add location/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill(name);
    await dialog.getByRole("button", { name: /create location/i }).click();

    await expect(page.getByText(/location created/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: `Actions for ${name}` }).click();
    await page.getByText("Delete location", { exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^delete$/i }).click();

    await expect(page.getByText(/location deleted/i)).toBeVisible({ timeout: 15_000 });
  });

  test("creates and deletes a sub-location", async ({ page }) => {
    const name = `E2E Sub ${stamp()}`;
    await page.goto("/organization/sub-locations");

    // The header form needs a parent location selected first.
    const filter = page.locator("select").first();
    await expect(filter.locator("option").nth(1)).toBeAttached({ timeout: 20_000 });
    await selectFirstRealOption(filter);

    await page.getByRole("button", { name: /add sub-location/i }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill(name);
    await dialog.getByRole("button", { name: /create sub-location/i }).click();

    await expect(page.getByText(/sub-location created/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: `Actions for ${name}` }).click();
    await page.getByText("Delete", { exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: /^delete$/i }).click();

    await expect(page.getByText(/sub-location deleted/i)).toBeVisible({ timeout: 15_000 });
  });

  test("assigns and unassigns a role in Roles & Permissions", async ({ page }) => {
    await page.goto("/roles/assignee");

    const roleSelect = page.locator("#assignee-role");
    await expect(roleSelect).toBeVisible({ timeout: 20_000 });
    await selectOptionByText(roleSelect, /HR Manager/);

    await selectOptionByText(page.locator("#assignee-pick"), /Demo Employee/);
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText(/demo employee assigned to hr manager/i)).toBeVisible({ timeout: 15_000 });

    // Move the employee back to their original role so the seed stays intact.
    const row = page.locator("tr", { hasText: "Demo Employee" });
    await row.getByRole("button", { name: /remove/i }).click();
    await expect(page.getByText(/moved back to employee/i)).toBeVisible({ timeout: 15_000 });
  });

  test("saves the organization profile in Settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByLabel("Organization name")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /save profile/i }).click();
    await expect(page.getByText(/organization profile saved/i)).toBeVisible({ timeout: 15_000 });
  });
});
