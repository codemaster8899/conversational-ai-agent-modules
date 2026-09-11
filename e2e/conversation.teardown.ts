import { expect, test } from '@playwright/test'

test('delete conversation', async ({ page }) => {
  await page.goto('/app/home')

  await page.locator('div').filter({ hasText: /^Chatkonversation$/ }).locator('div').click();
  await page.locator('li').filter({ hasText: 'Löschen' }).click();
  await page.getByRole('button', { name: 'Löschen' }).click();
  await expect(page.locator('div').filter({ hasText: /^Chatkonversation$/ })).toBeHidden()
})
