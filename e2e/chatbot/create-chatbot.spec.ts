import { expect, test } from '@playwright/test'

test('user can create agent', async ({ page }) => {
  await page.goto('/app/chatbots')
  await page.getByRole('link', { name: 'Agenten' }).click()
  const addBtn = page.getByTestId('in-title-add-button').locator('img')
  await expect(addBtn).toBeVisible()

  await addBtn.click()
  const newAgentBtn = page.locator('li').filter({ hasText: 'Neuer Agent' })
  await expect(newAgentBtn).toBeVisible()
  await newAgentBtn.click()

  await page.getByLabel('Name des Agenten').click()
  await page.getByLabel('Name des Agenten').fill('Test Agent')
  await page.getByLabel('Beschreibung').click()
  await page.getByLabel('Beschreibung').fill('Test Agent ist ein neuer Agent')

  await page
    .locator('div')
    .filter({ hasText: /^Select option$/ })
    .click()
  await page.getByRole('option', { name: 'OpenAI GPT-4o' }).locator('span').first().click()
  await page.getByRole('option', { name: 'M' }).click()
  await page.getByRole('button', { name: 'Erstellen' }).click()

  const heading = page.getByRole('heading', { name: 'Test Agent' })
  await expect(heading).toBeVisible()
})

test('user can edit agent', async ({ page }) => {
  await page.goto('/app/chatbots')

  const cbEditHeading = page.getByRole('heading', { name: 'Test Agent' }).first()
  await cbEditHeading.hover()
  await page.getByTestId('chatbot-edit').click()

  await page.getByLabel('Name des Agenten').click()
  await page.getByLabel('Name des Agenten').fill('Test Agent bearbeitet')
  await page.getByLabel('Beschreibung').click()
  await page.getByLabel('Beschreibung').fill('Test Agent ist ein neuer Agent, bearbeitet')
  await page.getByLabel('System Prompt').click()
  await page
    .getByLabel('System Prompt')
    .fill(
      'Du bist ein KI Assistent, der Skillbyte Mitarbeitern Fragen aus der internen FAQ beantwortet. Antworte in der Höflichkeitsform.'
    )

  await page.getByLabel('Farbe').click()
  await page.getByLabel('Farbe').fill('#3a823f')

  const dd = page.getByTestId('tsai-dropdown')
  await dd.click()
  //click first element in dropdown and deselect it
  await dd.getByRole('option').first().click()
  await dd.click()
  //select it again
  await dd.getByRole('option').first().click()
  await page.getByRole('option', { name: 'S' }).click()

  const checkboxes = await page.getByTestId('tsai-checkbox').all()
  for (const checkbox of checkboxes) {
    await checkbox.click()
  }

  await page.getByRole('button', { name: 'Speichern' }).click()

  // open agent conversation to see changed title & description
  const cbEdited = page.getByRole('heading', { name: 'Test Agent bearbeitet' }).first()
  await expect(cbEdited).toBeVisible()
  await cbEdited.hover()
  await page.getByTestId('chatbot-edit').click()

  await expect(page.getByLabel('Name des Agenten')).toHaveValue('Test Agent bearbeitet')
  await expect(page.getByLabel('Beschreibung')).toHaveValue(
    'Test Agent ist ein neuer Agent, bearbeitet'
  )
})

test('user can edit chatbot to add files', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByRole('link', { name: 'Agenten' }).click()
  await expect(page.getByRole('heading', { name: 'Agenten' })).toBeVisible()
  await expect(page.getByText('Enterprise Search').first()).toBeVisible()

  await page.getByTestId('chatbot-preview').first().hover()
  await page.getByTestId('chatbot-preview').first().getByTestId('chatbot-edit').click()

  await page.getByRole('button', { name: 'Dateien verbinden' }).click()

  await page.getByRole('dialog').getByText('bei-krankheit.md.pdf').click()
  await page.getByRole('button', { name: 'Verbinden', exact: true }).click()
  await expect(page.getByText('1 Datei ausgewählt').first()).toBeVisible()

  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByRole('heading', { name: 'Enterprise Search' })).toBeVisible()
  await expect(page.getByText('1 Dateien').first()).toBeVisible()
})
