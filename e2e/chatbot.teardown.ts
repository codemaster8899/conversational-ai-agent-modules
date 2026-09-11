import { expect, test } from '@playwright/test'

test('delete test agents', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByRole('link', { name: 'Agenten' }).click()

  await expect(page.getByText('Enterprise Search')).toBeVisible({ timeout: 10000 })

  let chatbots = await page.getByTestId('chatbot-preview').getByText('Skillbyte Mitarbeiter FAQ').all()

  while (chatbots.length > 0) {
    await page.getByTestId('chatbot-preview').getByText('Skillbyte Mitarbeiter FAQ').first().hover({timeout:4000})
    await expect(page.getByTestId('chatbot-edit')).toBeVisible()
    await page.getByTestId('chatbot-edit').click()
    await page.getByRole('main').getByRole('button').nth(3).click()
    await expect(page.getByText('Name des Agenten')).toBeVisible()

    await page.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByText('Wählen Sie einen Agenten aus, um einen neuen Chat zu starten.')).toBeVisible()

    chatbots = await page.getByTestId('chatbot-preview').getByText('Skillbyte Mitarbeiter FAQ').all()
  }

  await expect(page.getByRole('heading', { name: 'Skillbyte Mitarbeiter FAQ' })).toBeHidden()
})
