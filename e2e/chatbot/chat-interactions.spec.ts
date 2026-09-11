import { test, expect } from '@playwright/test'

test('user can rewrite answer from chatbot', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByTestId('chatbot-preview').first().click()
  await page.getByTestId('chat-input').fill('Wie hoch ist der Eifelturm?')
  await page.getByTestId('chat-input-button').click()

  // Loading indicator is shown
  await expect(page.locator('[data-testid="loading-message-icon"]').first()).toBeVisible()

  // check both chat messages are displayed
  let chatMessages = await page.getByTestId('chat-message-text').all()

  expect(chatMessages.length).toBe(2)

  await expect(page.locator('#reWrite-button')).toBeVisible({timeout: 15000})
  await page.locator('#reWrite-button').click({delay: 2000})

  // Loading indicator is shown
  await expect(page.locator('[data-testid="loading-message-icon"]').first()).toBeVisible()
  // Loading indicator is hidden
  await expect(page.locator('[data-testid="loading-message-icon"]').first()).toBeHidden({timeout : 10000})

  // check both chat messages are displayed
  chatMessages = await page.getByTestId('chat-message-text').all()

  expect(chatMessages.length).toBe(2)
  await expect(page.locator('#reWrite-button')).toBeVisible()
})

test('user can edit answer from chatbot', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByTestId('chatbot-preview').first().click()
  await page.getByTestId('chat-input').fill('Wie hoch ist der Eifelturm?')
  await page.getByTestId('chat-input-button').click()

  // Loading indicator is shown
  await expect(page.locator('[data-testid="loading-message-icon"]').first()).toBeVisible()

  // check both chat messages are displayed
  let chatMessages = await page.getByTestId('chat-message-text').all()

  expect(chatMessages.length).toBe(2)

  await expect(page.locator('.edit-button')).toBeVisible({timeout: 10000})
  await page.locator('.edit-button').click({delay: 2000})
  
  await page.getByTestId('edit-message-input').click();
  await page.getByTestId('edit-message-input').fill('Wie hoch ist das Brandenburger Tor?')
  await page.getByTestId('edit-message-confirm').click()

  // Loading indicator is shown
  await expect(page.locator('[data-testid="loading-message-icon"]').first()).toBeVisible()
  // Loading indicator is hidden
  await expect(page.locator('[data-testid="loading-message-icon"]').first()).toBeHidden({timeout : 10000})

  // check both chat messages are displayed
  chatMessages = await page.getByTestId('chat-message-text').all()

  expect(chatMessages.length).toBe(2)
  await expect(page.locator('.edit-button')).toBeVisible()
})


test('rewrite and edit are only shown on last ai message', async ({ page }) => {
  await page.goto('/app/home')
  await page.getByTestId('chatbot-preview').first().click()
  await page.getByTestId('chat-input').fill('Wie hoch ist der Eifelturm?')
  await page.getByTestId('chat-input-button').click()

  // Loading indicator is shown
  await expect(page.locator('[data-testid="loading-message-icon"]').first()).toBeVisible()

  // check both chat messages are displayed
  let chatMessages = await page.getByTestId('chat-message-text').all()

  expect(chatMessages.length).toBe(2)

  // check visibility on buttons
  await expect(page.locator('#reWrite-button')).toBeVisible({timeout: 10000})
  await page.locator('#reWrite-button').hover()
  await expect(page.getByText('Neu generieren')).toBeVisible()

  await expect(page.locator('.edit-button')).toBeVisible()
  await page.locator('.edit-button').hover()
  await expect(page.getByText('Frage bearbeiten')).toBeVisible()

  await expect(page.locator('.copy-button')).toBeVisible()
  await page.locator('.copy-button').hover()
  await expect(page.getByText('Kopieren')).toBeVisible()

  // ask 2nd question
  await page.getByTestId('chat-input').click()
  await page.getByTestId('chat-input').fill('Wie hoch ist der Mt. Everest?')
  await page.getByTestId('chat-input-button').click()

  await expect(page.locator('[data-testid="loading-message-icon"]').first()).toBeVisible()
  chatMessages = await page.getByTestId('chat-message-text').all()

  expect(chatMessages.length).toBe(4)

  // check buttons only shown after last message, longer timeout bc message is loading
  const lastMessage = (await page.getByTestId('chat-message').all())[3]
  await expect(lastMessage.locator('#reWrite-button')).toBeVisible({timeout: 10000})
  await expect(lastMessage.locator('.edit-button')).toBeVisible()
  await expect(lastMessage.locator('.copy-button')).toBeVisible()
  
  // check buttons only shown after last message, longer timeout bc message is loading
  const firstAnswer = (await page.getByTestId('chat-message').all())[1]
  await expect(firstAnswer.locator('#reWrite-button')).toBeHidden()
  await expect(firstAnswer.locator('.edit-button')).toBeHidden()

  await firstAnswer.hover()
  await expect(firstAnswer.locator('.copy-button')).toBeVisible()
  await expect(firstAnswer.locator('#reWrite-button')).toBeHidden()
  await expect(firstAnswer.locator('.edit-button')).toBeHidden()
})
