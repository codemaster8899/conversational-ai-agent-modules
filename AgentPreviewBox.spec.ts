import AgentPreviewBox from '@/components/AgentPreviewBox.vue'
import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import { flushPromises } from '@vue/test-utils'
import type { User } from '@/types'

const createIndividual = (username: string): User => {
  return {
    username: username,
    name: username,
    id: '46e534d5-39b1-4c25-a6be-7f853d2d719e',
    avatar: 'https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg',
    created: '2024-10-01T12:35:50.321844Z',
    modified: '2024-10-08T10:57:41.896350Z',
    scopes: '*',
    root_directory: {
      name: '/',
      id: '01924814-6a9a-7f71-99f9-285e073c3ee7',
      parent_id: null,
      canonical: '/'
    },
    public_avatar: ''
  }
}

const initialUser = createIndividual('admin')

const data = {
  color: '#fff',
  title: 'test',
  description: 'test description',
  fileCount: 55,
  individuals: [initialUser, initialUser, initialUser],
  owner_id: initialUser.id
}

const data2 = {
  ...data,
  individuals: undefined
}

describe('ChatbotPreview component tests', () => {
  beforeAll(() => {
    const userStore = useAuthStore()
    userStore.user = initialUser
  })

  afterEach(cleanup)

  test('render', () => {
    render(AgentPreviewBox, {
      props: data
    })
    screen.getByText(data.title)
  })

  test('Check shared icon absence', async () => {
    render(AgentPreviewBox, {
      store: {
        user: {
          id: data2.owner_id,
          username: 'not-shared-user'
        }
      },
      props: data2
    })
    const el1 = screen.queryByTestId('chatbot-shared-with')
    const el2 = screen.queryByTestId('chatbot-shared-by')
    expect(el1).toBeNull()
    expect(el2).toBeNull()
  })

  test('show User-Icon when Chatbot was shared with current User', async () => {
    const dataUserIcon = {
      ...data,
      individuals: [createIndividual('test1'), createIndividual(initialUser.username)]
    }
    render(AgentPreviewBox, {
      store: {
        user: {
          id: dataUserIcon.owner_id
        }
      },
      props: dataUserIcon
    })
    const el1 = screen.getByTestId('chatbot-shared-with')
    const el2 = screen.queryByTestId('chatbot-shared-by')
    expect(el1).toBeTruthy()
    expect(el2).toBeNull()
  })

  test('show User-Icon when Chatbot was shared by current User', async () => {
    const dataUserIcon = {
      ...data,
      individuals: [createIndividual('test1'), createIndividual('test2')]
    }
    render(AgentPreviewBox, {
      store: {
        user: {
          id: dataUserIcon.owner_id
        }
      },
      props: dataUserIcon
    })
    const el1 = screen.queryByTestId('chatbot-shared-with')
    const el2 = screen.getByTestId('chatbot-shared-by')
    expect(el1).toBeNull()
    expect(el2).toBeTruthy()
  })

  test('shows tooltip when text is truncated', async () => {
    // Mock the DOM measurements to simulate truncated text
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 30)
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => 60)

    const longTitle = 'This is a agent with a very long name !!!'
    render(AgentPreviewBox, {
      props: { ...data, title: longTitle }
    })
    await flushPromises()

    // Check if tooltip exists
    const titleElement = screen.getByTestId('tippy')
    await fireEvent.mouseEnter(titleElement)

    const tooltipElement = screen.getByTestId('tooltip')
    expect(tooltipElement).toBeTruthy()
    expect(tooltipElement.textContent).toBe(longTitle)
  })
  test('shows no tooltip when text is not truncated', async () => {
    // Mock the DOM measurements to simulate truncated text
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 60)
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => 30)

    const shortTitle = 'Short Title'

    render(AgentPreviewBox, {
      props: { ...data, title: shortTitle }
    })
    await flushPromises()

    expect(screen.queryByTestId('tippy')).toBeNull()
    expect(screen.queryByTestId('tooltip')).toBeNull()
  })
})
