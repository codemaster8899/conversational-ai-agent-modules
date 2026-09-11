import { expect, test } from '@playwright/test'

test('user can upload files', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByRole('link', { name: 'Dateien' }).click()
  await expect(page.getByRole('heading', { name: 'Dateien' }).first()).toBeVisible()

  await (await page.getByTestId('in-title-add-button').all())[1].click()
  const fileChooserPromise = page.waitForEvent('filechooser')

  await page.getByTestId('file-upload-zone').click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(['./playwright/urlaub.md.pdf', './playwright/bei-krankheit.md.pdf'])

  await page.getByRole('button', { name: 'Hochladen' }).click()
  await expect(page.getByText('Die Datei urlaub.md.pdf wurde hochgeladen.')).toBeVisible()
  await expect(page.getByText('Die Datei bei-krankheit.md.pdf wurde hochgeladen.')).toBeVisible()

  await expect(page.locator('p.name', { hasText: 'urlaub.md.pdf' })).toBeVisible()
  await expect(page.locator('p.name', { hasText: 'bei-krankheit.md.pdf' })).toBeVisible()
})
