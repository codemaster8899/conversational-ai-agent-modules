import { test, expect } from '@playwright/test'

test('admin can create users', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Einstellungen' }).click()

  await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()

  await page.getByRole('button', { name: 'Benutzer' }).click()
  await page.getByRole('button', { name: 'Benutzer anlegen' }).click()

  await page.getByPlaceholder('Name des Benutzers').click()
  await page.getByPlaceholder('Name des Benutzers').fill(process.env.USER_ACCOUNT_USERNAME)

  await page.getByPlaceholder('E-Mail des Benutzers').click()
  await page.getByPlaceholder('E-Mail des Benutzers').fill(process.env.USER_ACCOUNT_EMAIL)
  await page.getByPlaceholder('Name', { exact: true }).click()
  await page.getByPlaceholder('Name', { exact: true }).fill('Test 1')
  await page.getByPlaceholder('Initialpasswort').click()
  await page.getByPlaceholder('Initialpasswort').fill(process.env.USER_ACCOUNT_PASSWORD)
  await page
    .locator('div')
    .filter({ hasText: /^Rolle$/ })
    .click()
  await page.getByRole('option', { name: 'User' }).locator('div').click()
  await page.getByRole('button', { name: 'Erstellen' }).click()

  await expect(page.getByRole('cell', { name: process.env.USER_ACCOUNT_USERNAME })).toBeVisible()
})