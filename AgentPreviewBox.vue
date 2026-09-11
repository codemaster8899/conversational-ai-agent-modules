^
<script lang="ts" setup>
import AdvancedAgentsBg from '@/assets/img/advanced-agent.svg'
import { useMobileDetection } from '@/composables/useMobileDetection'
import { useAuthStore } from '@/stores/auth'
import { type AgentIndividual, AgentType } from '@/types/agent'
import { PhLink, PhNotePencil, PhUsers } from '@phosphor-icons/vue'
import tinycolor from 'tinycolor2'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Tippy } from 'vue-tippy'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    chatbot_id?: string
    color?: string
    owner_id?: string
    title?: string
    description?: string
    fileCount?: number | null //null if there cannot be files -> advancedAgent?
    individuals?: AgentIndividual[]
    agentType?: AgentType | null
  }>(),
  {
    color: '#fcbdbd',
    title: 'Bot',
    description: 'Sample description',
    fileCount: 0,
    agentType: AgentType.RAG
  }
)

const { isTouchDevice } = useMobileDetection()
const { user } = useAuthStore()
const router = useRouter()
const i18n = useI18n()
const chatbotTitleRef = ref<Element>()
const showTooltip = computed(() => {
  const titleClientWidth = chatbotTitleRef?.value?.children?.item(0)?.clientWidth
  const titleScrollWidth = chatbotTitleRef?.value?.children?.item(0)?.scrollWidth
  if (titleScrollWidth && titleClientWidth) {
    return titleScrollWidth > titleClientWidth
  }
  return false
})
const fontColor = computed(() => (tinycolor(props.color).isDark() ? '#fff' : '#000'))
const lightenedColor = computed(() => tinycolor(props.color).lighten(4).toHexString())
const darkenedColor1 = computed(() => tinycolor(props.color).darken(4).toHexString())
const darkenedColor2 = computed(() => tinycolor(lightenedColor.value).darken(4).toHexString())
const darkenedBorderColor = computed(() => tinycolor(props.color).darken(7).toHexString())
const gradientBackground = computed(
  () => `linear-gradient(251deg, ${lightenedColor.value}, ${props.color})`
)
const hoverGradientBackground = computed(
  () => `linear-gradient(251deg, ${darkenedColor2.value}, ${darkenedColor1.value})`
)
const advancedAgentBgColor = computed(() => {
  // Extract the lighter color from the gradient (lightenedColor in this case)
  const baseColor = tinycolor(lightenedColor.value).toHexString()
  return tinycolor(baseColor).brighten(50).toString()
})
const isSharedWithCurrentUser = computed(() => {
  let isShared = false
  if (props.individuals) {
    for (const individual of props.individuals) {
      if (individual.username === user?.username) {
        isShared = true
      }
    }
  }
  return isShared
})

