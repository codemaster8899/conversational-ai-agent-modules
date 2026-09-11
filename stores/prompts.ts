import { useAuthStore } from '@/stores/auth'
import type { FileUser } from '@/types/file'
import { Pagination } from '@/types/pagination'
import type { Prompt, PromptPayload, PromptTag, PromptTagPayload } from '@/types/prompts'
import { handleError } from '@/utils/error'
import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePromptsStore = defineStore('prompts', () => {
  const { user } = useAuthStore()
  const promptSuggestions = ref<Prompt[]>([])
  const openPromptSidebar = ref<boolean>(false)
  const openPromptLibrary = ref<boolean>(false)
  const openPromptCreateSidebar = ref<boolean>(false)
  const selectedPrompt = ref<Prompt | null>(null)
  const promptTags = ref<PromptTag[]>([])
  const promptText = ref<string>('')
  const activePromptId = ref<string | null>(null)

  function refreshPromptSuggestions(prompt: Prompt) {
    const index = promptSuggestions.value.findIndex((c) => c.id === prompt.id)
    if (index >= 0) {
      promptSuggestions.value[index] = prompt
    }
    if (index < 0) {
      promptSuggestions.value.push(prompt)
    }
  }

  function refreshPromptTags(tag: PromptTag) {
    const index = promptTags.value.findIndex((c) => c.id === tag.id)
    if (index >= 0) {
      promptTags.value[index] = tag
    }
    if (index < 0) {
      promptTags.value.push(tag)
    }
  }

  async function fetchPromptSuggestions(
    pagination: Pagination<Prompt>,
    query: string,
    tag_names: string[]
  ) {
    try {
      const response = await axios.get(`/api/prompt-suggestions?${pagination.toQueryParams()}`, {
        params: {
          q: query ? query : undefined,
          tag_names: tag_names.length ? tag_names : undefined
        },
        paramsSerializer: {
          indexes: null
        }
      })

      promptSuggestions.value = response.data.items
      return response.data
    } catch (e) {
      handleError(e, 'prompts.error.fetching-prompts')
    }
  }

  async function createPrompt(newPrompt: PromptPayload) {
    try {
      const response = await axios.post(`/api/prompt-suggestions`, newPrompt)

      refreshPromptSuggestions(response.data)
      goBackToLibrary()
      return response.data
    } catch (e) {
      handleError(e, 'prompts.error.creating-updating-prompt')
    }
  }

  async function updatePrompt(id: string, prompt: PromptPayload) {
    try {
      const response = await axios.patch(`/api/prompt-suggestions/${id}`, prompt)

      refreshPromptSuggestions(response.data)
      goBackToLibrary()
      return response.data
    } catch (e) {
      handleError(e, 'prompts.error.creating-updating-prompt')
    }
  }

  async function deletePrompt(id: string) {
    try {
      const response = await axios.delete(`/api/prompt-suggestions/${id}`)

      refreshPromptSuggestions(response.data)
      goBackToLibrary()
      return response.data
    } catch (e) {
      handleError(e, 'prompts.error.delete-prompt')
    }
  }

  function openSidebar() {
    openPromptSidebar.value = true
    openPromptLibrary.value = true
    openPromptCreateSidebar.value = false
    selectedPrompt.value = null
  }

  function openCreateForm() {
    openPromptSidebar.value = true
    openPromptCreateSidebar.value = true
    openPromptLibrary.value = false
    selectedPrompt.value = null
  }

  function openEditForm(prompt: Prompt) {
    openPromptSidebar.value = true
    openPromptCreateSidebar.value = true
    openPromptLibrary.value = false
    selectedPrompt.value = prompt
  }

  async function closeSidebar() {
    openPromptSidebar.value = false
    openPromptCreateSidebar.value = false
    openPromptLibrary.value = false
    selectedPrompt.value = null
    await fetchPromptSuggestions(new Pagination({ size: 2 }), '', [])
  }

  function goBackToLibrary() {
    openPromptCreateSidebar.value = false
    openPromptLibrary.value = true
    openPromptSidebar.value = promptSuggestions.value.length ? true : false
    selectedPrompt.value = null
  }

  async function fetchPromptTags() {
    try {
      const response = await axios.get(`/api/tags`)

      promptTags.value = response.data.items
      return response.data
    } catch (e) {
      handleError(e, 'prompts.error.fetching-prompt-tags')
    }
  }

  async function createTag(payload: PromptTagPayload) {
    try {
      const response = await axios.post(`/api/tags`, payload)

      refreshPromptTags(response.data)

      return response.data
    } catch (e) {
      handleError(e, 'prompts.error.creating-prompt-tag')
    }
  }

  async function deleteTag(tag_id: string) {
    try {
      const response = await axios.delete(`/api/tags/${tag_id}`)

      await fetchPromptTags()
      return response.data
    } catch (e) {
      handleError(e, 'prompts.error.deleting-prompt-tag')
    }
  }

  function handleInsertPrompt(prompt: Prompt) {
    activePromptId.value = prompt.id

    let text = prompt.content
    const currentDate = new Date().toLocaleDateString('de-DE')
    const currentTime = new Date().toLocaleTimeString('de-DE')

    if (user) {
      const regex = /\{\{.*?\}\}/g
      text = text
        .replace('{{_name}}', `<span style="font-weight: bold">${user.name}</span>`)
        .replace('{{_username}}', `<span style="font-weight: bold">${user.username}</span>`)
        .replace('{{_date}}', `<span style="font-weight: bold">${currentDate}</span>`)
        .replace('{{_time}}', `<span style="font-weight: bold">${currentTime}</span>`)
        .replace(regex, (match) => `<mark>${match}</mark>`)
    }

    promptText.value = text
    closeSidebar()
    return text
  }

  function replaceFilePlaceholders(inputString: string, files: FileUser[]): string {
    if (!inputString || !files || files.length === 0) {
      return inputString
    }

    let fileIndex = 0

    return inputString.replace(/<mark>{{(.*?)}}<\/mark>/g, (match, placeholder) => {
      if (placeholder.includes('file') && fileIndex < files.length) {
        const fileName = files[fileIndex].file_name
        fileIndex++ // Move to the next file
        return `<span style="font-weight: bold">${fileName}</span>`
      }

      return match
    })
  }

  async function invokePromptSuggestion(id: string) {
    try {
      const response = await axios.post(`/api/prompt-suggestions/${id}/invoke`)

      resetActivePrompt()
      await fetchPromptSuggestions(new Pagination({ size: 2 }), '', [])
      return response.data
    } catch (e) {
      handleError(e, 'prompts.error.invoke-prompt')
    }
  }

  function resetActivePrompt() {
    activePromptId.value = null
    promptText.value = ''
  }

  return {
    promptSuggestions,
    openPromptSidebar,
    openPromptLibrary,
    openPromptCreateSidebar,
    selectedPrompt,
    promptTags,
    promptText,
    activePromptId,
    fetchPromptSuggestions,
    goBackToLibrary,
    createPrompt,
    updatePrompt,
    deletePrompt,
    openSidebar,
    openCreateForm,
    openEditForm,
    closeSidebar,
    fetchPromptTags,
    createTag,
    deleteTag,
    handleInsertPrompt,
    invokePromptSuggestion,
    resetActivePrompt,
    replaceFilePlaceholders
  }
})
