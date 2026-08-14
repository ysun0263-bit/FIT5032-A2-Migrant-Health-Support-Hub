import path from 'node:path'

export const MAX_SUBJECT_LENGTH = 150
export const MAX_MESSAGE_LENGTH = 10_000
export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024
export const MAX_FILENAME_LENGTH = 120

export const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/csv',
  'text/plain',
])

const MIME_BY_EXTENSION = new Map([
  ['.pdf', 'application/pdf'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.csv', 'text/csv'],
  ['.txt', 'text/plain'],
])

export class ValidationError extends Error {}

function requireTrimmedString(value, label, maxLength) {
  if (typeof value !== 'string') {
    throw new ValidationError(`${label} must be text.`)
  }

  const trimmed = value.trim()
  if (!trimmed) {
    throw new ValidationError(`${label} is required.`)
  }
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${label} must be ${maxLength.toLocaleString('en-US')} characters or fewer.`)
  }
  return trimmed
}

function validEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function canonicalBase64(value) {
  if (
    typeof value !== 'string' ||
    !value.length ||
    value.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
  ) {
    throw new ValidationError('Attachment content is not valid base64.')
  }

  const bytes = Buffer.from(value, 'base64')
  if (!bytes.length || bytes.toString('base64') !== value) {
    throw new ValidationError('Attachment content is not valid base64.')
  }
  if (bytes.length > MAX_ATTACHMENT_BYTES) {
    throw new ValidationError('Attachment must be 3 MB or smaller.')
  }
  return { base64: value, size: bytes.length }
}

export function validateAttachment(attachment) {
  if (attachment == null) {
    return undefined
  }
  if (typeof attachment !== 'object' || Array.isArray(attachment)) {
    throw new ValidationError('Attachment is invalid.')
  }

  const filename = requireTrimmedString(
    attachment.filename,
    'Attachment filename',
    MAX_FILENAME_LENGTH,
  )
  if (
    filename === '.' ||
    filename === '..' ||
    filename.includes('/') ||
    filename.includes('\\') ||
    path.basename(filename) !== filename
  ) {
    throw new ValidationError('Attachment filename must not contain a path.')
  }

  const extension = path.extname(filename).toLowerCase()
  const suppliedType = typeof attachment.contentType === 'string'
    ? attachment.contentType.trim().toLowerCase()
    : ''
  const expectedType = MIME_BY_EXTENSION.get(extension)
  const contentType = suppliedType || expectedType

  if (!expectedType || !contentType || !ALLOWED_ATTACHMENT_TYPES.has(contentType)) {
    throw new ValidationError('Attachment type is not allowed.')
  }
  if (expectedType !== contentType) {
    throw new ValidationError('Attachment type does not match its filename.')
  }

  const encoded = canonicalBase64(attachment.base64)
  return { filename, contentType, ...encoded }
}

export function validateEmailPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Email request is invalid.')
  }

  const to = requireTrimmedString(data.to, 'Recipient email', 254).toLowerCase()
  if (!validEmailAddress(to)) {
    throw new ValidationError('Enter a valid recipient email address.')
  }

  return {
    to,
    subject: requireTrimmedString(data.subject, 'Subject', MAX_SUBJECT_LENGTH),
    message: requireTrimmedString(data.message, 'Message', MAX_MESSAGE_LENGTH),
    attachment: validateAttachment(data.attachment),
  }
}
