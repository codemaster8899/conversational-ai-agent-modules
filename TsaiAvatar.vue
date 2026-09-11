<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth'
import { useAvatarsStore } from '@/stores/avatars'
import { AvatarType } from '@/types'
import tinycolor from 'tinycolor2'
import { computed, ref, watch } from 'vue'

const authStore = useAuthStore()
const avatarsStore = useAvatarsStore()

const colors = ['#aab2e8', '#674997', '#934995', '#BC4995', '#CC6BA8', '#8F97E1', '#E99BCC']

const props = withDefaults(
  defineProps<{
    name: string
    id: string
    color?: string
    type?: AvatarType
    avatarChanged?: boolean
  }>(),
  {
    type: AvatarType.USER
  }
)

const showImage = ref<boolean>(true)
const bgColor = computed(() => getColorForUsername(props.name))

const avatarUrl = ref<string | null>(null)
const avatarChanged = computed(() => props.avatarChanged)

const fontColor = computed(() =>
  tinycolor(bgColor.value).isDark() ? 'var(--color-text-secondary)' : 'var(--color-text)'
)

function getColorForUsername(username: string = ''): string {
  if (props.color) return props.color // override color if set
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length // Ensure positive index and within bounds
  return colors[index]
}

async function fetchAvatarImage() {
  if (!props.type || props.type === AvatarType.USER) {
    const data = await avatarsStore.getAvatarURL(props.id, props.type)
    avatarUrl.value = URL.createObjectURL(data)
  }
}

watch(
  () => [props.id, props.type, avatarChanged.value],
  () => {
    fetchAvatarImage()
  },
  { immediate: true }
)

watch([authStore.user], (_n) => {
  if (_n) {
    fetchAvatarImage()
  } else {
    avatarUrl.value = null
    showImage.value = false
  }
})

watch(avatarUrl, (_n, old) => {
  if (old) {
    URL.revokeObjectURL(old)
  }
})
</script>

<template>
  <div class="avatar">
    <!-- Hide this image and it's 'broken' badge when the url is invalid -->
    <img
      v-if="avatarUrl"
      :class="{ hidden: !showImage || !avatarUrl }"
      :src="avatarUrl"
      alt="Profile Avatar"
      @error="showImage = false"
      @load="showImage = true" />
    <p
      :style="{ color: fontColor }"
      class="letter">
      {{ name[0].toUpperCase() }}
    </p>
  </div>
</template>

<style scoped>
.avatar {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  width: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background-color: v-bind(bgColor);
  color: var(--color-text);
  user-select: none;
}

.hidden {
  visibility: hidden;
}

img {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 100%;
  border-radius: 50%;
  object-fit: cover;
}
</style>