function getPositionForAgentName(agentName: string = ''): {
  top: string
  left: string
  position: string
} {
  let hash = 0
  for (let i = 0; i < agentName.length; i++) {
    hash = agentName.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Use the hash to generate consistent `top` and `left` values
  const normalizedHash = Math.abs(hash) // Ensure positive value
  const top = `${(normalizedHash % 50) + 25}%` // Centered: range [25%, 75%]
  const left = `${((normalizedHash / 50) % 50) + 5}%` // Centered: range [25%, 75%]

  return {
    top,
    left,
    position: 'absolute'
  }
}

const advancedAgentBgPosition = computed(() => getPositionForAgentName(props.title))

const isHovering = ref(false)
const canBeEdited = computed(() => {
  return user?.id === props.owner_id
})

function edit() {
  if (props.agentType !== AgentType.AGENTIC) {
    router.push({ name: 'chatbots-edit', params: { id: props.chatbot_id } })
  } else {
    router.push({ name: 'advanced-agents-edit', params: { id: props.chatbot_id } })
  }
}
</script>

<template>
  <div class="chatbot-preview-box__wrapper cbpb-default">
    <div
      ref="chatbotTitleRef"
      class="chatbot-preview-box"
      data-testId="chatbot-preview"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false">
      <Tippy
        v-if="showTooltip"
        data-testId="tippy"
        placement="top">
        <template #content>
          <h3
            class="tooltip"
            data-testid="tooltip">
            {{ title }}
          </h3>
        </template>
        <h3 class="truncate">
          {{ title }}
        </h3>
      </Tippy>
      <h3
        v-else
        class="truncate">
        {{ title }}
      </h3>
      <p>{{ description }}</p>
      <span v-if="fileCount !== null && !isNaN(fileCount as number)">{{
        i18n.t('chatbot.preview.files', { n: fileCount })
      }}</span>
      <div
        v-if="(isHovering || isTouchDevice) && canBeEdited"
        class="edit"
        data-testId="chatbot-edit"
        @click.stop="edit">
        <PhNotePencil
          :color="fontColor"
          :size="22" />
      </div>
      <div
        v-if="props.agentType === AgentType.AGENTIC"
        :style="advancedAgentBgPosition"
        class="advanced-agent__bg">
        <component
          :is="AdvancedAgentsBg"
          :style="{ fill: advancedAgentBgColor }"
          class="rotate-circle" />
      </div>
    </div>
    <div
      v-if="individuals ? individuals.length > 0 : false"
      class="shared">
      <Tippy
        v-if="isSharedWithCurrentUser"
        placement="top"
        class="tippy-wrapper">
        <template #content>
          <p>{{ t('chatbot.tooltips.shared-with') }}</p>
        </template>
        <PhUsers
          data-testid="chatbot-shared-with"
          v-if="isSharedWithCurrentUser"
          :size="20"
          color="var(--color-primary-dark)"
          weight="bold" />
      </Tippy>
      <Tippy
        v-else
        placement="top"
        class="tippy-wrapper">
        <template #content
          ><p>{{ t('chatbot.tooltips.shared-by') }}</p>
        </template>
        <PhLink
          data-testid="chatbot-shared-by"
          :size="20"
          color="var(--color-primary-dark)"
          weight="bold" />
      </Tippy>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.tooltip {
  font-family: Mulish, sans-serif;
  margin: 10px;
  word-wrap: break-word;
}

.rotate-circle {
  animation-name: rotate;
  animation-duration: 60s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

.chatbot-preview-box {
  position: relative;
  font-family: Mulish, sans-serif;
  width: 100%;
  height: 100%;
  min-height: 127px;
  color: inherit;
  overflow: hidden;
  padding: 14px 12px;

  &__wrapper {
    position: relative;
    border-radius: 12px;
    min-width: 175px;
    border: 1px solid;
    color: var(--color-text-secondary);
    width: 234px;
    height: auto;
    min-height: 127px;
    transition:
      opacity 0.3s ease-in-out,
      border 0.3s ease-in-out;
    cursor: pointer;

    .shared {
      position: absolute;
      display: flex;
      justify-content: center;
      align-items: center;
      bottom: -8px;
      right: -8px;
      width: 32px;
      height: 32px;
      background-color: #ffffff;
      border: 1px solid v-bind(darkenedBorderColor);
      border-radius: 50%;
      z-index: 105;
    }
    .tippy-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  h3 {
    font-size: 16px;
    font-weight: 700;
    padding-right: 1rem;
    font-family: Mulish, sans-serif;
  }

  p {
    font-size: 12px;
    line-height: 1.2;
    margin-top: 3px;

    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
  }

  span {
    font-size: 0.6rem;
    font-family: 'Poppins', sans-serif;
    margin-top: 3px;
  }

  .edit {
    z-index: 1;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    right: 6px;
    top: 10px;
    width: 32px;
    height: 32px;
    background: transparent;
    border-radius: 50%;

    &:hover {
      background-color: var(--color-btn-hover-bg);
    }
  }
}

.advanced-agent__bg {
  position: absolute;
  z-index: -1;
}

.icon {
  position: absolute;
  height: 22px;
  width: 22px;
  top: 15px;
  right: 13px;
  stroke: v-bind(fontColor);
}

.cbpb-default {
  position: relative;
  border-radius: 12px;
  border: 1px solid v-bind(darkenedBorderColor);
  color: v-bind(fontColor);
  // transition: --myColor1 0.3s, --myColor2 0.3s;
  transition: all 0.2s ease-in-out;

  @include gradientAnimation(v-bind(gradientBackground), v-bind(hoverGradientBackground), 0.4s);
}

@include breakpoint-down(md) {
  .chatbot-preview-box {
    width: 100%;
  }

  .chatbot-preview-box h3 {
    font-size: 16px;
  }

  .chatbot-preview-box p {
    font-size: 16px;
  }
}
</style>
