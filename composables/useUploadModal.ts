import FileUploadModal from '@/components/modals/FileUploadModal.vue'
import i18n from '@/i18n'
import { useModal } from 'vue-final-modal'

const uploadModal = useModal({
  component: FileUploadModal,
  attrs: {
    title: i18n.global.t('files.upload-modal.title'),
    async onConfirm() {
      await uploadModal.close()
    },
    async onClose() {
      console.log('onClose')
      await uploadModal.close()
    }
  },
  slots: {
    default: '<small>' + i18n.global.t('files.upload-modal.description') + '</small>'
  }
})

export const useUploadModal = () => {
  return uploadModal
}
