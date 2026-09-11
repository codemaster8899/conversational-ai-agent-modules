<script lang="ts" setup>
import AgentPreviewBox from '@/components/AgentPreviewBox.vue'
import ShareChatbot from '@/components/ShareChatbot.vue'
import TsaiSelect from '@/components/TsaiSelect.vue'
import SettingsLabel from '@/components/form/SettingsLabel.vue'
import TsaiCheckbox from '@/components/form/TsaiCheckbox.vue'
import TsaiColorPicker from '@/components/form/TsaiColorPicker.vue'
import TsaiDropdown from '@/components/form/TsaiDropdown.vue'
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal.vue'
import FileSelectorModal from '@/components/modals/FileSelectorModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatbotsStore } from '@/stores/chatbots'
import { AgentType, type CreateBasicAgent } from '@/types/agent'
import type { DropdownOption } from '@/types/internal'
import { type LLM, LLMSize } from '@/types/settings.ts'
import { handleError } from '@/utils/error'
import { generateRandomColor } from '@/utils/generateRandomColor'
import {
  PhChatsCircle,
  PhDetective,
  PhFileText,
  PhHeadCircuit,
  PhQuotes,
  PhResize,
  PhTrash
} from '@phosphor-icons/vue'
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useModal, type UseModalReturnType } from 'vue-final-modal'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LogoIconWithLoading from '@/components/LogoIconWithLoading.vue'

const nameMaxLength = 120

const { t } = useI18n()
// Stores & Router
const chatbotStore = useChatbotsStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Form state
const chatbotId = ref<string>('')
const chatbotName = ref<string>('')
const description = ref<string>('')
const firstMessage = ref<string>('')
const systemPrompt = ref<string>('')
const files = ref<string[]>([])
const color = ref<string>(generateRandomColor())
const citationMode = ref<boolean>(true)
const anonymizationMode = ref<boolean>(false)
const followUpQuestionsMode = ref<boolean>(false)

const isEditMode = computed(() => !!route.params.id)
const i18n = useI18n()

let modal: UseModalReturnType<unknown>
let deleteChatbotModal: UseModalReturnType<unknown>
const llms = ref<DropdownOption[]>([])
const llmSizeOptions = ref<DropdownOption[]>([
  { label: LLMSize.S, value: LLMSize.S },
  { label: LLMSize.M, value: LLMSize.M },
  { label: LLMSize.L, value: LLMSize.L }
])

const selectedLLM = ref<DropdownOption | null>(null)
const selectedLLMSize = ref<DropdownOption | null>(null)
const tab = ref<'general' | 'personalization'>('general')
const isLoading = ref<boolean>(false)
const isFetchingChatbot = ref<boolean>(false)

const openSelectorModal = () => {
  const modal = useModal({
    component: FileSelectorModal,
    attrs: {
      title: i18n.t('chatbot.form.file-modal.title'),
      preselectedFiles: files.value as string[],
      onConfirm(selectedFiles) {
        files.value = selectedFiles
        modal.close()
      },
      onClose() {
        modal.close()
      }
    },
    slots: {
      default: '<small>' + i18n.t('chatbot.form.file-modal.description') + '</small>'
    }
  })
  modal.open()
}

const nameError = computed(() => {
  return chatbotName.value.length > nameMaxLength
})

const canManageLLMProfiles = computed(() => {
  return scopesList.value?.includes('*') || scopesList.value?.includes('agent_llm_profile')
})

const updateLLM = (v: DropdownOption | null) => {
  selectedLLM.value = v

  if (!v) {
    selectedLLMSize.value = null
  } else if (!selectedLLMSize.value) {
    selectedLLMSize.value = llmSizeOptions.value[0]
  }
}

//Scopes
const scopesList = computed(() => {
  return authStore.user?.scopes.split(',')
})

