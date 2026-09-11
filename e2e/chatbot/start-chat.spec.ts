import { test, expect } from '@playwright/test'

test('user can start chatting from start page', async ({ page }) => { 
  // ask question from home screen
  await page.goto('/app/home')
  await page.getByPlaceholder('Wie kann ich dir helfen?').click()
  await page.getByPlaceholder('Wie kann ich dir helfen?').fill('Wie kannst du mir helfen?')

  await page.getByTestId('chat-window').getByRole('button').click();

  await expect(page.getByTestId('chat-window').getByText('Admin', { exact: true })).toBeVisible()
  await expect(page.getByTestId('chat-window').getByText('TextSenseAI')).toBeVisible()
  
  // Loading indicator is shown
  await expect(page.locator('[data-testid="loading-message-icon"]').first()).toBeVisible();

  // check both chat messages are displayed
  const chatMessages = await page.getByTestId('chat-message-text').all();

  expect(chatMessages.length).toBe(2)

  await expect(chatMessages[0]).toBeVisible()
  await expect(chatMessages[0]).toHaveText('Wie kannst du mir helfen?')
  await expect(chatMessages[1]).toBeVisible({timeout: 20000})
  await expect(chatMessages[1]).toContainText('helfen')

  // input new question, check that new answer is given:
  await page.getByTestId('chat-input').click();
  await page.getByTestId('chat-input').fill('Was gilt als Arbeitsunfall?');
  await page.getByTestId('chat-input-button').click();

  await expect(page.getByTestId('loading-message-icon').first()).toBeVisible();
  
  const secondQuestionChatMessages = await page.getByTestId('chat-message-text').all();
  await expect(secondQuestionChatMessages[2]).toBeVisible()
  await expect(secondQuestionChatMessages[2]).toHaveText('Was gilt als Arbeitsunfall?')
  await expect(secondQuestionChatMessages[3]).toBeVisible()
  await expect(secondQuestionChatMessages[3]).toContainText('Arbeitsunfall')
})


test('user can rename conversation', async ({ page }) => {
  await page.goto('/app/home')
  await page.locator('.conversation-item').first().locator('.icon-wrapper > svg').click();

  await page.getByText('Umbenennen').click()
  await page.locator('input[name="rename"]').click()
  await page.locator('input[name="rename"]').fill('Chatkonversation')
  await page.getByRole('button', { name: 'Umbenennen' }).click()
  await expect(page.getByText('Chatkonversation').first()).toBeVisible()
})
