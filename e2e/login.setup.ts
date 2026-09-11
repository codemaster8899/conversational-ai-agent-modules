import { expect, test as setup } from '@playwright/test'
import { STORAGE_USER_STATE } from '../playwright.config.js'

setup('login as admin shows welcome message on home screen', async ({ page }) => {
  const response = await page.goto('/login')

  expect(
    response?.status(),
    `Site responded with ${response?.status()}, make sure it's live and that you have VPN access to it.`
  ).toBe(200)

  const requiredEnvs = [
    'ADMIN_ACCOUNT_EMAIL',
    'ADMIN_ACCOUNT_USERNAME',
    'ADMIN_ACCOUNT_PASSWORD',
    'ADMIN_ACCOUNT_PASSWORD_CHANGED',
    'USER_ACCOUNT_EMAIL',
    'USER_ACCOUNT_USERNAME',
    'USER_ACCOUNT_PASSWORD',
    'USER_ACCOUNT_PASSWORD_CHANGED',
    'VITE_TOAST_DURATION'
  ]
  requiredEnvs.forEach((key) => {
    if (!Object.hasOwn(process.env, key)) {
      throw new Error(`environment variable ${key} missing`)
    }
  })

  await page.getByPlaceholder('E-Mail oder Benutzername').click()
  await page.getByPlaceholder('E-Mail oder Benutzername').fill(process.env.ADMIN_ACCOUNT_EMAIL)
  await page.getByPlaceholder('E-Mail oder Benutzername').press('Tab')
  await page.getByPlaceholder('Passwort').click()
  await page.getByPlaceholder('Passwort').fill(process.env.ADMIN_ACCOUNT_PASSWORD)
  await page.getByTitle('login').click()

  await expect(page.getByRole('heading', { name: 'Willkommen' })).toBeVisible()

  await page.context().storageState({ path: STORAGE_USER_STATE })
})
