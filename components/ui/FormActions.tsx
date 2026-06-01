'use client'

interface FormActionsProps {
  onCancel: () => void
  loading?: boolean
  submitLabel?: string
  loadingLabel?: string
  cancelLabel?: string
}

export function FormActions({
  onCancel,
  loading = false,
  submitLabel = 'Save',
  loadingLabel = 'Saving...',
  cancelLabel = 'Cancel',
}: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-3 pt-4 border-t border-white/40">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl bg-white/50 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-white/60 hover:bg-white/70 transition-all"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-primary-600/90 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 transition-all"
      >
        {loading ? loadingLabel : submitLabel}
      </button>
    </div>
  )
}

export default FormActions