onMounted(async () => {
  if (isEditMode.value) {
    chatbotId.value = route.params.id as string
    try {
      isFetchingChatbot.value = true
      const chatbot = await chatbotStore.getChatbotById(chatbotId.value)
      if (chatbot) {
        chatbotName.value = chatbot.name
        description.value = chatbot.description
        systemPrompt.value = chatbot.system_prompt
        files.value = chatbot.files.map((f) => (typeof f === 'string' ? f : f.id))
        color.value = chatbot.color
        citationMode.value = chatbot.citations_mode
        selectedLLM.value = chatbot.llm_profile
          ? { label: chatbot.llm_profile.display_name, value: chatbot.llm_profile.id }
          : null

        selectedLLMSize.value = chatbot.llm_model_size
          ? llmSizeOptions.value.find((v) => v.value === chatbot.llm_model_size) || null
          : null

        anonymizationMode.value = chatbot.anonymization
        firstMessage.value = chatbot.first_message_content
        followUpQuestionsMode.value = chatbot.follow_up_questions_mode
        // Set other fields as needed
      }
    } catch (error) {
      handleError(error, 'chatbots.toasts.chatbot-loading-failed')
    } finally {
      isFetchingChatbot.value = false
    }
  } else {
    systemPrompt.value = t('chatbot.form.system-prompt-sample')
  }

  modal = useModal({
    component: FileSelectorModal,
    attrs: {
      title: computed(() => i18n.t('chatbot.form.file-modal.title')).value,
      preselectedFiles: files.value as string[],
      onConfirm(selectedFiles) {
        files.value = selectedFiles
        modal.close()
      },
      onClose() {
        modal.close()
      }
    },
    slots: {
      default: '<small>' + i18n.t('chatbot.form.file-modal.description') + '</small>'
    }
  })
  deleteChatbotModal = useModal({
    component: DeleteConfirmModal,
    attrs: {
      title: i18n.t('chatbot.form.delete-modal.title'),
      text: i18n.t('chatbot.form.delete-modal.description', {
        chatName: chatbotName.value
      }),
      onConfirm() {
        chatbotStore.deleteChatbot(chatbotId.value).then(() => {
          deleteChatbotModal.close()
          router.push({ name: 'chatbots-list' })
        })
      },
      onClose() {
        deleteChatbotModal.close()
      }
    }
  })
  ;(await axios.get<LLM[]>('/api/llms')).data.forEach((llm) => {
    llms.value.push({ value: llm.id, label: llm.display_name, default_size: llm.default_size })
  })
})

const isFormValid = computed(() => {
  return chatbotName.value && description.value && systemPrompt.value && !nameError.value
})

const createChatBot = async (chatbot: CreateBasicAgent) => {
  try {
    if (canManageLLMProfiles.value) {
      await chatbotStore.createChatbotWithLLM(chatbot, {
        llm_profile_id: selectedLLM.value?.value,
        llm_model_size: selectedLLMSize.value?.value
      })
    } else {
      await chatbotStore.createChatBot(chatbot)
    }
  } catch (error) {
    console.error('Error creating chatbot:', error)
  }
}

const updateChatbot = async (chatbotId: string, chatbot: CreateBasicAgent) => {
  try {
    const promises = [chatbotStore.updateChatbot(chatbotId, chatbot)]

    if (canManageLLMProfiles.value) {
      promises.push(
        chatbotStore.updateChatbotLLMProfile(
          chatbotId,
          selectedLLM.value?.value || null,
          selectedLLMSize.value?.value || null
        )
      )
    }

    await Promise.all(promises)
  } catch (error) {
    console.error('Error updating chatbot:', error)
  }
}

// Function to handle form submission
const handleSubmit = async (event: Event) => {
  event.preventDefault()

  if (!isFormValid.value) return

  const chatbot: CreateBasicAgent = {
    name: chatbotName.value,
    description: description.value,
    system_prompt: systemPrompt.value,
    files: files.value as string[],
    color: color.value,
    citations_mode: citationMode.value,
    icon: 'default',
    anonymization: anonymizationMode.value,
    first_message_content: firstMessage.value,
    follow_up_questions_mode: followUpQuestionsMode.value
  }

  // Ensure LLM size is set if LLM is selected
  if (selectedLLM.value && !selectedLLMSize.value) {
    const llm = llms.value.find((llm) => llm.value === selectedLLM.value)
    const defaultSize = llm.value
    selectedLLMSize.value =
      llmSizeOptions.value.find((option) => option.value === defaultSize) || null
  }

  isLoading.value = true

  try {
    if (isEditMode.value) {
      await updateChatbot(chatbotId.value, chatbot)
    } else {
      await createChatBot(chatbot)
    }

    await router.push({ name: 'chatbots-list' })
    isLoading.value = false
  } catch (error) {
    console.error(`Failed to ${isEditMode.value ? 'update' : 'create'} chatbot:`, error)
  }
}
</script>

