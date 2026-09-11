import i18n from '@/i18n'
import { useFilesStore } from '@/stores/files'
import type { Event } from '@/types/Event.ts'
import type { FileToUpload, FileUser } from '@/types/file.ts'
import { assertSupportedFileType, isSupportedFileType } from '@/utils/files'
import { toast } from 'vue3-toastify'

const createFileObj = (f: File): FileToUpload => {
  return {
    file: f,
    name: f.name,
    size: f.size,
    uploaded: false
  }
}

export const useFileUploader = () => {
  const filesStore = useFilesStore()
  const MAX_FILES_ALLOWED = 3
  const MAX_FILE_SIZE = 25 * 1024 * 1024

  //Read each directory and push files
  function readDirectory(directory: FileSystemDirectoryEntry) {
    const reader = directory.createReader()

    reader.readEntries((entries) => {
      for (const entry of entries) {
        if (entry.isFile) {
          ;(entry as FileSystemFileEntry).file((file: File) => {
            const f = createFileObj(file)

            if (isSupportedFileType(file)) {
              filesStore.filesToUpload.push(f)
            }
          })
        } else if (entry.isDirectory) {
          // Recursively read sub-directories
          readDirectory(<FileSystemDirectoryEntry>entry)
        }
      }
    })
  }

  function onDrop(e: DragEvent) {
    // e.stopPropagation()
    const droppedItems = e.dataTransfer?.items
    if (!droppedItems) return

    for (let i = 0; i < droppedItems.length; i++) {
      const item = droppedItems[i].webkitGetAsEntry()
      if (!item) continue

      // If the dropped item is a directory
      if (item.isDirectory) {
        readDirectory(<FileSystemDirectoryEntry>item)
      } else if (item.isFile) {
        const file = droppedItems[i].getAsFile()
        if (!file) continue

        try {
          assertSupportedFileType(file)
          const f = createFileObj(file)
          filesStore.filesToUpload.push(f)
        } catch (error) {
          console.warn(`Skipping unsupported file: ${file.name}`)
        }
      }
    }
    // Reset the input value to allow selecting the same file again
    ;(e.target as HTMLInputElement).value = ''
  }

  function onUpload(e: Event<HTMLInputElement>) {
    const fileList = e.target.files
    if (fileList) {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        try {
          assertSupportedFileType(file)
          filesStore.filesToUpload.push(createFileObj(file))
        } catch (error) {
          console.warn(`Skipping unsupported file: ${file.name} with error: ${error}`)
        }
      }
    }
  }

  // Validate file type, size, duplicates, and max file limit
  function validateFile(file: File, uploadedFiles: FileUser[]): boolean {
    if (!isSupportedFileType(file)) {
      toast(i18n.global.t('conversations.toasts.file-type-not-supported'), {
        type: 'error'
      })
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      toast(i18n.global.t('conversations.toasts.file-too-large', { max_file_size_mb: 25 }), {
        type: 'error'
      })
      return false
    }

    if (uploadedFiles.length >= MAX_FILES_ALLOWED) {
      toast(i18n.global.t('conversations.toasts.max-files-limit-reached'), { type: 'error' })

      return false
    }

    if (uploadedFiles.some((f) => f.file_name === file.name)) {
      toast(i18n.global.t('conversations.toasts.duplicate-file'), { type: 'error' })
      return false
    }

    return true
  }

  return { onDrop, onUpload, validateFile }
}
