<script lang="ts" setup>
import PromptForm from '@/components/prompts/PromptForm.vue'
import PromptLibrary from '@/components/prompts/PromptLibrary.vue'
import { usePromptsStore } from '@/stores/prompts'
import { vOnClickOutside } from '@vueuse/components'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import VueResizable from 'vue-resizable/dist/vue-resizable.umd'

const screenWidth = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1200)
const maxWidth = 1200
const minWidth =
  typeof window !== 'undefined' ? (window.innerWidth < 460 ? window.innerWidth : 460) : 460
const initialWidth = 780
const isNarrow = ref(false)
const promptsStore = usePromptsStore()
const { openPromptSidebar, openPromptCreateSidebar, openPromptLibrary } = storeToRefs(promptsStore)
const { closeSidebar } = promptsStore

onMounted(async () => {
  window.addEventListener('resize', setScreenWidth)
})

onUnmounted(() => window.removeEventListener('resize', setScreenWidth))

const setScreenWidth = () => {
  screenWidth.value = window.innerWidth
  isNarrow.value = window.innerWidth <= 540
}

const setIsNarrow = (e: { left: number; top: number; width: number; height: number }) => {
  isNarrow.value = e.width <= 540
}

const width = computed(() => {
  if (screenWidth.value > initialWidth + 144) return initialWidth
  if (screenWidth.value < 650) return screenWidth.value
  return screenWidth.value - 144
})

const left = computed(() => {
  return Math.abs(screenWidth.value - Math.min(maxWidth, width.value))
})
</script>

<template>
  <div
    v-if="openPromptSidebar"
    aria-label="Prompt Sidebar"
    class="wrapper">
    <VueResizable
      v-on-click-outside="closeSidebar"
      :active="['l']"
      :fit-parent="true"
      :left="left"
      :max-width="maxWidth"
      :min-width="minWidth"
      :right="0"
      :width="width"
      class="resizable"
      @mount="setIsNarrow"
      @resize:move="setIsNarrow">
      <div
        :class="{ narrow: isNarrow }"
        class="content">
        <PromptLibrary v-if="openPromptLibrary" />
        <PromptForm v-if="openPromptCreateSidebar" />
      </div>
    </VueResizable>
  </div>
</template>

<style lang="scss" scoped>
.wrapper {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  bottom: 0;
  z-index: 1000;
  transition: 600ms;
  pointer-events: none;
}

.v-enter-from {
  transform: translateX(100%);
}

.v-leave-to {
  transform: translateX(100%);
}

.resizable {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 34px 40px;
  background-color: var(--color-background);
  border-radius: 30px 0 0 30px;
  box-shadow: -8px 0 15px rgba(0, 0, 0, 0.15);
  height: 100%;
  right: 0;
}

.content {
  height: 100%;
  width: 100%;
  overflow-y: visible;
  pointer-events: all;
}

:deep(.resizable-l) {
  top: 56px !important;
  left: -14px !important;
  height: 32px !important;
  width: 32px !important;
  padding: 0 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 26px !important;
  border-radius: 100% !important;
  background-color: var(--color-background) !important;
  pointer-events: all;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));

  &::before,
  &::after {
    content: '';
    display: block;
    box-sizing: border-box;
    position: absolute;
    width: 10px;
    height: 10px;
    color: #b7b7b7;
  }

  &::before {
    border-bottom: 2px solid;
    border-left: 2px solid;
    transform: rotate(45deg);
    left: 6px;
    top: 10px;
  }

  &::after {
    border-bottom: 2px solid;
    border-right: 2px solid;
    transform: rotate(-45deg);
    right: 6px;
    top: 10px;
  }
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
  margin-top: 33px;
  gap: 16px;
  height: calc(100% - 168px);
  overflow-y: auto;
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
  .resizable {
    padding: 20px;
    border-radius: 0;
  }
  :deep(.resizable-l) {
    display: none !important;
  }
}
</style>
