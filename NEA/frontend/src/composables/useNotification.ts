import { useToast } from 'primevue/usetoast'

export function useNotification() {
  const toast = useToast()

  function success(summary: string, detail?: string) {
    toast.add({
      severity: 'success',
      summary,
      detail,
      life: 3500,
    })
  }

  function error(summary: string, detail?: string) {
    toast.add({
      severity: 'error',
      summary,
      detail,
      life: 5000,
    })
  }

  function info(summary: string, detail?: string) {
    toast.add({
      severity: 'info',
      summary,
      detail,
      life: 3500,
    })
  }

  return {
    success,
    error,
    info,
  }
}