<script lang="ts" setup>
import DefaultPagination from '@/components/DefaultPagination.vue'
import TsaiDropdown from '@/components/form/TsaiDropdown.vue'
import TsaiSearch from '@/components/form/TsaiSearch.vue'
import InTitleAddButton from '@/components/InTitleAddButton.vue'
import PromptItem from '@/components/prompts/PromptItem.vue'
import { useAuthStore } from '@/stores/auth'
import { usePromptsStore } from '@/stores/prompts'
import type { DropdownOption } from '@/types/internal'
import { Pagination } from '@/types/pagination'
import type { Prompt } from '@/types/prompts'
import { PhBooks, PhX } from '@phosphor-icons/vue'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const screenWidth = ref<number>(window.innerWidth)
const isNarrow = ref(false)
const searchQuery = ref('')
const authStore = useAuthStore()
const promptsStore = usePromptsStore()
const { promptSuggestions, promptTags } = storeToRefs(promptsStore)
const defaultPaginationComponent = ref()
const selectedTags = ref<DropdownOption[]>([])
const prompts = computed(() => promptSuggestions.value || [])

onMounted(async () => {
  window.addEventListener('resize', setScreenWidth)

  if (!promptTags.value.length) {
    await promptsStore.fetchPromptTags()
  }
})

onUnmounted(() => window.removeEventListener('resize', setScreenWidth))

const tags = computed(() =>
  promptTags.value.map(({ name, id, color }) => ({ label: name, value: id, color }))
)

const filterTags = computed(() => selectedTags.value.map((t) => t.label) || [])

const setScreenWidth = () => {
  screenWidth.value = window.innerWidth
  isNarrow.value = window.innerWidth <= 540
}

const handleClose = () => {
  promptsStore.closeSidebar()
}

const fetchMethod = (pagination: Pagination<Prompt>) => {
  return promptsStore.fetchPromptSuggestions(pagination, searchQuery.value, filterTags.value)
}

const scopesList = computed(() => {
  return authStore.user?.scopes.split(',')
})

const allowCreate = computed(
  () => scopesList.value?.includes('*') || scopesList.value?.includes('agent_llm_profile')
)

watch(
  () => searchQuery.value,
  async () => {
    defaultPaginationComponent.value.resetPagination()
  }
)

watch(
  () => selectedTags.value,
  async () => {
    defaultPaginationComponent.value.resetPagination()
  }
)
</script>

<template>
  <div class="prompt-library">
    <div class="top">
      <div class="title-wrapper">
        <PhBooks :size="36" />
        <p class="title">{{ t('prompts.library.title') }}</p>
        <InTitleAddButton
          v-if="allowCreate"
          class="add-btn"
          @click="promptsStore.openCreateForm()" />
      </div>
      <button
        class="close-btn"
        data-testID="close-btn"
        @click="handleClose">
        <PhX size="21" />
      </button>
    </div>
    <div class="search-filter">
      <TsaiSearch
        v-model="searchQuery"
        :is-opened="true"
        :placeholder="t('prompts.library.search')"
        class="search-section">
      </TsaiSearch>
      <TsaiDropdown
        v-model="selectedTags"
        :disableLabels="true"
        :isMultiple="true"
        :options="tags"
        :placeholder="t('prompts.library.filter')"
        :showSelectedItems="true"
        openDirection="bottom"
        class="filter-tags" />
    </div>
    <div class="prompt-items_wrapper">
      <div class="prompt-items">
        <PromptItem
          v-for="prompt in prompts"
          :key="prompt.id"
          :prompt="prompt" />
      </div>
    </div>
    <DefaultPagination
      ref="defaultPaginationComponent"
      :fetch-method="fetchMethod"
      :page-size="10"></DefaultPagination>
  </div>
</template>

<style lang="scss" scoped>
.prompt-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.content {
  height: 100%;
  width: 100%;
  overflow-y: visible;
  pointer-events: all;
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
    display: flex;
    align-items: center;
  }
}

.prompt-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 260px));
  grid-template-rows: max-content;
  gap: 16px;

  &_wrapper {
    margin-top: 33px;
    flex-grow: 1;
    overflow-y: auto;
    padding-bottom: 10px;
  }
}

.pagination-container {
  align-items: center;
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

@include breakpoint-down(md) {
  .title {
    margin-right: 12px;
  }
}
</style>