<template>
  <main class="create-chatbot-view">
    <div class="view-title">
      <LogoIconWithLoading />
      <h1 v-if="!isEditMode">{{ t('chatbot.create-title') }}</h1>
      <h1 v-else>{{ t('chatbot.edit-title') }}</h1>
    </div>
    <p class="view-description">
      {{ t('chatbot.form.intro') }}
    </p>

    <div class="tabs mt-3">
      <button
        :class="{ active: tab === 'general' }"
        class="tab"
        @click="tab = 'general'">
        {{ t('chatbot.form.general-tab') }}
      </button>
      <button
        :class="{ active: tab === 'personalization' }"
        class="tab"
        @click="tab = 'personalization'">
        {{ t('chatbot.form.personalize-tab') }}
      </button>
    </div>

    <div
      v-if="tab === 'general'"
      class="form">
      <div class="first-col">
        <div class="form-group">
          <label for="chatbotName">{{ t('chatbot.form.name-label') }}</label>
          <input
            id="chatbotName"
            v-model="chatbotName"
            :placeholder="t('chatbot.form.name-placeholder')"
            class="tsai-input"
            type="text" />
          <p
            v-if="nameError"
            class="error-msg">
            {{ t('chatbot.form.name-error', { nameMaxLength }) }}
          </p>
        </div>

        <div class="form-group">
          <label for="description">{{ t('chatbot.form.description-label') }}</label>
          <textarea
            id="description"
            v-model="description"
            :placeholder="t('chatbot.form.description-placeholder')"
            class="tsai-input"></textarea>
        </div>

        <div
          class="form-group"
          style="margin-bottom: 32px">
          <label for="systemPrompt">{{ t('chatbot.form.system-prompt-label') }}</label>
          <textarea
            id="systemPrompt"
            v-model="systemPrompt"
            :placeholder="t('chatbot.form.system-prompt-placeholder')"
            class="tsai-input"
            style="min-height: 180px"></textarea>
        </div>

        <div class="files-buttons">
          <button
            class="tsai-button with-icon file-select-button"
            role="button"
            type="button"
            @click="openSelectorModal">
            <PhFileText size="21" />
            {{ t('chatbot.form.connect-files') }}
          </button>
          <p>{{ t('chatbot.form.connected-files', files.length) }}</p>
        </div>
      </div>

      <div class="second-col">
        <div
          class="form-group"
          style="margin-bottom: 10px">
          <label>{{ t('chatbot.form.preview-label') }}</label>
          <AgentPreviewBox
            v-if="!isFetchingChatbot"
            :agentType="AgentType.RAG"
            :color="color"
            :description="description"
            :title="chatbotName" />
        </div>

        <div
          class="form-group"
          style="margin-bottom: 5px">
          <TsaiColorPicker v-model="color" />
        </div>

        <div
          v-if="canManageLLMProfiles"
          class="form-group"
          style="margin-bottom: 20px">
          <SettingsLabel
            :icon="PhHeadCircuit"
            label-title="settings.llm-label" />

          <TsaiDropdown
            :disableLabels="true"
            :icon="PhHeadCircuit"
            :modelValue="selectedLLM"
            :options="Object.values(llms)"
            style="margin-left: 24px"
            @update:model-value="updateLLM" />

          <TsaiSelect
            v-model="selectedLLMSize"
            :icon="PhResize"
            :options="llmSizeOptions"
            style="margin-left: 24px"></TsaiSelect>
        </div>

        <div
          class="form-group"
          style="margin-bottom: 5px">
          <SettingsLabel
            :icon="PhQuotes"
            label-title="chatbot.form.citation-mode-label"
            style="margin-bottom: 0" />
          <small style="margin-left: 24px">{{ t('chatbot.form.citation-mode-description') }}</small>
          <TsaiCheckbox
            v-model="citationMode"
            :title="t('chatbot.form.checkbox-label-citation-mode-enabled')"
            style="margin-top: 0.5rem; margin-left: 24px" />
        </div>

        <div
          class="form-group"
          style="margin-bottom: 5px">
          <SettingsLabel
            :icon="PhDetective"
            label-title="chatbot.form.anonymization-mode-label"
            style="margin-bottom: 0" />
          <small style="margin-left: 24px">{{
            t('chatbot.form.anonymization-mode-description')
          }}</small>
          <TsaiCheckbox
            v-model="anonymizationMode"
            :title="t('chatbot.form.checkbox-label-anonymization-mode-enabled')"
            style="margin-top: 0.5rem; margin-left: 24px" />
        </div>

        <ShareChatbot v-if="isEditMode" />
      </div>
    </div>
    <div
      v-else-if="tab === 'personalization'"
      class="form">
      <div class="first-col">
        <div class="form-group">
          <label for="first-message">{{ t('chatbot.form.first-message-label') }}</label>
          <textarea
            id="first-message"
            v-model="firstMessage"
            :placeholder="t('chatbot.form.first-message-placeholder')"
            class="tsai-input"></textarea>
        </div>
      </div>

      <div class="second-col">
        <div
          class="form-group"
          style="margin-bottom: 5px">
          <SettingsLabel
            :icon="PhChatsCircle"
            label-title="chatbot.form.follow-up-questions-mode-label"
            style="margin-bottom: 0" />
          <small style="margin-left: 24px">{{
            t('chatbot.form.follow-up-questions-mode-description')
          }}</small>
          <TsaiCheckbox
            v-model="followUpQuestionsMode"
            :title="t('chatbot.form.checkbox-follow-up-questions-mode-enabled')"
            style="margin-top: 0.5rem; margin-left: 24px" />
        </div>
      </div>
    </div>
    <div class="button-section large">
      <button
        :disabled="!isFormValid || isLoading"
        class="tsai-button primary large"
        role="button"
        type="submit"
        @click="handleSubmit">
        {{ isEditMode ? t('chatbot.form.save-action') : t('chatbot.form.create-action') }}
      </button>
      <button
        class="tsai-button secondary large"
        role="button"
        type="button"
        @click="router.push({ name: 'chatbots-list' })">
        {{ t('chatbot.form.cancel-action') }}
      </button>
      <button
        v-if="isEditMode"
        class="tsai-button secondary large icon-only"
        role="button"
        type="button"
        @click="deleteChatbotModal.open()">
        <PhTrash
          color="var(--color-red)"
          size="21"
          weight="bold" />
      </button>
    </div>
  </main>
