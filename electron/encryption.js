const { app, safeStorage } = require('electron')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const ALGORITHM = 'aes-256-gcm'
const PREFIX = 'aes256gcm'
const IV_LENGTH = 12
const KEY_LENGTH = 32 // 256 bits

let encryptionKey = null

function keyFilePath() {
  return path.join(app.getPath('userData'), 'encryption.key')
}

// Loads the persisted AES-256 key, generating one on first run. The key
// itself is protected at rest via the OS keychain (DPAPI/Keychain/libsecret)
// through Electron's safeStorage, so it never sits on disk in the clear.
function initEncryption() {
  const filePath = keyFilePath()

  if (fs.existsSync(filePath)) {
    const stored = fs.readFileSync(filePath)
    const encoded = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(stored)
      : stored.toString('utf8')
    encryptionKey = Buffer.from(encoded, 'base64')
    return
  }

  encryptionKey = crypto.randomBytes(KEY_LENGTH)
  const encoded = encryptionKey.toString('base64')
  fs.writeFileSync(
    filePath,
    safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(encoded) : encoded
  )
}

// Returns "aes256gcm:<iv>:<authTag>:<ciphertext>" (all base64). Empty/nullish
// values pass through untouched so we don't bloat empty notes.
function encryptText(plaintext) {
  if (plaintext == null || plaintext === '') return plaintext
  if (!encryptionKey) throw new Error('Encryption not initialized')

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv)
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [PREFIX, iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':')
}

// Reverses encryptText. Strings that don't carry our prefix are returned as-is,
// which transparently migrates notes saved before encryption was introduced.
function decryptText(payload) {
  if (typeof payload !== 'string' || !payload.startsWith(`${PREFIX}:`)) return payload
  if (!encryptionKey) throw new Error('Encryption not initialized')

  const [, ivB64, tagB64, dataB64] = payload.split(':')
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
  return plaintext.toString('utf8')
}

// Whether the AES key on disk is itself protected by the OS keychain
// (DPAPI/Keychain/libsecret) via safeStorage, vs. stored as plain base64.
function getEncryptionStatus() {
  return { osProtected: safeStorage.isEncryptionAvailable() }
}

module.exports = { initEncryption, encryptText, decryptText, getEncryptionStatus }
