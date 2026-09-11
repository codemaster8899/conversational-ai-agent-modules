import { expect, test } from '@playwright/test'

test('user can create and rename folder', async ({ page }) => {
  await page.goto('/app/files')
  await expect(page.getByRole('heading', { name: 'Dateien' }).first()).toBeVisible()
  await expect(page.getByTestId('files-loading-indicator')).toBeHidden()

  // Create a new folder
  await page.locator('.add-btn').first().click()
  await expect(page.getByText('Ordner erstellen')).toBeVisible()
  await page.getByPlaceholder('Ordnername').fill('TsaiTestOrdner')
  await page.getByRole('button', { name: 'Erstellen' }).click()
  await expect(page.getByText('Ordner erstellen')).toBeHidden()

  // Locate the newly created folder more precisely
  const folderLocator = page.locator('.folder', { hasText: 'TsaiTestOrdner' })
  await expect(folderLocator).toBeVisible()

  // Open folder options
  await folderLocator.getByRole('button').click()
  await page.getByRole('button', { name: 'Bearbeiten' }).click()
  await expect(page.getByText('Ordnernamen ändern')).toBeVisible()

  // Rename the folder
  await page.getByPlaceholder('Ordnername').fill('TsaiTestOrdner')
  await page.getByRole('button', { name: 'Ändern' }).click()

  // Verify renamed folder
  await expect(folderLocator).toBeVisible()
})

test('user can create subfolder', async ({ page }) => {
  await page.goto('/app/files')
  await expect(page.getByRole('heading', { name: 'Dateien' }).first()).toBeVisible()
  await expect(page.getByTestId('files-loading-indicator')).toBeHidden()

  await expect(page.locator('.folder').filter({ hasText: /^TsaiTestOrdner$/ })).toBeVisible()

  await page
    .locator('.folder')
    .filter({ hasText: /^TsaiTestOrdner$/ })
    .click()

  await page.locator('.add-btn').first().click()
  await page.getByPlaceholder('Ordnername').fill('TsaiTestSubOrdner')
  await page.getByRole('button', { name: 'Erstellen' }).click()
  await page.locator('.folder').filter({ hasText: 'TsaiTestSubOrdner' }).click()
  await expect(page.getByText('Keine Ordner gefunden.')).toBeVisible()
  await expect(page.getByText('Keine Dateien gefunden.')).toBeVisible()
  await page.getByRole('button', { name: 'TsaiTestOrdner' }).click()
  await page.getByText('Keine Dateien gefunden.').click()
})

test('user can directly upload a file in a folder', async ({ page }) => {
  await page.goto('/app/files')
  await expect(page.getByRole('heading', { name: 'Dateien' }).first()).toBeVisible()
  await expect(page.getByTestId('files-loading-indicator')).toBeHidden()
  // folder has to exist
  await expect(page.locator('.folder').filter({ hasText: /^TsaiTestOrdner$/ })).toBeVisible()
  await page
    .locator('.folder')
    .filter({ hasText: /^TsaiTestOrdner$/ })
    .click()

  await expect(page.getByRole('button', { name: 'TsaiTestOrdner' })).toBeVisible()

  // upload file
  await (await page.locator('.add-btn').all())[1].click()
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByTestId('file-upload-zone').click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(['./playwright/test_2.pdf'])

  await page.getByRole('button', { name: 'Hochladen' }).click()

  const test2Pdf = page.getByTestId('file-item').getByText('test_2.pdf')
  await expect(test2Pdf).toBeVisible()

  await page.goto('/app/files')
  await expect(page.locator('.folder').filter({ hasText: /^TsaiTestOrdner$/ })).toBeVisible()
  await expect(test2Pdf).toBeHidden()
})

test('user can move file to folder by modal', async ({ page }) => {
  await page.goto('/app/files')
  await expect(page.getByRole('heading', { name: 'Dateien' }).first()).toBeVisible()
  await expect(page.getByTestId('files-loading-indicator')).toBeHidden()
  // folder has to exist
  await expect(page.locator('.folder').filter({ hasText: /^TsaiTestOrdner$/ })).toBeVisible()

  // upload file to be moved
  await (await page.locator('.add-btn').all())[1].click()
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByTestId('file-upload-zone').click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(['./playwright/test_1.pdf'])

  await page.getByRole('button', { name: 'Hochladen' }).click()

  const uploadedFile = page.locator('div').filter({ hasText: /^test_1\.pdf$/ })
  // move file
  await uploadedFile.getByTestId('file-actions').click()
  await page.getByRole('button', { name: 'Verschieben' }).click()
  await expect(page.getByText('Datei verschieben')).toBeVisible()
  await page.getByRole('button', { name: 'TsaiTestOrdner' }).click()
  await page.getByRole('button', { name: 'Hierhin verschieben' }).click()
  await expect(page.getByText('Datei verschieben')).toBeHidden()

  await expect(uploadedFile).toBeHidden()
  await page
    .locator('.folder')
    .filter({ hasText: /^TsaiTestOrdner$/ })
    .click()
  await expect(page.getByTestId('file-item').getByText('test_1.pdf')).toBeVisible()
})

test('user can delete subfolder', async ({ page }) => {
  await page.goto('/app/files')
  await expect(page.getByRole('heading', { name: 'Dateien' }).first()).toBeVisible()
  await expect(page.getByTestId('files-loading-indicator')).toBeHidden()

  await page.waitForSelector('.folder', { state: 'attached' })

  // Ensure TsaiTestOrdner exists
  const folderLocator = page.locator('.folder').filter({ hasText: /^TsaiTestOrdner$/ })
  await expect(folderLocator).toBeVisible()
  await folderLocator.click()

  // Ensure subfolder exists
  const subfolderLocator = page.locator('.folder').filter({ hasText: /^TsaiTestSubOrdner$/ })
  await expect(subfolderLocator).toBeVisible()

  await subfolderLocator.locator('.menu').first().click()

  // Click the delete button from the menu
  const menuRemoveButton = page.getByRole('button', { name: 'Löschen' }).nth(0)
  await menuRemoveButton.click()

  // Wait for the modal to appear
  await expect(page.getByTestId('delete-modal')).toBeVisible()

  // Click the delete button in the modal
  const confirmRemoveButton = page
    .getByTestId('delete-modal')
    .getByRole('button', { name: 'Löschen' })
  await confirmRemoveButton.click()

  // Confirm deletion success message
  await expect(page.getByText('Der Ordner wurde gelöscht.')).toBeVisible()

  // Ensure subfolder is no longer visible
  await expect(subfolderLocator).toBeHidden()
})

test('user can delete folder with files', async ({ page }) => {
  await page.goto('/app/files')
  await expect(page.getByRole('heading', { name: 'Dateien' }).first()).toBeVisible()
  await expect(page.getByTestId('files-loading-indicator')).toBeHidden()
  // folder has to exist
  const folderLocator = page.locator('.folder').filter({ hasText: /^TsaiTestOrdner$/ })

  await expect(folderLocator).toBeVisible()

  await folderLocator.locator('.menu').first().click()

  // Click the delete button from the menu
  const menuRemoveButton = page.getByRole('button', { name: 'Löschen' }).nth(0)
  await menuRemoveButton.click()

  // Wait for the modal to appear
  await expect(page.getByTestId('delete-modal')).toBeVisible()

  // Click the delete button in the modal
  const confirmRemoveButton = page
    .getByTestId('delete-modal')
    .getByRole('button', { name: 'Löschen' })
  await confirmRemoveButton.click()

  await expect(page.getByText('Der Ordner wurde gelöscht.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'TsaiTestOrdner' })).toBeHidden()
})
