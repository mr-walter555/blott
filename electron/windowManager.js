'use strict'

// ── Window Management Utilities ───────────────────────────────────────────────
//
// Centralises all window-state validation, persistence, and recovery so
// main.js stays readable.  Every function that touches display geometry is
// here; main.js only calls the high-level exports.

const MIN_WIDTH  = 1000
const MIN_HEIGHT = 700
const DEFAULT_WIDTH  = 1400
const DEFAULT_HEIGHT = 900

// Minimum px of the window's top edge that must intersect a work area for the
// window to be considered "reachable" (user can grab the title bar / drag region).
const REQUIRED_HEADER_PX = 50

// ── Internal helpers ──────────────────────────────────────────────────────────

function log(msg, detail) {
  const tag = '[windowManager]'
  if (detail !== undefined) {
    console.log(tag, msg, typeof detail === 'object' ? JSON.stringify(detail) : detail)
  } else {
    console.log(tag, msg)
  }
}

/**
 * Returns the intersection area (px²) of two axis-aligned rectangles.
 * Zero means they do not overlap.
 */
function intersectionArea(a, b) {
  const ox = Math.max(0, Math.min(a.x + a.width,  b.x + b.width)  - Math.max(a.x, b.x))
  const oy = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return ox * oy
}

/**
 * True when at least REQUIRED_HEADER_PX vertical pixels of the window's top
 * strip are visible on at least one connected display's work area.
 *
 * This is the minimum "reachability" check: the user must be able to grab the
 * drag region with a cursor.  The rest of the window may be off-screen (common
 * when a second monitor is disconnected) but we still consider it reachable if
 * the header is visible.
 */
function isOnScreen(bounds, screen) {
  if (
    !bounds ||
    !Number.isFinite(bounds.x) || !Number.isFinite(bounds.y) ||
    !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)
  ) {
    return false
  }

  // The "header strip" is the topmost REQUIRED_HEADER_PX rows of the window.
  const headerStrip = {
    x:      bounds.x,
    y:      bounds.y,
    width:  Math.max(bounds.width, 100), // treat very-narrow windows as 100px wide for the check
    height: REQUIRED_HEADER_PX,
  }

  return screen.getAllDisplays().some(({ workArea }) =>
    intersectionArea(headerStrip, workArea) > 0
  )
}

/**
 * Validates raw width/height from the persisted state.
 * Returns dimensions that satisfy the minimum constraints.
 */
function sanitizeDimensions(raw) {
  const w = Number.isFinite(raw?.width)  && raw.width  >= MIN_WIDTH  ? Math.round(raw.width)  : DEFAULT_WIDTH
  const h = Number.isFinite(raw?.height) && raw.height >= MIN_HEIGHT ? Math.round(raw.height) : DEFAULT_HEIGHT
  return { width: w, height: h }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Load the persisted window state from electron-store and validate it against
 * the currently connected displays.
 *
 * Returns an object ready to spread into BrowserWindow constructor options.
 * `x` and `y` are only included when the saved position is provably on a
 * connected display — otherwise they are omitted so Electron centres the window.
 *
 * Options:
 *   wasCrash {boolean} — skip the saved position and centre unconditionally
 *                        (call with true when a previous crash is detected).
 */
function loadWindowState(store, screen, { wasCrash = false } = {}) {
  const raw = store.get('windowState', {})

  log('Saved window state:', raw)
  log('Connected display work areas:', screen.getAllDisplays().map(d => ({
    id: d.id, workArea: d.workArea, scaleFactor: d.scaleFactor,
  })))

  const { width, height } = sanitizeDimensions(raw)
  const isMaximized = !!raw.isMaximized

  // ── Crash recovery ─────────────────────────────────────────────────────────
  if (wasCrash) {
    log('RECOVERY: Previous session crashed — ignoring saved position, centering on primary display.')
    return { width, height, isMaximized }
  }

  // ── Dimension-only validity ─────────────────────────────────────────────────
  const hasPosition = Number.isFinite(raw.x) && Number.isFinite(raw.y)

  if (!hasPosition) {
    log('No saved position — using default size, window will center.')
    return { width, height, isMaximized }
  }

  const boundsToTest = { x: raw.x, y: raw.y, width, height }

  // ── Display-bounds validation ───────────────────────────────────────────────
  if (isOnScreen(boundsToTest, screen)) {
    log('Saved position is on-screen — restoring.', boundsToTest)
    return { x: raw.x, y: raw.y, width, height, isMaximized }
  }

  // Position is off-screen (monitor removed, resolution changed, etc.)
  log('RECOVERY: Saved position is off-screen — centering instead.', {
    saved: { x: raw.x, y: raw.y, width, height },
    reason: 'No display work area intersects the window header strip.',
  })
  return { width, height, isMaximized }
}

/**
 * Persist the current window state to electron-store.
 * Only captures bounds when the window is in a restored (non-maximized) state,
 * because getBounds() while maximised returns the full-screen size which would
 * become the "normal" size on the next launch.
 */
function saveWindowState(win, store) {
  if (!win || win.isDestroyed()) return
  const maximized = win.isMaximized()
  const existing  = store.get('windowState', {})
  const next = { ...existing, isMaximized: maximized }
  if (!maximized) {
    const b = win.getBounds()
    next.x = b.x; next.y = b.y; next.width = b.width; next.height = b.height
  }
  store.set('windowState', next)
}

/**
 * Ensure the given BrowserWindow is visible on a connected display.
 * Safe to call after a display-removed or display-metrics-changed event.
 * Does nothing if the window is already on-screen, maximised, or minimised.
 */
function enforceOnScreen(win, screen) {
  if (!win || win.isDestroyed()) return
  if (win.isMaximized() || win.isMinimized()) return  // these states are always "reachable"

  const bounds = win.getBounds()
  if (isOnScreen(bounds, screen)) return

  log('RECOVERY: Window is off-screen after display change — centering.', {
    bounds,
    displays: screen.getAllDisplays().map(d => d.workArea),
  })
  win.center()
}

module.exports = {
  loadWindowState,
  saveWindowState,
  enforceOnScreen,
  isOnScreen,
  MIN_WIDTH,
  MIN_HEIGHT,
}
