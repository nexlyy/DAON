/**
 * Choosing a photograph for a dish.
 *
 * The cards on the site are square, so a picture has to be cropped to a square
 * somewhere. Doing it here, with the frame visible, means the person who knows
 * what the dish should look like decides what is in the frame — and it means
 * the phone sends one square picture instead of a twelve-megapixel one.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { api, photoUrl } from './api'
import { Button, Message } from './ui'
import styles from './admin.module.css'

const BOX = 300
const OUT = 1280

export function PhotoPicker({
  dishId,
  photo,
  onPhoto,
}: {
  dishId: string
  photo?: string
  onPhoto: (photo: string) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [note, setNote] = useState('')
  const dragging = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!file) {
      setImage(null)
      return
    }
    const url = URL.createObjectURL(file)
    const next = new Image()
    next.onload = () => {
      setImage(next)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    next.onerror = () => setFailure('That file could not be opened as a picture.')
    next.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // How the picture sits in the square frame: never smaller than the frame,
  // never dragged past its own edge.
  const placed = useMemo(() => {
    if (!image) return null
    const cover = Math.max(BOX / image.naturalWidth, BOX / image.naturalHeight)
    const scale = cover * zoom
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale
    const x = Math.min(0, Math.max(BOX - width, offset.x))
    const y = Math.min(0, Math.max(BOX - height, offset.y))
    return { width, height, x, y, scale }
  }, [image, zoom, offset])

  const upload = async () => {
    if (!image || !placed) return
    setBusy(true)
    setFailure('')
    setNote('')
    try {
      const factor = OUT / BOX
      const canvas = document.createElement('canvas')
      canvas.width = OUT
      canvas.height = OUT
      const context = canvas.getContext('2d')
      if (!context) throw new Error('This browser cannot prepare the picture.')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, OUT, OUT)
      context.drawImage(
        image,
        placed.x * factor,
        placed.y * factor,
        placed.width * factor,
        placed.height * factor,
      )

      const blob = await new Promise<Blob | null>((done) =>
        canvas.toBlob((made) => done(made), 'image/webp', 0.92),
      )
      if (!blob) throw new Error('This browser could not make a WebP picture.')

      const saved = await api.uploadPhoto(dishId, blob)
      onPhoto(saved.photo)
      setFile(null)
      setNote(
        saved.resized
          ? 'Uploaded. Press Save on the dish, then Publish to put it on the site.'
          : 'Uploaded at one size only — the server could not resize it. Press Save, then Publish.',
      )
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>Photograph</span>

      {failure && <Message kind="bad">{failure}</Message>}
      {note && <Message kind="good">{note}</Message>}

      {!file && (
        <div className={styles.photoRow}>
          {photo ? (
            <img className={styles.photoNow} src={photoUrl(photo)} alt="" width={96} height={96} />
          ) : (
            <span className={styles.photoNone}>no photograph</span>
          )}
          <div className={styles.field}>
            <input
              className={styles.input}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => {
                setFailure('')
                setNote('')
                setFile(event.target.files?.[0] ?? null)
              }}
            />
            <span className={styles.rowSub}>
              A square is cut from whatever is chosen; up to 12 MB.
              {photo?.startsWith('u:') ? ' This one was uploaded here.' : ''}
            </span>
            {photo && (
              <Button kind="danger" onClick={() => onPhoto('')}>
                Use no photograph
              </Button>
            )}
          </div>
        </div>
      )}

      {file && image && placed && (
        <div className={styles.cropper}>
          <div
            className={styles.cropBox}
            style={{ width: BOX, height: BOX }}
            onPointerDown={(event) => {
              dragging.current = { x: event.clientX - placed.x, y: event.clientY - placed.y }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (!dragging.current) return
              setOffset({
                x: event.clientX - dragging.current.x,
                y: event.clientY - dragging.current.y,
              })
            }}
            onPointerUp={() => {
              dragging.current = null
            }}
          >
            <img
              src={image.src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: placed.x,
                top: placed.y,
                width: placed.width,
                height: placed.height,
              }}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Closer</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
            <span className={styles.rowSub}>Drag the picture to choose what stays in frame.</span>
            <div className={styles.tools}>
              <Button kind="primary" onClick={() => void upload()} disabled={busy}>
                {busy ? 'Uploading…' : 'Use this'}
              </Button>
              <Button onClick={() => setFile(null)} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
