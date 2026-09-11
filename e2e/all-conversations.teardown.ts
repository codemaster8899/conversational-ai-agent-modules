import { expect, test } from '@playwright/test'

test('delete all conversations', async ({ page }) => {
  await page.goto('/app/home')
  await expect(page.getByText('Sprechen Sie mit mir über alles, was Sie interessiert')).toBeVisible()

  let conversationItems = await page.locator('.conversation-item').all()
  // using while because foreach loop had problems after first file was removed
  while (conversationItems.length > 0) {
    await page.locator('.conversation-item').locator('.icon-wrapper > svg').first().click()

    await page.getByText('Löschen').click()
    await expect(page.getByRole('heading', { name: 'Chat löschen' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Löschen' })).toBeVisible()
    await page.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByRole('button', { name: 'Löschen' })).toBeHidden()

    conversationItems = await page.locator('.conversation-item').all()
  }
  expect(conversationItems.length).toBe(0)
})
