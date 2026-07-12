import { expect, test } from '@playwright/test';

test('главная страница показывает настоящий аватар', async ({ page, request }) => {
  const avatarResponse = await request.get('/images/avatar.jpg');
  expect(avatarResponse.status()).toBe(200);
  expect(avatarResponse.headers()['content-type']).toContain('image/jpeg');

  await page.goto('/?lang=ru');

  await expect(page).toHaveTitle(/Эдуард Гагитэ/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Гагитэ');

  const avatar = page.locator('img[src="/images/avatar.jpg"]');
  await expect(avatar).toBeVisible();
  await expect(avatar).toHaveAttribute('alt', /Гагитэ/);
  await expect
    .poll(() => avatar.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0))
    .toBe(true);
});

test('посадочная материалов показывает актуальные курсы', async ({ page }) => {
  await page.goto('/materials?lang=ru');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Изучайте backend по рабочим конспектам');
  await expect(page.getByRole('heading', { name: 'Go', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Redis', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Docker', exact: true })).toBeVisible();
  await expect(page.getByText('167', { exact: true })).toBeVisible();
});

test('прямая ссылка открывает статью и её содержание', async ({ page }) => {
  await page.goto('/materials/golang/intro/01-what-is-go?lang=ru');

  await expect(page).toHaveTitle(/Что такое Go/);
  await expect(page.getByRole('heading', { level: 1, name: 'Что такое Go' })).toBeVisible();
  await expect(page.getByText('Содержание', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toContainText('Go');
});

test('неизвестный маршрут показывает страницу 404', async ({ page }) => {
  await page.goto('/unknown-route?lang=ru');

  await expect(page.getByRole('heading', { level: 1, name: 'Страница не найдена' })).toBeVisible();
  await expect(page.getByText('404', { exact: true })).toBeVisible();
  await expect(page.getByText('/unknown-route?lang=ru', { exact: true })).toBeVisible();
});
