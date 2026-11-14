import { ImagePlus, LoaderCircle, RefreshCw, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { StoredImage } from '../components/bits'
import { addImageFile, deleteImage } from '../lib/media'

// One global paste listener: Ctrl+V puts the clipboard picture into the drop zone under the mouse.
let hovered: ((f: File) => void) | null = null
let installed = false
function installPaste() {
  if (installed) return
  installed = true
  window.addEventListener('paste', (e) => {
    if (!hovered) return
    const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
    if (file) {
      e.preventDefault()
      hovered(file)
    }
  })
}

export function ImageDrop({
  value,
  onChange,
  label,
  className = '',
  compact = false,
}: {
  value: string | null
  onChange: (id: string | null) => void
  label: string
  className?: string
  compact?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()
  useEffect(installPaste, [])

  const accept = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('ეს სურათი არ არის')
    setError(null)
    setBusy(true)
    try {
      const id = await addImageFile(file)
      const old = value
      onChange(id)
      if (old) void deleteImage(old)
    } catch {
      setError('ვერ აიტვირთა')
    } finally {
      setBusy(false)
    }
  }
  const handlerRef = useRef(accept)
  handlerRef.current = accept
  const pasteHandler = useRef((f: File) => handlerRef.current(f)).current

  const remove = () => {
    if (value) void deleteImage(value)
    onChange(null)
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-colors ${over ? 'border-brass-400 bg-brass-400/10' : value ? 'border-ink-700 bg-ink-950' : 'border-dashed border-ink-600 bg-ink-900 hover:border-ink-500'} ${className}`}
      onMouseEnter={() => (hovered = pasteHandler)}
      onMouseLeave={() => hovered === pasteHandler && (hovered = null)}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        void accept(e.dataTransfer.files[0])
      }}
    >
      <input
        ref={input}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          void accept(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {value ? (
        <>
          <StoredImage id={value} className="absolute inset-0 size-full" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-ink-900/90 px-2.5 text-[12.5px] font-semibold text-parchment-100 ring-1 ring-ink-600 hover:bg-ink-800"
            >
              <RefreshCw className="size-3.5" aria-hidden /> შეცვლა
            </button>
            <button
              type="button"
              onClick={remove}
              aria-label={`${label}: წაშლა`}
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-ink-900/90 text-ember-300 ring-1 ring-ink-600 hover:bg-ember-600/40"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </>
      ) : (
        <label
          htmlFor={inputId}
          className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1.5 px-3 text-center"
        >
          {busy ? (
            <LoaderCircle className="size-5 animate-spin text-brass-400" aria-hidden />
          ) : (
            <ImagePlus className={`${compact ? 'size-5' : 'size-6'} text-stone-400 group-hover:text-brass-400`} aria-hidden />
          )}
          <span className="text-[12.5px] font-semibold text-stone-300">{label}</span>
          {!compact && <span className="text-[11.5px] text-stone-400">ჩააგდეთ, აირჩიეთ ან Ctrl+V</span>}
          {error && <span className="text-[11.5px] text-ember-300">{error}</span>}
        </label>
      )}
    </div>
  )
}
