import { expect, test } from '@playwright/test'

test('delete test groups', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByRole('link', { name: 'Einstellungen' }).click()
  await page.getByRole('button', { name: 'Gruppen' }).click()

  await expect(page.getByText("Gruppe erstellen")).toBeVisible()

  let testgroups = await page.getByRole('row', { name: 'TsaiTestGruppe' }).all()

  while (testgroups.length > 0) {
    await page.getByRole('row', { name: 'TsaiTestGruppe' }).first().getByRole('button').nth(1).click()
    await expect(page.getByText('wirklich löschen?')).toBeVisible()
    await page.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByText('Die Gruppe wurde gelöscht.')).toBeVisible()
    await expect(page.getByText('Die Gruppe wurde gelöscht.')).toBeHidden()
    testgroups = await page.getByRole('row', { name: 'TsaiTestGruppe' }).all()
  }
  await expect(page.getByRole('row', { name: 'TsaiTestGruppe' })).toBeHidden()
})
