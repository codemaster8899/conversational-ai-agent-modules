import i18n from '@/i18n'
import { IndexingStatus } from '@/types'
import {
  type FileOperations,
  type FilesDirectory,
  type FilesDirectoryUser,
  type FileToEdit,
  type FileToUpload,
  type FileUser,
  type FilterType,
  SortBy,
  SortOrder
} from '@/types/file'
import { Filters } from '@/types/Filters.ts'
import type { Pagination } from '@/types/pagination.ts'
import { Sorting } from '@/types/Sorting.ts'
import { handleError } from '@/utils/error'
import { createFileFormData } from '@/utils/files'
import type { ModelValue } from '@vuepic/vue-datepicker'
import axios from 'axios'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue3-toastify'
import { useAuthStore } from './auth'

function convertDirectory(directory: FilesDirectoryUser): FilesDirectory {
  const { id, canonical, name, parent_id } = directory
  return { id, canonical, name, parent_id }
}

export const useFilesStore = defineStore('files', () => {
  const authStore = useAuthStore()
  const currentDirectory = ref<FilesDirectoryUser | null>(null)
  const currentDirectoryFiles = ref<FileUser[] | null>(null)
  const isFetchingDirectory = ref<boolean>(false)
  const isFetchingDirectoryFiles = ref<boolean>(false)
  const location = ref<FilesDirectory[]>([])
  const files = ref<FileUser[]>([])
  const filesToUpload = ref<FileToUpload[]>([])
  const isUploading = ref<boolean>(false)
  const isMoving = ref<boolean>(false)
  const fileOperations = ref<FileOperations>({
    filters: new Filters(),
    sorting: new Sorting(SortBy.MODIFIED, SortOrder.ASC)
  })

  function updateFilters(key: string, value: FilterType) {
    fileOperations.value.filters.addFilter(key, value)
  }

  function updateSorting(type: 'sortBy' | 'sortOrder', value: SortBy | SortOrder | undefined) {
    if (type === 'sortBy') {
      fileOperations.value.sorting.updateSortBy(value as SortBy)
    } else {
      fileOperations.value.sorting.updateSortOrder(value as SortOrder)
    }
  }

  function updateDirectory(directory: FilesDirectory) {
    const index = currentDirectory.value!.children.findIndex((d) => d.id === directory.id)
    currentDirectory.value!.children[index] = directory
  }

  function updateFile(file: FileUser) {
    const index = currentDirectoryFiles.value!.findIndex((f) => f.id === file.id)
    currentDirectoryFiles.value![index] = file
  }

  function updateIndexingStatus(file: FileUser, status: IndexingStatus) {
    file.file.indexing_status = status
  }

  //Reset to root location
  function resetLocation() {
    location.value = [authStore.user!.root_directory]
  }

  // action to fetch files
  async function fetchFiles(pagination: Pagination<FileUser>): Promise<Pagination<FileUser>> {
    try {
      const response = await axios.get<Pagination<FileUser>>(
        `/api/files?${pagination.toQueryParams()}`
      )
      files.value = response.data.items.filter(
        (item) => item.file.indexing_status === IndexingStatus.INDEXED
      )

      return response.data
    } catch (error) {
      toast(i18n.global.t('files.toasts.file-fetching-error'), {
        type: 'error'
      })

      return Promise.reject(error)
    }
  }

  async function fetchDirectory(dir: FilesDirectory): Promise<FilesDirectoryUser> {
    try {
      const response = await axios.get<FilesDirectoryUser>(`/api/directories/${dir.id}`)
      return response.data
    } catch (error) {
      toast(i18n.global.t('files.toasts.directory-fetching-error'), {
        type: 'error'
      })
      return Promise.reject(error)
    }
  }

  /**
   * Fetch current directory (without files)
   * @param fetchInBackground loader state won't be changed
   */
  async function fetchCurrentDirectory(fetchInBackground?: boolean) {
    if (!location.value.length) return
    try {
      if (!fetchInBackground) isFetchingDirectory.value = true

      const response = await axios.get<FilesDirectoryUser>(
        `/api/directories/${location.value.at(-1)?.id}`
      )
      currentDirectory.value = response.data
    } catch (error) {
      toast(i18n.global.t('files.toasts.directory-fetching-error'), {
        type: 'error'
      })
      console.error('Error fetching directory', error)
    } finally {
      isFetchingDirectory.value = false
    }
  }

  /**
   * Fetch files in current directory
   * @param pagination
   * @param fetchInBackground loader state won't be changed
   */
  async function fetchCurrentDirectoryFiles(
    pagination: Pagination<FileUser>,
    fetchInBackground = true
  ): Promise<Pagination<FileUser>> {
    if (!fetchInBackground) isFetchingDirectoryFiles.value = true

    try {
      const sorting: Sorting = fileOperations.value.sorting as Sorting
      const filters: Filters = fileOperations.value.filters as Filters

      const response = await axios.get<Pagination<FileUser>>(
        `/api/directories/${location.value.at(-1)?.id}/files?${pagination.addSorting(sorting).addFilter(filters).toQueryParams()}`
      )

      currentDirectoryFiles.value = response.data.items
      return response.data
    } catch (error) {
      toast(i18n.global.t('files.toasts.directory-fetching-error'), {
        type: 'error'
      })
      console.error('Error fetching directory', error)
      return Promise.reject(error)
    } finally {
      isFetchingDirectoryFiles.value = false
    }
  }

  async function createDirectory(directory_name: string) {
    if (!location.value.length) return
    try {
      const response: { data: FilesDirectoryUser } = await axios.post<FilesDirectoryUser>(
        `/api/directories`,
        {
          name: directory_name,
          parent_id: currentDirectory.value?.id
        }
      )
      currentDirectory.value?.children.push(convertDirectory(response.data))
    } catch (e) {
      handleError(e, 'files.toasts.directory-create-error')
    }
  }

  async function renameDirectory(id: string, name: string) {
    try {
      const response: { data: FilesDirectoryUser } = await axios.patch<FilesDirectoryUser>(
        `/api/directories/${id}`,
        {
          name
        }
      )
      updateDirectory(convertDirectory(response.data))
    } catch (e) {
      handleError(e, 'files.toasts.directory-rename-error')
    }
  }

  async function moveDirectory(id: string, parent_id: string) {
    try {
      isMoving.value = true
      await axios.patch<FilesDirectoryUser>(`/api/directories/${id}`, {
        parent_id
      })

      currentDirectory.value!.children = currentDirectory.value!.children.filter((d) => d.id !== id)
      toast(i18n.global.t('files.toasts.directory-move-success'), {
        type: 'success'
      })
    } catch (e) {
      handleError(e, 'files.toasts.directory-move-error')
    } finally {
      isMoving.value = false
    }
  }

  async function deleteDirectory(id: string) {
    try {
      await axios.delete(`/api/directories/${id}`)

      currentDirectory.value!.children = currentDirectory.value!.children.filter((d) => d.id !== id)

      toast(i18n.global.t('files.toasts.directory-delete-success'), {
        type: 'success'
      })
    } catch (e) {
      handleError(e, 'files.toasts.directory-delete-error')
    }
  }

  async function uploadFile(fileData: FileToUpload, expires?: Date) {
    isUploading.value = true

    const currentLocation = location.value.at(-1)
    const dir = currentLocation?.id || currentDirectory.value?.id || ''

    const fileFormData = createFileFormData(fileData, dir, expires)

    try {
      const res = await axios.post('/api/files/upload', fileFormData)

      toast(i18n.global.t('files.toasts.file-upload-success', { fileName: fileData.name }), {
        type: 'success'
      })

      currentDirectoryFiles.value?.push(res.data)
      fileData.uploaded = true
    } catch (error) {
      handleError(error, 'files.toasts.file-upload-error')
    } finally {
      isUploading.value = false
      fileOperations.value.filters.removeAllFilter()
      fileOperations.value.sorting.reset()
    }
  }

  async function uploadFileFromURL(expires?: ModelValue, fileURL?: string, fileName?: string) {
    const payload = {
      url: fileURL,
      file_name: fileName,
      expires
    }

    try {
      isUploading.value = true
      const res = await axios.post('/api/files/load-url', payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      if (res.data) {
        await fetchCurrentDirectory()
      }

      toast(i18n.global.t('files.toasts.file-upload-success', { fileName }), {
        type: 'success'
      })
    } catch (error) {
      handleError(error, 'backend.error.validation-error')
    } finally {
      isUploading.value = false
    }
  }

  async function uploadFiles(expires?: Date) {
    isUploading.value = true

    for (const fileData of filesToUpload.value) {
      await uploadFile(fileData, expires)
    }

    isUploading.value = false
  }

  async function deleteFile(id: string, showToast: boolean = true) {
    try {
      await axios.delete(`/api/files/${id}`)
      currentDirectoryFiles.value = currentDirectoryFiles.value
        ? currentDirectoryFiles.value!.filter((f) => f.id !== id)
        : []

      if (showToast) {
        toast(i18n.global.t('files.toasts.file-deletion-success'), {
          type: 'success'
        })
      }
    } catch (e) {
      handleError(e, 'files.toasts.file-deletion-error')
    }
  }

  async function editFile(id: string, file_name: string, date?: Date) {
    console.log('11111111', id, file_name, date?.getTime())
    const data: FileToEdit = { file_name }
    if (date) data.expires = date.toISOString()
    try {
      const response = await axios.patch(`/api/files/${id}`, data)
      updateFile(response.data)
      toast(i18n.global.t('files.toasts.file-rename-success'), {
        type: 'success'
      })
    } catch (e) {
      handleError(e, 'files.toasts.file-rename-error')
    }
  }

  async function moveFile(id: string, directory_id: string) {
    try {
      isMoving.value = true
      await axios.patch(`/api/files/${id}`, { directory_id })
      currentDirectoryFiles.value = currentDirectoryFiles.value!.filter((f) => f.id !== id)

      toast(i18n.global.t('files.toasts.file-move-success'), {
        type: 'success'
      })
    } catch (err) {
      handleError(err, 'files.toasts.file-move-error')
    } finally {
      isMoving.value = false
    }
  }

  async function reIndexFile(file: FileUser) {
    try {
      await axios.patch(`${import.meta.env.VITE_TXAI_BACKEND_URL}/api/files/${file.id}/reindex`)
      toast(i18n.global.t('files.toasts.file-reindex-success', { fileName: file.file_name }), {
        type: 'success'
      })

      // Set indexing status to 'pending' to trigger re-fetching
      updateIndexingStatus(file, IndexingStatus.PENDING)
    } catch (err) {
      toast(i18n.global.t('files.toasts.file-reindex-error', { fileName: file.file_name }), {
        type: 'error'
      })
      console.error(err)
    }
  }

  async function getImageURL(id: string, img_path: string) {
    try {
      const response = await axios.get(
        `/api/files/${id}/image?img_path=${encodeURIComponent(img_path)}`
      )
      return response.data.presigned_url
    } catch (error) {
      toast(i18n.global.t('files.toasts.file-fetching-error'), {
        type: 'error'
      })
      return Promise.reject(error)
    }
  }

  //Set root location
  watch(
    () => authStore.user,
    () => {
      if (authStore.user?.root_directory) {
        location.value = [authStore.user?.root_directory]
      }
    },
    { immediate: true }
  )

  const filePathsForSelector = computed(() =>
    files.value.map((file: FileUser) => {
      return { path: file.file_name, id: file.id }
    })
  )

  return {
    fetchFiles,
    currentDirectory,
    currentDirectoryFiles,
    fileOperations,
    isFetchingDirectory,
    isFetchingDirectoryFiles,
    fetchCurrentDirectory,
    fetchCurrentDirectoryFiles,
    fetchDirectory,
    location,
    resetLocation,
    createDirectory,
    renameDirectory,
    moveDirectory,
    deleteDirectory,
    deleteFile,
    editFile,
    moveFile,
    reIndexFile,
    filePathsForSelector,
    files,
    filesToUpload,
    updateFilters,
    updateSorting,
    uploadFiles,
    uploadFileFromURL,
    isUploading,
    isMoving,
    getImageURL
  }
})
