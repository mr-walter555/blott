// Shared framer-motion presets for modal/overlay surfaces, so every dialog
// in the app (Command Palette, Settings, Delete confirm, Workspace modal...)
// enters and exits with the same feel.

export const MODAL_BACKDROP = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
}

export const MODAL_CONTENT = {
  initial: { opacity: 0, scale: 0.96, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 6 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
}
