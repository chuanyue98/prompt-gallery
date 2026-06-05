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

test('contribute modal filters model suggestions and switches media URL mode', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '打开投稿弹层' }).click();

  const modelInput = page.getByPlaceholder('选择或输入模型');
  await modelInput.fill('p');
  await expect(page.getByRole('option', { name: 'p-image' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'GPT-Image 2' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Sora' })).toBeHidden();

  await modelInput.fill('ig');
  await expect(page.getByRole('option', { name: 'GPT-Image 2' })).toBeHidden();

  await modelInput.fill('mid');
  await expect(page.getByRole('option', { name: 'Seedance 2.0 / Midjourney' })).toBeVisible();
  await page.getByRole('option', { name: 'Seedance 2.0 / Midjourney' }).click();
  await expect(modelInput).toHaveValue('Seedance 2.0 / Midjourney');

  await page.getByRole('button', { name: 'Media URL' }).click();
  await expect(page.getByPlaceholder('https://example.com/your-image.png')).toBeVisible();

  await page.getByPlaceholder('例如：赛博朋克猫咪').fill('E2E Test Work');
  await page.getByPlaceholder('完整咒语...').fill('cinematic scene, clean composition');
  await page.getByPlaceholder('https://example.com/your-image.png').fill('https://example.com/e2e.png');
  await expect(page.getByRole('button', { name: '立即提交 (SUBMIT)' })).toBeEnabled();
});

test('contribute modal previews and clears uploaded files', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: '打开投稿弹层' }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'e2e-upload.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
  });

  await expect(page.getByRole('img', { name: 'Preview' })).toBeVisible();
  await page.getByTitle('清除当前媒体').click();
  await expect(page.getByRole('img', { name: 'Preview' })).toBeHidden();
});

test('detail modal image lightbox opens and closes', async ({ page }) => {
  await page.goto('/');

  await page.getByPlaceholder('搜索标题、模型、标签或提示词...').fill('p-image');
  const imageCard = page.getByRole('button', { name: /打开作品详情:/ }).first();
  await expect(imageCard).toBeVisible();
  await imageCard.click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '放大查看媒体' }).click();
  await expect(page.getByRole('button', { name: '关闭预览' })).toBeVisible();

  await page.getByRole('button', { name: '关闭预览' }).click();
  await expect(page.getByRole('button', { name: '关闭预览' })).toBeHidden();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByRole('button', { name: '关闭详情弹层' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});
