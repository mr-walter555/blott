import { useCallback, useRef, useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'

const MIN_WIDTH = 80
const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

export default function ResizableImageView({ node, updateAttributes, selected }) {
  const { src, alt, title, width, height } = node.attrs
  const imgRef = useRef(null)
  const [resizing, setResizing] = useState(false)

  const startResize = useCallback((e, corner) => {
    e.preventDefault()
    e.stopPropagation()
    const img = imgRef.current
    if (!img) return

    const startX = e.clientX
    const startWidth = img.offsetWidth
    const aspectRatio = img.offsetWidth / img.offsetHeight
    const dir = corner.endsWith('right') ? 1 : -1
    // The image's immediate parent (.resizable-image) is inline-block and
    // shrink-wraps to the image, so it always equals startWidth — capping
    // growth at the original size. Measure against the editor content area.
    const container = img.closest('.ProseMirror')
    const maxWidth = container ? container.clientWidth : startWidth

    setResizing(true)

    const onMove = (moveEvent) => {
      const delta = (moveEvent.clientX - startX) * dir
      const newWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, Math.round(startWidth + delta)))
      updateAttributes({ width: newWidth, height: Math.round(newWidth / aspectRatio) })
    }

    const onUp = () => {
      setResizing(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [updateAttributes])

  return (
    <NodeViewWrapper
      as="span"
      className={`resizable-image ${selected ? 'is-selected' : ''} ${resizing ? 'is-resizing' : ''}`}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        title={title}
        draggable={false}
        className="editor-image"
        style={{
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
        }}
      />
      {selected && CORNERS.map(corner => (
        <span
          key={corner}
          className={`resize-handle resize-handle-${corner}`}
          onPointerDown={e => startResize(e, corner)}
        />
      ))}
    </NodeViewWrapper>
  )
}
