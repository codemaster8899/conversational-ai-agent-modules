import { useFilesStore } from '@/stores/files'

import { DropTypes } from '@/types/file.ts'

export const useDraggableFilesUtils = () => {
  const filesStore = useFilesStore()

  function drag(ev: DragEvent, id: string, type: DropTypes, parent_id?: string | null) {
    ev.dataTransfer?.setData('id', id)
    ev.dataTransfer?.setData('type', type.toString())
    if (typeof parent_id === 'string') ev.dataTransfer?.setData('parent_id', parent_id)
  }

  async function drop(ev: DragEvent, target_id: string) {
    ev.preventDefault()
    ev.stopPropagation()
    const type = ev.dataTransfer?.getData('type')
    const id = ev.dataTransfer?.getData('id')
    const parent_id = ev.dataTransfer?.getData('parent_id')
    if (id === target_id) return //Can't move a folder into itself
    if (type === DropTypes['move-file'] && id && !filesStore.isMoving && parent_id !== target_id) {
      await filesStore.moveFile(id, target_id)
    }
    if (
      type === DropTypes['move-folder'] &&
      id &&
      !filesStore.isMoving &&
      parent_id !== target_id
    ) {
      await filesStore.moveDirectory(id, target_id)
    }
  }

  return { drag, drop }
}
