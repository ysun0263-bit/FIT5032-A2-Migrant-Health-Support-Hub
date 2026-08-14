import { httpsCallable } from 'firebase/functions'
import { firebaseFunctions } from '../firebase/firebase.js'

export const MAX_EMAIL_ATTACHMENT_BYTES = 3 * 1024 * 1024
export const EMAIL_ATTACHMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg,.csv,.txt'

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/csv',
  'text/plain',
])
const TYPE_BY_EXTENSION = new Map([
  ['pdf', 'application/pdf'],
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['csv', 'text/csv'],
  ['txt', 'text/plain'],
])

function extension(filename) {
  return filename.split('.').at(-1)?.toLowerCase() ?? ''
}

export function validateEmailAttachment(file) {
  if (!file) {
    return ''
  }

  const inferredType = TYPE_BY_EXTENSION.get(extension(file.name))
  const contentType = file.type || inferredType
  if (!inferredType || !contentType || !ALLOWED_TYPES.has(contentType) || inferredType !== contentType) {
    return 'Choose a PDF, PNG, JPEG, CSV, or TXT attachment.'
  }
  if (file.size > MAX_EMAIL_ATTACHMENT_BYTES) {
    return 'Attachment must be 3 MB or smaller.'
  }
  return ''
}

export function validateEmailForm({ to, subject, message, attachment }) {
  const errors = {}
  const recipient = to.trim()
  const trimmedSubject = subject.trim()
  const trimmedMessage = message.trim()

  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) || recipient.length > 254) {
    errors.to = 'Enter one valid recipient email address.'
  }
  if (!trimmedSubject || trimmedSubject.length > 150) {
    errors.subject = 'Enter a subject between 1 and 150 characters.'
  }
  if (!trimmedMessage || trimmedMessage.length > 10_000) {
    errors.message = 'Enter a message between 1 and 10,000 characters.'
  }

  const attachmentError = validateEmailAttachment(attachment)
  if (attachmentError) {
    errors.attachment = attachmentError
  }
  return errors
}

async function encodeAttachment(file) {
  if (!file) {
    return undefined
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  const chunkSize = 32_768
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return {
    filename: file.name,
    contentType: file.type || TYPE_BY_EXTENSION.get(extension(file.name)),
    base64: btoa(binary),
  }
}

function friendlyCallableError(error) {
  if (error?.code === 'functions/unauthenticated') {
    return 'Your session has expired. Sign in and try again.'
  }
  if (error?.code === 'functions/permission-denied') {
    return 'An active administrator account is required.'
  }
  if (error?.code === 'functions/invalid-argument') {
    return error.message || 'Review the email details and attachment.'
  }
  if (error?.code === 'functions/failed-precondition') {
    return 'Email delivery has not been configured.'
  }
  return 'The email could not be sent. Please try again.'
}

export async function sendAdminEmail({ to, subject, message, attachment }) {
  const callable = httpsCallable(firebaseFunctions, 'sendEmail')

  try {
    const response = await callable({
      to: to.trim(),
      subject: subject.trim(),
      message: message.trim(),
      attachment: await encodeAttachment(attachment),
    })
    return response.data
  } catch (error) {
    throw new Error(friendlyCallableError(error))
  }
}
