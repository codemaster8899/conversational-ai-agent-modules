<script lang="ts" setup>
import SettingsLabel from '@/components/form/SettingsLabel.vue'
import TsaiDropdown from '@/components/form/TsaiDropdown.vue'
import { PROMPT_ICONS_OPTIONS } from '@/constants'
import { usePromptsStore } from '@/stores/prompts'
import { DropdownOption } from '@/types/internal'
import { type PromptPayload } from '@/types/prompts'
import { PhArrowLeft, PhX } from '@phosphor-icons/vue'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue3-toastify'

const { t } = useI18n()
const promptsStore = usePromptsStore()
const { selectedPrompt, promptSuggestions, promptTags } = storeToRefs(promptsStore)
const {
  createPrompt,
  updatePrompt,
  deletePrompt,
  fetchPromptTags,
  createTag,
  deleteTag,
  goBackToLibrary
} = promptsStore

const isNarrow = ref<boolean>(window.matchMedia('(max-width: 540px)').matches)
const promptData = ref<PromptPayload>({
  title: '',
  description: '',
  content: '',
  icon: '',
  tag_ids: []
})
const promptId = ref<string | null>(null)
const selectedIcon = ref<DropdownOption | null>(null)
const selectedTags = ref<DropdownOption[]>([])

const updateScreenSize = () => {
  isNarrow.value = window.matchMedia('(max-width: 540px)').matches
}

let resizeTimeout: number
const debouncedResizeHandler = () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(updateScreenSize, 200)
}

onMounted(async () => {
  window.addEventListener('resize', debouncedResizeHandler)
  await fetchPromptTags()
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResizeHandler)
})

watchEffect(() => {
  if (!selectedPrompt.value) return

  const {
    title = '',
    description = '',
    content = '',
    icon = '',
    tags = [],
    id
  } = selectedPrompt.value
  promptData.value = { title, description, content, icon, tag_ids: tags.map((t) => t.id) }
  selectedIcon.value = icon ? PROMPT_ICONS_OPTIONS.find((v) => v.value === icon) : null
  selectedTags.value = tags.map(({ name, id, color }) => ({ label: name, value: id, color }))
  promptId.value = id
})

const tags = computed(
  () => promptTags.value?.map(({ name, id, color }) => ({ label: name, value: id, color })) ?? []
)

const handleClose = () => goBackToLibrary()

const updateSelectedIcon = (value: DropdownOption | null) => {
  selectedIcon.value = value
  promptData.value.icon = value?.value ?? null
}

const handleSubmit = () => {
  if (!promptData.value.title || !promptData.value.content) {
    toast(t('prompts.error.required-fields'), {
      type: 'error'
    })
    return
  }

  if (promptId.value) {
    updatePrompt(promptId.value, promptData.value)
  } else {
    createPrompt(promptData.value)
  }
}

const updateSelectedTag = (val: DropdownOption[]) => {
  if (val.length > 2) {
    toast(t('prompts.library.form.max-tags'), {
      type: 'warning'
    })
    return
  }
  selectedTags.value = val
  promptData.value.tag_ids = val.map((t) => t.value)
}

const addTag = async (val: string) => {
  if (selectedTags.value.length > 1) {
    toast(t('prompts.library.form.max-tags'), {
      type: 'warning'
    })
    return
  }

  const newTag = await createTag({ name: val })
  selectedTags.value.push({ label: newTag.name, value: newTag.id, color: newTag.color })
  promptData.value.tag_ids = selectedTags.value.map((t) => t.value)
}

const removeTag = async (option: DropdownOption) => {
  await deleteTag(option.value)
  selectedTags.value = selectedTags.value.filter((tag) => tag.value !== option.value)
}
</script>

