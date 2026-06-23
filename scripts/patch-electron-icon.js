// Patches the dev Electron runtime so the taskbar shows the app icon instead
// of the default Electron atom in dev mode.
//
// Strategy: copy electron.exe → SmartNotepad.exe, patch that copy's icon and
// version strings, then update node_modules/electron/path.txt so `electron .`
// launches SmartNotepad.exe. Windows uses the exe name + embedded icon for
// taskbar grouping, so renaming it is the reliable fix for dev-mode icons.
//
// Run once after npm install: node scripts/patch-electron-icon.js

const { rcedit } = require('rcedit')
const path = require('path')
const fs   = require('fs')

const distDir     = path.join(__dirname, '..', 'node_modules', 'electron', 'dist')
const electronExe = path.join(distDir, 'electron.exe')
const targetExe   = path.join(distDir, 'blott.exe')
const pathTxt     = path.join(__dirname, '..', 'node_modules', 'electron', 'path.txt')
const iconFile    = path.join(__dirname, '..', 'assets', 'icon.ico')

// Copy electron.exe → SmartNotepad.exe (fresh copy each run)
fs.copyFileSync(electronExe, targetExe)

rcedit(targetExe, {
  icon: iconFile,
  'version-string': {
    ProductName:      'blott',
    FileDescription:  'blott',
    OriginalFilename: 'blott.exe',
  },
  'file-version':    '1.0.0.0',
  'product-version': '1.0.0.0',
})
.then(() => {
  // Point electron's module resolver at our renamed exe
  fs.writeFileSync(pathTxt, 'blott.exe')
  console.log('✓ blott.exe created and icon patched')
  console.log('✓ path.txt updated — restart the app to see the change')
})
.catch(err => {
  try { fs.unlinkSync(targetExe) } catch {}
  console.error('✗ patch failed:', err.message)
})
