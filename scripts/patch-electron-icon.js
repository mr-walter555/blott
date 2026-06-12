// Patches the dev electron.exe with the custom app icon so pinned taskbar
// shortcuts show the right icon instead of the default Electron atom.
// Run once after npm install: node scripts/patch-electron-icon.js
//
// Strategy: copy electron.exe first (bypasses Windows Zone.Identifier lock),
// patch the copy, then replace the original.

const { rcedit } = require('rcedit')
const path = require('path')
const fs   = require('fs')

const electronExe = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')
const tmpExe      = path.join(__dirname, '..', 'assets', '_electron_patching.exe')
const iconFile    = path.join(__dirname, '..', 'assets', 'icon.ico')

fs.copyFileSync(electronExe, tmpExe)

rcedit(tmpExe, {
  icon: iconFile,
  'version-string': {
    ProductName:      'Smart Notepad',
    FileDescription:  'Smart Notepad',
    OriginalFilename: 'SmartNotepad.exe',
  },
  'file-version':    '1.0.0.0',
  'product-version': '1.0.0.0',
})
.then(() => {
  fs.copyFileSync(tmpExe, electronExe)
  fs.unlinkSync(tmpExe)
  console.log('✓ electron.exe icon patched — restart the app to see the change')
})
.catch(err => {
  try { fs.unlinkSync(tmpExe) } catch {}
  console.error('✗ patch failed:', err.message)
})
