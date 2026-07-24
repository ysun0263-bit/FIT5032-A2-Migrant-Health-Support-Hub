const HASH_ITERATIONS = 120000
const HASH_ALGORITHM = 'SHA-256'

function requireCrypto() {
  const cryptoApi = globalThis.crypto

  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Secure password hashing is not available in this browser.')
  }

  return cryptoApi
}

function bytesToBase64(bytes) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToBytes(value) {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

export function generateSalt() {
  const cryptoApi = requireCrypto()
  const salt = new Uint8Array(16)
  cryptoApi.getRandomValues(salt)
  return bytesToBase64(salt)
}

export async function hashPassword(password, salt) {
  const cryptoApi = requireCrypto()
  const encoder = new TextEncoder()
  const keyMaterial = await cryptoApi.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await cryptoApi.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(salt),
      iterations: HASH_ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    256,
  )

  return bytesToBase64(new Uint8Array(derivedBits))
}

export async function verifyPassword(password, salt, expectedHash) {
  const actualHash = await hashPassword(password, salt)
  return actualHash === expectedHash
}
