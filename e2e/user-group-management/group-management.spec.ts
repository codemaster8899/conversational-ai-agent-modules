import { test, expect } from '@playwright/test'

test('admin can create group and add user', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByRole('link', { name: 'Einstellungen' }).click()
  await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()

  await page.getByRole('button', { name: 'Gruppen' }).click()
  await page.getByRole('button', { name: 'Gruppe erstellen' }).click()
  await page.getByPlaceholder('Name').click()
  await page.getByPlaceholder('Name').fill('TsaiTestGruppe')
  await page.getByPlaceholder('Beschreibung').click()
  await page.getByPlaceholder('Beschreibung').fill('Testgruppe')
  await page.getByRole('button', { name: 'Erstellen', exact: true }).click()
  await page.getByRole('cell', { name: 'TsaiTestGruppe' }).first().click()
  await page.getByRole('row', { name: 'T TsaiTestGruppe Testgruppe' }).getByRole('cell').nth(4).click()
  await page.getByRole('row', { name: 'T TsaiTestGruppe Testgruppe' }).getByRole('button').first().click()
  await page
    .locator('div')
    .filter({ hasText: /^Select option$/ })
    .click()
  await page.getByRole('option', { name: process.env.USER_ACCOUNT_USERNAME }).locator('span').first().click()
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  await page.getByText('TTest 1Mitglied').click()
  await page.getByRole('dialog').getByRole('button').first().click()
  await expect(page.getByText('Der Benutzer wurde erfolgreich hinzugefügt.')).toBeVisible()
  await expect(page.getByRole('row', { name: 'TsaiTestGruppe' }).first()).toBeVisible()

  const avatars = await page.getByRole('row', { name: 'TsaiTestGruppe' }).first().locator('.avatar').all()
  expect(avatars.length).toBe(2)
})
