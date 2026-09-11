import { test, expect } from '@playwright/test'

test('user can change avatar', async ({ page }) => {
  await page.goto('/app/home')

  await page.getByRole('banner').getByRole('button').click()
  await page.getByText('Profil').click()

  await expect(page.getByText('Persönliche Einstellungen')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ändern' })).toBeVisible()
  await page.locator('.avatar-cropper-img-input').setInputFiles('./playwright/blue.png')
  await expect(page.locator('.cropper-face')).toBeVisible()
  await page.getByRole('button', { name: 'Ok' }).click()
  await expect(page.locator('.cropper-face')).toBeHidden()

  await expect(page.getByRole('dialog').locator('img')).toBeVisible()
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('dialog')).toHaveScreenshot({threshold: 0.1})

  await page.locator('.final-modal-close').click()
  await expect(page.getByText('Persönliche Einstellungen')).toBeHidden()

  
  // change back
  await page.getByRole('banner').getByRole('button').click()
  await page.getByText('Profil').click()
  await expect(page.getByText('Persönliche Einstellungen')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ändern' })).toBeVisible()
  await page.locator('.avatar-cropper-img-input').setInputFiles('./playwright/orange.png')
  await page.getByRole('button', { name: 'Ok' }).click()
  await expect(page.locator('.cropper-face')).toBeHidden()
  await page.getByRole('button', { name: 'Speichern' }).click()
  await page.locator('.final-modal-close').click()
  await expect(page.getByText('Persönliche Einstellungen')).toBeHidden()
})
