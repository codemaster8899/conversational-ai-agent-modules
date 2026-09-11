import { expect, test } from '@playwright/test'
import { TIMEOUT } from 'dns'

test('delete files', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByRole('link', { name: 'Dateien' }).click()

  await expect( page.getByText('Laden Sie PDF oder DOCX Dateien hoch und')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dateien' }).first()).toBeVisible()
  await expect(page.getByTestId('files-loading-indicator')).toBeHidden({timeout: 5000})

  let files = await page.getByTestId('file-item').all()
  // using while because foreach loop had problems after first file was removed
  while (files.length > 0) {
    const file = files[0]
    await file.getByTestId('file-actions').click()
    await expect(page.getByText('Vorschau')).toBeVisible()
    await page.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByText('Datei löschen?')).toBeVisible()
    await page.getByTestId('delete-modal').getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByText('Die Datei wurde gelöscht.')).toBeVisible()
    await expect(page.getByText('Die Datei wurde gelöscht.')).toBeHidden()
    files = await page.getByTestId('file-item').all()
  }

  await expect(page.getByText('Keine Dateien gefunden')).toBeVisible()
})
