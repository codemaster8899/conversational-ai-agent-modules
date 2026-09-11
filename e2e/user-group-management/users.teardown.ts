import { expect, test } from '@playwright/test'

test('delete test users', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByRole('link', { name: 'Einstellungen' }).click()
  await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()
  await page.getByRole('button', { name: 'Benutzer' }).click()
  
  await expect(page.getByText('Nutzername')).toBeVisible()

  let testUserRows = await page.getByRole('row', { name: process.env.USER_ACCOUNT_USERNAME }).all()

  while (testUserRows.length > 0) {

    await testUserRows[0].getByRole('button').nth(1).click()
    await expect(page.getByText('wirklich löschen?')).toBeVisible()
    await page.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByText('wirklich löschen?')).toBeHidden()
    testUserRows = await page.getByRole('row', { name: process.env.USER_ACCOUNT_USERNAME }).all()
  }
  await expect(page.getByRole('row', { name: process.env.USER_ACCOUNT_USERNAME })).toBeHidden()
})
