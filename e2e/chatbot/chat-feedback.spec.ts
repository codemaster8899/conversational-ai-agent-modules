import { test, expect } from '@playwright/test'

test('user can give positive feedback for answer', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByTestId('chatbot-preview').first().click()
  await page.getByTestId('chat-input').fill('Wie hoch ist der Eifelturm?')
  await page.getByTestId('chat-input-button').click()

  // long wait for chatbot answer
  await expect(page.locator('#thumbs-up-button')).toBeVisible({ timeout: 20000 })

  await expect(page.locator('#thumbs-up-button').locator('.clicked')).toBeHidden()

  await page.locator('#thumbs-up-button').click({ delay: 1000 })

  await expect(page.locator('#thumbs-up-button').locator('.clicked')).toBeVisible()
})

test('user can give negative feedback for answer', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByTestId('chatbot-preview').first().click()
  await page.getByTestId('chat-input').fill('Wie hoch ist der Eifelturm?')
  await page.getByTestId('chat-input-button').click()

  await expect(page.getByTestId('feedback-negative-button')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('feedback-negative-button').locator('.clicked')).toBeHidden()

  await page.getByTestId('feedback-negative-button').click()
  await expect(page.getByText(' Helfen Sie uns besser zu werden')).toBeVisible()
  await page
    .locator('div')
    .filter({ hasText: /^Ungenau$/ })
    .click()

  await expect(
    page
      .locator('div')
      .filter({ hasText: /^Ungenau$/ })
      .getByRole('img')
      .first()
  ).toHaveCSS('fill', 'rgb(64, 73, 153)')
  await page.getByRole('button', { name: 'Absenden' }).click()
  await expect(page.getByRole('button', { name: 'Absenden' })).toBeHidden()

  await expect(page.getByTestId('feedback-negative-button').locator('.clicked')).toBeVisible()

})
