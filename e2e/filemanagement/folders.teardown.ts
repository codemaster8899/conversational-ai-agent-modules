import { test, expect } from '@playwright/test'
import exp from 'constants'

test('user can delete folder', async ({ page }) => {
  await page.goto('/app/files')
  await expect(page.getByRole('heading', { name: 'Dateien' }).first()).toBeVisible()
  await expect(page.getByTestId('files-loading-indicator')).toBeHidden()
  let folders = await page
    .locator('div')
    .filter({ hasText: /^TsaiTest$/ })
    .all()
  while (folders.length > 0) {
    await page
      .locator('div')
      .filter({ hasText: /^TsaiTestOrdner$/ })
      .first()
      .locator('.menu')
      .click()
    await page.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByRole('heading', { name: 'Ordner löschen' })).toBeVisible()
    await page.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByRole('heading', { name: 'Ordner löschen' })).toBeHidden()
    await expect(page.getByText('Der Ordner wurde gelöscht.')).toBeVisible()
    await expect(page.getByText('Der Ordner wurde gelöscht.')).toBeHidden()
    folders = await page
      .locator('div')
      .filter({ hasText: /^TsaiTest$/ })
      .all()
  }

  await expect(page.locator('div').filter({ hasText: /^TsaiTest$/ })).toBeHidden()
})