<template>
  <div class="prompt-form">
    <div class="top">
      <div class="title-wrapper">
        <PhArrowLeft
          v-if="promptSuggestions.length"
          :size="24"
          style="cursor: pointer"
          @click="handleClose" />
        <p class="title">{{ t('prompts.library.create.title') }}</p>
      </div>
      <button
        class="close-btn"
        data-testID="close-btn"
        @click="handleClose">
        <PhX size="21" />
      </button>
    </div>
    <div class="form-content">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="promptName">{{ t('prompts.library.form.name-label') }}</label>
          <input
            id="promptName"
            v-model="promptData.title"
            :aria-invalid="!promptData.title"
            :placeholder="t('prompts.library.form.name-placeholder')"
            aria-required="true"
            class="tsai-input"
            type="text" />
        </div>

        <div class="form-group">
          <label for="description">{{ t('prompts.library.form.description-label') }}</label>
          <textarea
            id="description"
            v-model="promptData.description"
            :placeholder="t('prompts.library.form.description-placeholder')"
            class="tsai-input"></textarea>
        </div>

        <div class="form-group">
          <label for="content">{{ t('prompts.library.form.content-label') }}</label>
          <div
            v-pre
            style="color: #666; font-size: 12px; margin-bottom: 15px">
            Sie können reservierte Variablen, wie z.B. <code>{{ _name }}</code> in Ihrem Prompt
            verwenden. <br />
            Reservierte Variablen sind:
            <code>{{ _name }}</code
            >, <code>{{ _username }}</code
            >, <code>{{ _date }}</code
            >, <code>{{ _time }}</code
            >, <code>{{ _file_ }}</code
            >. <br />
            Diese werden bei Verwendung mit dem jeweiligen Wert, z.B. dem aktuellen Benutzernamen,
            ausgetauscht.
          </div>
          <textarea
            id="content"
            v-model="promptData.content"
            :placeholder="t('prompts.library.form.content-placeholder')"
            aria-required="true"
            class="tsai-input"></textarea>
        </div>

        <div class="flex gap-3">
          <div
            class="form-group"
            style="width: 50%">
            <SettingsLabel label-title="prompts.library.form.icon-label" />

            <TsaiDropdown
              :disableLabels="true"
              :modelValue="selectedIcon"
              :options="PROMPT_ICONS_OPTIONS"
              :placeholder="t('prompts.library.form.icon-placeholder')"
              @update:model-value="updateSelectedIcon" />
          </div>

          <div
            class="form-group"
            style="width: 50%">
            <SettingsLabel label-title="prompts.library.form.tags-label" />
            <TsaiDropdown
              :disableLabels="true"
              :isMultiple="true"
              :isRemovable="true"
              :modelValue="selectedTags"
              :options="tags"
              :placeholder="t('prompts.library.form.tags-placeholder')"
              :searchable="true"
              :showSelectedItems="true"
              :taggable="true"
              @remove="removeTag"
              @tag="addTag"
              @update:model-value="updateSelectedTag" />
          </div>
        </div>

        <div class="form-btns">
          <button
            class="tsai-button primary"
            @click.prevent="handleSubmit">
            {{
              selectedPrompt
                ? t('prompts.library.form.edit-action')
                : t('prompts.library.form.create-action')
            }}
          </button>
          <button
            v-if="promptId"
            class="tsai-button secondary icon-only"
            role="button"
            type="button"
            @click="deletePrompt(promptId)">
            <span style="color: var(--color-red)">{{
              t('prompts.library.form.delete-action')
            }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.prompt-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.content {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  pointer-events: all;
}

.form-content {
  padding: 0px 2px;
}

.top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.title-wrapper {
  display: flex;
  align-items: center;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin-left: 12px;
}

.search-filter {
  display: flex;
  align-items: center;
  gap: 5px;
}

.search-input {
  min-width: auto;
}

.search-input.focused-input {
  max-width: 49%;
}

.filter-tags {
  flex-grow: 1;
  max-width: 49%;
  margin-bottom: 0;

  & :deep(.multiselect__tags) {
    border-radius: 25px;
    height: 44px;
    padding: 4px 12px;
  }
}

:deep(.multiselect__tags) {
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 5px;
}

:deep(.multiselect__input) {
  margin-bottom: 0;
}

.prompt-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 260px));
  grid-template-rows: max-content;
  margin-top: 33px;
  gap: 16px;
  height: calc(100% - 168px);
  overflow-y: auto;
}

.pagination-container {
  align-items: center;
}

.form-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-btn {
  background-color: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}

.close-btn i {
  --ggs: 0.95;
}
</style>