</template>

<style lang="scss" scoped>
main {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 84px);
}

.form {
  display: flex;
  justify-content: space-between;
  gap: 4rem;
  max-width: 1110px;
  padding-left: 2px;
  flex-grow: 1;

  #first-message {
    min-height: 100px;
  }
}

.tabs {
  min-height: 50px;
  margin-bottom: 30px;
}

.first-col {
  flex-grow: 1;
  max-width: 644px;
}

.second-col {
  width: 234px;
  max-width: 234px;
}

.second-col .chatbot-preview-box {
  width: 100%;
}

.files-buttons {
  display: flex;
  align-items: center;
  font-family: Mulish, sans-serif;
  margin-bottom: 32px;
}

.files-buttons p {
  margin-left: 1rem;
  white-space: nowrap;
}

.files-buttons button {
  flex-shrink: 0;
  white-space: nowrap;
}

.file-select-button {
  background: linear-gradient(225deg, var(--color-primary) 1.38%, var(--color-primary-dark) 98.62%);
  padding: 14px 27px;
  font-weight: 600;
  font-family: Mulish, sans-serif;
}

.tsai-button.icon-only {
  display: flex;
  justify-content: center;
  align-items: center;
}

@include breakpoint-down(lg) {
  .form {
    flex-direction: column;
    justify-content: flex-start;
    gap: 14px;
  }

  .first-col {
    flex-grow: 0;
  }
}

@include breakpoint-down(md) {
  .form-group {
    margin-bottom: 20px;
  }
}

@include breakpoint-down(sm) {
  .second-col {
    width: 100%;
    max-width: 100%;
  }

  .form {
    margin-top: 10px;
  }

  .files-buttons {
    flex-direction: column-reverse;
    gap: 20px;
    align-items: flex-start;
  }
  .files-buttons p {
    margin-left: 0;
  }
}

@include breakpoint-between(lg, xl) {
  .first-col {
    max-width: 400px;
  }
}
</style>
