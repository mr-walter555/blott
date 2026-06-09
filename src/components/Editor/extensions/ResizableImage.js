import Image from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ResizableImageView from './ResizableImageView'

// Adds drag-to-resize handles (Word/Notion style) on top of the stock Image
// node — width/height persist as inline styles so they round-trip through
// stored HTML untouched.
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => {
          const value = element.style.width || element.getAttribute('width')
          return value ? parseInt(value, 10) : null
        },
        renderHTML: attributes => (attributes.width ? { style: `width: ${attributes.width}px` } : {}),
      },
      height: {
        default: null,
        parseHTML: element => {
          const value = element.style.height || element.getAttribute('height')
          return value ? parseInt(value, 10) : null
        },
        renderHTML: attributes => (attributes.height ? { style: `height: ${attributes.height}px` } : {}),
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})

export default ResizableImage
