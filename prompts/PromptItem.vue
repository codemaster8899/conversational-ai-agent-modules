<script lang="ts" setup>
import TsaiTag from '@/components/TsaiTag.vue'
import { useAuthStore } from '@/stores/auth'
import { usePromptsStore } from '@/stores/prompts'
import type { Prompt } from '@/types/prompts'
import * as PhosphorIcons from '@phosphor-icons/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  prompt: Prompt
}>()

const { t } = useI18n()
const promptsStore = usePromptsStore()
const authStore = useAuthStore()

const { openEditForm, handleInsertPrompt } = promptsStore

const scopesList = computed(() => {
  return authStore.user?.scopes.split(',')
})

const allowCreate = computed(
  () => scopesList.value?.includes('*') || scopesList.value?.includes('agent_llm_profile')
)
</script>

<template>
  <div
    class="prompt-item"
    role="article"
    :aria-label="prompt.title"
    tabindex="0"
    @click="handleInsertPrompt(prompt)">
    <div class="top">
      <component :is="PhosphorIcons[`Ph${prompt.icon}`]"></component>
      <span class="title">{{ prompt.title }}</span>
    </div>
    <div class="content">{{ prompt.description }}</div>
    <div class="footer">
      <div
        class="tags"
        v-if="prompt.tags && prompt.tags.length">
        <TsaiTag
          v-for="tag in prompt.tags.slice(0, 2)"
          :key="tag.id"
          :tag="tag" />
      </div>
      <div class="count">{{ t('prompts.library.invocation_count', prompt.invocation_count) }}</div>
    </div>
    <PhosphorIcons.PhPencilSimple
      v-if="allowCreate"
      role="button"
      :size="18"
      class="edit-icon"
      @click.stop="openEditForm(prompt)" />
  </div>
</template>

<style lang="scss" scoped>
.prompt-item {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 260px;
  min-width: 220px;
  height: 140px;
  padding: 15px 16px;
  align-items: flex-start;
  align-content: flex-start;
  gap: 6px 3px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: var(--color-background);
  box-shadow: 0px 3px 4px 0px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.prompt-item:hover {
  .edit-icon {
    display: block;
  }
}

.top {
  width: 100%;
  display: flex;
  align-items: center;
  column-gap: 6px;
}

.title {
  max-width: calc(100% - 26px);
  font-family: Poppins;
  font-size: 14px;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Limits to 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content {
  font-family: Mulish;
  font-size: 11px;
  font-weight: 500;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Limits to 2 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tags {
  max-width: 70%;
  display: flex;
  align-items: center;
  column-gap: 3px;
}

.tag {
  height: 18px;
  padding: 0px 7px;
  border-radius: 34px;
  font-family: 'Poltawski Nowy';
  font-size: 11px;
}

.footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.count {
  color: var(--color-light-grey);
  text-align: right;
  font-family: Mulish;
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
}

.edit-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  cursor: pointer;
  display: none;
}
</style>
