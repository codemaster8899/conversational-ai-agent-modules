import { onMounted, onUnmounted, onUpdated, ref } from 'vue'

//This function checks wheter the div is scrollable or not
export const useIsScrollable = (elementRef: any) => {
  const isScrollable = ref<boolean>(false) // We used this flag to show UI properly

  const checkScrollbarVisibility = () => {
    const scroll = elementRef.value?.scrollWidth
    const width = elementRef.value?.getBoundingClientRect()?.width
    if (!scroll || !width) return
    if (scroll > width && !isScrollable.value) {
      isScrollable.value = true
    }
    if (scroll <= width && isScrollable.value) {
      isScrollable.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('resize', checkScrollbarVisibility)
  })

  onUpdated(checkScrollbarVisibility)

  onUnmounted(() => {
    window.removeEventListener('resize', checkScrollbarVisibility)
  })

  return isScrollable
}
