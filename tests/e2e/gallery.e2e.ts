import { expect, test } from '@playwright/test';

test('gallery search and detail modal work', async ({ page }) => {
  await page.goto('/');

  const firstCard = page.getByRole('button', { name: /打开作品详情:/ }).first();
  await expect(firstCard).toBeVisible();

  await page.getByPlaceholder('搜索标题、模型、标签或提示词...').fill('definitely-no-match');
  await expect(page.getByText('没有匹配当前筛选条件的内容。')).toBeVisible();

  await page.getByPlaceholder('搜索标题、模型、标签或提示词...').fill('');
  await expect(firstCard).toBeVisible();

  await firstCard.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: '复制详情提示词' })).toBeVisible();
});

test('contribute modal reports validation inline', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '打开投稿弹层' }).click();
  await page.locator('form').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

  await expect(page.getByText('请填写作品标题。')).toBeVisible();
});
