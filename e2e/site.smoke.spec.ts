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

test('обложка материалов перечисляет курсы', async ({ page }) => {
  await page.goto('/materials?lang=ru');

  await expect(page.getByText('~/materials', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Go', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Redis', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Docker', exact: true })).toBeVisible();
});

test('страница курса открывается по прямой ссылке', async ({ page }) => {
  await page.goto('/materials/golang?lang=ru');

  await expect(page).toHaveTitle(/Go/);
  await expect(page.getByRole('heading', { level: 1, name: 'Go', exact: true })).toBeVisible();
  await expect(page.getByText('разделы/', { exact: true })).toBeVisible();
});

test('прямая ссылка открывает статью и указатель отмечает её', async ({ page }) => {
  await page.goto('/materials/golang/intro/01-what-is-go?lang=ru');

  await expect(page).toHaveTitle(/Что такое Go/);
  await expect(page.getByRole('heading', { level: 1, name: 'Что такое Go' })).toBeVisible();
  await expect(page.getByText('01-what-is-go.md', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toContainText('Go');
  await expect(page.locator('#materials-tree a[aria-current="page"]')).toHaveCount(1);
});

test('список проектов открывается и ведёт в кейс', async ({ page }) => {
  await page.goto('/projects?lang=ru');

  await expect(page).toHaveTitle(/Проекты/);
  await expect(page.getByText('~/projects', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /Мессенджер/ })).toBeVisible();

  const caseLink = page.getByRole('link', { name: /Мессенджер/ });
  await expect(caseLink).toBeVisible();
  await caseLink.click();

  await expect(page).toHaveURL(/\/projects\/aembal-messenger/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Æmbal');
});

test('прямая ссылка открывает кейс проекта', async ({ page }) => {
  await page.goto('/projects/darqima?lang=ru');

  await expect(page).toHaveTitle(/Darqima/);
  await expect(page.getByRole('heading', { level: 1, name: /Darqima/ })).toBeVisible();
  await expect(page.getByText('~/projects/darqima.md')).toBeVisible();
  await expect(page.getByText('screenshots/', { exact: true })).toBeVisible();
  await expect(page.locator('.prose-article')).toContainText('Go');
});

test('неизвестный маршрут показывает страницу 404', async ({ page }) => {
  await page.goto('/unknown-route?lang=ru');

  await expect(page.getByRole('heading', { level: 1, name: 'Страница не найдена' })).toBeVisible();
  await expect(page.getByText('404', { exact: true })).toBeVisible();
  await expect(page.getByText('/unknown-route?lang=ru', { exact: true })).toBeVisible();
});
