import { expect, test, type Page } from '@playwright/test';

// Liftosaur's link encoding, decoded in the page: base64 of a data URL of gzip.
async function decodeLink(page: Page, href: string) {
  return page.evaluate(async (url) => {
    const data = new URL(url).searchParams.get('data')!;
    const dataUrl = atob(data);
    const bytes = Uint8Array.from(atob(dataUrl.replace(/^data:[^;]+;base64,/, '')), (c) => c.charCodeAt(0));
    const out = new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')));
    return JSON.parse(await out.text());
  }, href);
}

// A recommended choice reads "Recommended <title>".
async function choose(page: Page, title: string) {
  await page.getByRole('radio', { name: new RegExp(`^(Recommended )?${title}`) }).click();
}
async function pickAndContinue(page: Page, ...titles: string[]) {
  for (const t of titles) await page.getByRole('checkbox', { name: new RegExp(`^${t}`) }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
}

test('answering the quiz narrows the routines and hands the pick to Liftosaur', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: "What's the main goal?" })).toBeVisible();
  await expect(page.getByTestId('featured-tile')).toHaveCount(3);

  await choose(page, 'Build muscle');
  await expect(page.locator('.status')).toContainText('routines are a strong fit');
  await choose(page, 'A while');
  // The days question recommends four days for someone with some experience.
  await expect(page.getByRole('radio', { name: /^Recommended 4/ })).toBeVisible();
  await choose(page, '4');
  await choose(page, '60 min');
  await choose(page, 'Full gym');
  await pickAndContinue(page, 'Arms');
  await pickAndContinue(page, 'Overhead pressing');
  await choose(page, 'Pounds');

  await expect(page).toHaveURL(/goal=muscle&level=some&days=4&minutes=60&setup=gym&focus=arms&avoid=overhead&units=lb/);
  await expect(page.getByRole('heading', { name: 'Your matches' })).toBeVisible();
  await page.getByRole('button', { name: /^See / }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Best match', { exact: true }).first()).toBeVisible();
  const name = (await dialog.locator('#routine-name').textContent())!;
  const days = await dialog.locator('.days summary .day-name').allTextContents();
  expect(days).toHaveLength(4);

  // Overhead pressing was ruled out, so no overhead press anywhere in the week.
  // The first day starts open; opening another shows its exercises.
  await expect(dialog.locator('.days details').first().locator('li').first()).toBeVisible();
  const second = dialog.locator('.days details').nth(1);
  await second.locator('summary').click();
  await expect(second.locator('li').first()).toBeVisible();
  await expect(dialog.locator('.days li', { hasText: /Overhead Press|Shoulder Press|Arnold Press/ })).toHaveCount(0);

  const link = dialog.getByRole('link', { name: 'Open in Liftosaur' });
  await expect(link).toHaveAttribute('href', /^https:\/\/www\.liftosaur\.com\/program\?data=/);
  const payload = await decodeLink(page, (await link.getAttribute('href'))!);
  expect(payload.type).toBe('v2');
  expect(payload.program.name).toBe(`fckn workout: ${name}`);
  expect(payload.program.weeks[0].days.map((d: { name: string }) => d.name)).toEqual(days);
  for (const d of payload.program.weeks[0].days) expect(d.exerciseText).not.toMatch(/Overhead Press/);

  // Pick another match from the list and the link follows it.
  const other = dialog.locator('.matches .match').nth(1);
  const otherName = (await other.locator('.match-name').textContent())!;
  await other.click();
  await expect(dialog.locator('#routine-name')).toHaveText(otherName);
  await expect
    .poll(async () => (await decodeLink(page, (await link.getAttribute('href'))!)).program.name)
    .toBe(`fckn workout: ${otherName}`);

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('a shared link restores the answers, and Back steps through them', async ({ page }) => {
  await page.goto('./#goal=fitness&level=new&days=3&minutes=45&setup=bodyweight&focus=&avoid=jumping&units=kg');
  await expect(page.getByRole('heading', { name: 'Your matches' })).toBeVisible();
  await page.getByRole('button', { name: /^See / }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('#routine-name')).toHaveText('Calisthenics Foundations');
  // Bodyweight only: no barbells, dumbbells or machines, and no jumping.
  await expect(dialog.locator('.days li em', { hasText: /Barbell|Dumbbell|Machine|Cable/ })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Previous question' }).click();
  await expect(page.getByRole('heading', { name: 'Pounds or kilograms?' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Your matches' })).toBeVisible();
});

for (const entry of ['browse', 'tile', 'see', 'compare'] as const) {
  test(`results contain keyboard focus and restore the ${entry} opener`, async ({ page, isMobile }) => {
    await page.goto(entry === 'see' || entry === 'compare'
      ? './#goal=fitness&level=new&days=3&minutes=45&setup=bodyweight&focus=&avoid=&units=kg'
      : './');
    const opener = entry === 'browse' ? page.getByRole('button', { name: 'Browse all' })
      : entry === 'tile' ? page.getByTestId('featured-tile').first()
      : page.getByRole('button', { name: entry === 'see' ? /^See / : /^Compare all / });
    const originalURL = page.url();
    for (const close of isMobile ? ['escape', 'button'] : ['escape', 'button', 'backdrop']) {
      await opener.focus();
      await opener.press('Enter');
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeFocused();
      await expect(page.locator('header.top')).toHaveJSProperty('inert', true);
      await expect(page.locator('main')).toHaveJSProperty('inert', true);
      const first = dialog.getByRole('button', { name: 'Close', exact: true });
      const last = dialog.locator('.match').last();
      await page.keyboard.press('Shift+Tab');
      await expect(last).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(first).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(dialog.locator('summary').first()).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(first).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(last).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(last).toHaveAttribute('aria-current', 'true');
      await expect(last).toBeFocused();
      await page.locator('header .brand').evaluate((el: HTMLElement) => el.focus());
      await expect(last).toBeFocused();
      await page.locator('main button').first().evaluate((el: HTMLElement) => el.focus());
      await expect(last).toBeFocused();
      await expect(page).toHaveURL(originalURL);
      if (close === 'escape') await page.keyboard.press('Escape');
      else if (close === 'button') await first.click();
      else await page.locator('.overlay').click({ position: { x: 1, y: 1 } });
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
      await expect(page.locator('header.top')).toHaveJSProperty('inert', false);
      await expect(page.locator('main')).toHaveJSProperty('inert', false);
    }
  });
}

test('routines that need other days or gear are faded and marked', async ({ page }) => {
  await page.goto('./#goal=strength&days=4&setup=dumbbells');
  await expect(page.locator('.tile-faded').first()).toBeVisible();
  await page.getByRole('button', { name: /Browse all/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.match', { hasText: 'Big Four Strength' })).toContainText('Other days or gear');
  await expect(dialog.locator('.match').first()).toContainText('4 days');
});
