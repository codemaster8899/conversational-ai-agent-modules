import { expect, test } from '@playwright/test'

test('user can rename pdf', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByRole('link', { name: 'Dateien' }).click()

  await (await page.locator('.add-btn').all())[1].click()
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByTestId('file-upload-zone').click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(['./playwright/urlaub.md.pdf'])

  await page.getByRole('button', { name: 'Hochladen' }).click()

  const uploadedFile = page.locator('div').filter({ hasText: /^urlaub\.md\.pdf$/ })

  await uploadedFile.getByTestId('file-actions').click()
  await page.getByRole('button', { name: 'Bearbeiten' }).click()

  await page.getByPlaceholder('Dateiname').fill('Urlaub.pdf')
  await page.getByRole('button', { name: 'Ändern' }).click()

  await expect(page.getByText('Erfolgreich geändert')).toBeVisible()
  await expect(page.getByText('Urlaub.pdf')).toBeVisible()

  // revert
  await page
    .locator('div')
    .filter({ hasText: /^Urlaub\.pdf$/ })
    .getByTestId('file-actions')
    .click()
  await page.getByRole('button', { name: 'Bearbeiten' }).click()

  await page.getByPlaceholder('Dateiname').fill('urlaub.md.pdf')
  await page.getByRole('button', { name: 'Ändern' }).click()
  await expect(page.getByText('urlaub.md.pdf')).toBeVisible()
})

test('user can search for uploaded files', async ({ page }) => {
  // Navigate to the page
  await page.goto('/app/home') // Replace with your actual URL
  await page.getByRole('link', { name: 'Dateien' }).click()

  await page.locator('.add-btn').nth(1).click()
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByTestId('file-upload-zone').click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(['./playwright/urlaub.md.pdf', './playwright/bei-krankheit.md.pdf'])

  await page.getByRole('button', { name: 'Hochladen' }).click()

  await expect(page.getByTestId('file-item').getByText('urlaub.md.pdf')).toBeVisible()
  await expect(page.getByTestId('file-item').getByText('bei-krankheit.md.pdf')).toBeVisible()

  // // Search for a file
  const searchBox = page.getByRole('textbox', { name: 'Suchen' })

  await searchBox.click()
  await searchBox.fill('ur')
  await expect(page.getByTestId('file-item').getByText('urlaub.md.pdf')).toBeVisible()
  await expect(page.getByTestId('file-item').getByText('bei-krankheit.md.pdf')).toBeHidden()

  await searchBox.click()
  await searchBox.fill('be')
  await expect(page.getByTestId('file-item').getByText('bei-krankheit.md.pdf')).toBeVisible()
  await expect(page.getByTestId('file-item').getByText('urlaub.md.pdf')).toBeHidden()

  // // Clear search and verify all files are visible again
  await searchBox.click()
  await searchBox.fill('')
  await expect(page.getByTestId('file-item').getByText('urlaub.md.pdf')).toBeVisible()
  await expect(page.getByTestId('file-item').getByText('bei-krankheit.md.pdf')).toBeVisible()
})

test('user can filter uploaded files', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByRole('link', { name: 'Dateien' }).click()

  await page.locator('.add-btn').nth(1).click()
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByTestId('file-upload-zone').click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(['./playwright/urlaub.md.pdf', './playwright/bei-krankheit.md.pdf'])

  await page.getByRole('button', { name: 'Hochladen' }).click()

  await expect(page.getByTestId('file-item').getByText('urlaub.md.pdf')).toBeVisible()
  await expect(page.getByTestId('file-item').getByText('bei-krankheit.md.pdf')).toBeVisible()

  await page
    .getByTestId('file-filter')
    .getByTestId('tsai-dropdown')
    .locator('div')
    .filter({ hasText: 'Indexstatus' })
    .click()

  await expect(page.getByRole('option', { name: 'Fehlgeschlagen' })).toBeVisible()

  await page.getByRole('option', { name: 'Fehlgeschlagen' }).click()

  await expect(
    page
      .locator('div')
      .filter({ hasText: /^Fehlgeschlagen$/ })
      .locator('span')
  ).toBeVisible()

  await expect(page.getByTestId('file-item').getByText('urlaub.md.pdf')).toBeHidden()
  await expect(page.getByTestId('file-item').getByText('bei-krankheit.md.pdf')).toBeHidden()

  await page.locator('.form-group').filter({ hasText: 'Fehlgeschlagen' }).first().click()

  await page.getByRole('option', { name: 'Fehlgeschlagen' }).click()

  await expect(page.getByText('Indexstatus')).toBeVisible()
})

test('user can sort uploaded files by changed date', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByRole('link', { name: 'Dateien' }).click()

  await expect(page.getByText('Sortierung')).toBeVisible()

  await page.locator('.add-btn').nth(1).click()
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByTestId('file-upload-zone').click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(['./playwright/urlaub.md.pdf', './playwright/bei-krankheit.md.pdf'])

  await page.getByRole('button', { name: 'Hochladen' }).click()

  await expect(page.getByTestId('file-item').getByText('urlaub.md.pdf')).toBeVisible()
  await expect(page.getByTestId('file-item').getByText('bei-krankheit.md.pdf')).toBeVisible()

  const sortingDropdown = page.getByTestId('file-sorting')
  await sortingDropdown.waitFor({ state: 'visible' })
  await sortingDropdown.click()

  const sortingOption = page.getByText('Änderungsdatum')
  await sortingOption.waitFor({ state: 'visible' })
  await sortingOption.click()

  let files = await page.getByTestId('file-item').all()
  await expect(files[0].getByText('bei-krankheit.md.pdf')).toBeVisible()
  await expect(files[1].getByText('urlaub.md.pdf')).toBeVisible()

  // // click arrow, check that order has changed
  await page.locator('#application-view').getByRole('button').nth(2).click()

  files = await page.getByTestId('file-item').all()
  await expect(files[0].getByText('urlaub.md.pdf')).toBeVisible()
  await expect(files[1].getByText('bei-krankheit.md.pdf')).toBeVisible()

  // remove selection
  await page
    .locator('div')
    .filter({ hasText: /^Änderungsdatum$/ })
    .click()
  await page.getByRole('option', { name: 'Änderungsdatum' }).locator('span').first().click()
  await expect(page.getByText('Sortierung')).toBeVisible()
})
