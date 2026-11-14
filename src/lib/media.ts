import { useEffect, useState } from 'react'
import { uid } from './defaults'

/*
 * Pictures live in IndexedDB (no 5 MB localStorage limit). Every window of the app
 * reads the same database, so a picture added in the editor appears on the projector
 * as soon as the question that references it is shown.
 */
const DB_NAME = 'rsr-media'
const STORE = 'images'

let dbPromise: Promise<IDBDatabase> | null = null
function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const t = d.transaction(STORE, mode)
        const req = run(t.objectStore(STORE))
        t.oncomplete = () => resolve(req ? (req.result as T) : (undefined as T))
        t.onerror = () => reject(t.error)
        t.onabort = () => reject(t.error)
      }),
  )
}

export const getImage = (id: string) => tx<Blob | undefined>('readonly', (s) => s.get(id))
export const deleteImage = (id: string) => {
  const url = urlCache.get(id)
  if (url) URL.revokeObjectURL(url)
  urlCache.delete(id)
  return tx<undefined>('readwrite', (s) => s.delete(id))
}
export const allImageIds = () => tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys()).then((k) => k.map(String))
export const clearImages = () => {
  urlCache.forEach((u) => URL.revokeObjectURL(u))
  urlCache.clear()
  return tx<undefined>('readwrite', (s) => s.clear())
}

export async function putImage(blob: Blob, id = uid('img')): Promise<string> {
  await tx('readwrite', (s) => s.put(blob, id))
  return id
}

/** Shrinks very large photos so they load instantly on the projector (max 2400 px). */
export async function prepareImage(file: Blob): Promise<Blob> {
  const MAX = 2400
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  let bmp: ImageBitmap
  try {
    bmp = await createImageBitmap(file)
  } catch {
    return file
  }
  const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height))
  if (scale === 1 && file.size < 2_500_000) {
    bmp.close()
    return file
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  const encode = (type: string, q?: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q))
  const webp = await encode('image/webp', 0.9)
  if (webp && webp.type === 'image/webp') return webp
  return (await encode(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9)) ?? file
}

export async function addImageFile(file: Blob): Promise<string> {
  return putImage(await prepareImage(file))
}

/* ───────────── object-URL cache + hook ───────────── */

const urlCache = new Map<string, string>()
const pending = new Map<string, Promise<string | null>>()

export function loadImageUrl(id: string): Promise<string | null> {
  const hit = urlCache.get(id)
  if (hit) return Promise.resolve(hit)
  let p = pending.get(id)
  if (!p) {
    p = getImage(id)
      .then((blob) => {
        if (!blob) return null
        const url = URL.createObjectURL(blob)
        urlCache.set(id, url)
        return url
      })
      .catch(() => null)
      .finally(() => pending.delete(id))
    pending.set(id, p)
  }
  return p
}

/** Decode ahead of time so the projector never shows a half-loaded picture. */
export function preloadImage(id: string | null | undefined) {
  if (!id) return
  loadImageUrl(id).then((url) => {
    if (!url) return
    const img = new Image()
    img.src = url
    img.decode?.().catch(() => {})
  })
}

export function useImageUrl(id: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => (id ? (urlCache.get(id) ?? null) : null))
  useEffect(() => {
    if (!id) return setUrl(null)
    const hit = urlCache.get(id)
    if (hit) return setUrl(hit)
    let alive = true
    setUrl(null)
    loadImageUrl(id).then((u) => alive && setUrl(u))
    return () => {
      alive = false
    }
  }, [id])
  return url
}

/* ───────────── export helpers ───────────── */

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}
