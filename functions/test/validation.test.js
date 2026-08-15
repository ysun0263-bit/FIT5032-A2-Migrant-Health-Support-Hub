import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MAX_ATTACHMENT_BYTES,
  MAX_BULK_RECIPIENTS,
  ValidationError,
  validateBulkEmailPayload,
  validateEmailPayload,
} from '../utils/validation.js'

const validPayload = {
  to: 'recipient@example.test',
  subject: 'Appointment information',
  message: 'This is a plain-text coursework demonstration message.',
}

function expectValidationError(callback, pattern) {
  assert.throws(callback, (error) => error instanceof ValidationError && pattern.test(error.message))
}

test('1 valid email payload is normalised', () => {
  assert.deepEqual(validateEmailPayload({ ...validPayload, to: ' Recipient@Example.Test ' }), {
    ...validPayload,
    to: 'recipient@example.test',
    attachment: undefined,
  })
})

test('2 invalid recipient is rejected', () => {
  expectValidationError(() => validateEmailPayload({ ...validPayload, to: 'not-an-email' }), /valid recipient/i)
})

test('3 empty subject is rejected', () => {
  expectValidationError(() => validateEmailPayload({ ...validPayload, subject: '   ' }), /subject is required/i)
})

test('4 empty message is rejected', () => {
  expectValidationError(() => validateEmailPayload({ ...validPayload, message: '' }), /message is required/i)
})

test('5 oversized subject is rejected', () => {
  expectValidationError(() => validateEmailPayload({ ...validPayload, subject: 'S'.repeat(151) }), /150 characters/i)
})

test('6 oversized message is rejected', () => {
  expectValidationError(() => validateEmailPayload({ ...validPayload, message: 'M'.repeat(10_001) }), /10,000 characters/i)
})

test('7 allowed PDF attachment is decoded and measured', () => {
  const result = validateEmailPayload({
    ...validPayload,
    attachment: {
      filename: 'information.pdf',
      contentType: 'application/pdf',
      base64: Buffer.from('%PDF-test').toString('base64'),
    },
  })
  assert.equal(result.attachment.filename, 'information.pdf')
  assert.equal(result.attachment.contentType, 'application/pdf')
  assert.equal(result.attachment.size, 9)
})

test('8 executable filename is rejected even when its MIME claims PDF', () => {
  expectValidationError(
    () => validateEmailPayload({
      ...validPayload,
      attachment: {
        filename: 'malware.exe',
        contentType: 'application/pdf',
        base64: Buffer.from('test').toString('base64'),
      },
    }),
    /type is not allowed/i,
  )
})

test('9 attachment larger than 3 MB is rejected after decoding', () => {
  expectValidationError(
    () => validateEmailPayload({
      ...validPayload,
      attachment: {
        filename: 'large.pdf',
        contentType: 'application/pdf',
        base64: Buffer.alloc(MAX_ATTACHMENT_BYTES + 1, 1).toString('base64'),
      },
    }),
    /3 MB or smaller/i,
  )
})

test('10 path traversal filename is rejected', () => {
  expectValidationError(
    () => validateEmailPayload({
      ...validPayload,
      attachment: {
        filename: '../private.pdf',
        contentType: 'application/pdf',
        base64: Buffer.from('test').toString('base64'),
      },
    }),
    /must not contain a path/i,
  )
})

test('11 invalid base64 is rejected', () => {
  expectValidationError(
    () => validateEmailPayload({
      ...validPayload,
      attachment: {
        filename: 'information.pdf',
        contentType: 'application/pdf',
        base64: 'not valid base64!',
      },
    }),
    /valid base64/i,
  )
})

test('12 valid bulk request deduplicates recipient UIDs', () => {
  const result = validateBulkEmailPayload({
    recipientUserIds: ['uid-a', 'uid-a', 'uid-b'],
    subject: validPayload.subject,
    message: validPayload.message,
  })
  assert.deepEqual(result.recipientUserIds, ['uid-a', 'uid-b'])
  assert.equal(result.requestedCount, 3)
  assert.equal(result.duplicateCount, 1)
})

test('13 zero bulk recipients is rejected', () => {
  expectValidationError(
    () => validateBulkEmailPayload({
      recipientUserIds: [],
      subject: validPayload.subject,
      message: validPayload.message,
    }),
    /at least one active user/i,
  )
})

test('14 bulk request above the recipient limit is rejected', () => {
  expectValidationError(
    () => validateBulkEmailPayload({
      recipientUserIds: Array.from({ length: MAX_BULK_RECIPIENTS + 1 }, (_, index) => `uid-${index}`),
      subject: validPayload.subject,
      message: validPayload.message,
    }),
    /up to 50 users/i,
  )
})

test('15 bulk request reuses subject validation', () => {
  expectValidationError(
    () => validateBulkEmailPayload({
      recipientUserIds: ['uid-a'],
      subject: 'S'.repeat(151),
      message: validPayload.message,
    }),
    /150 characters/i,
  )
})

test('16 bulk request reuses message validation', () => {
  expectValidationError(
    () => validateBulkEmailPayload({
      recipientUserIds: ['uid-a'],
      subject: validPayload.subject,
      message: '',
    }),
    /message is required/i,
  )
})

test('17 bulk request reuses attachment validation', () => {
  expectValidationError(
    () => validateBulkEmailPayload({
      recipientUserIds: ['uid-a'],
      subject: validPayload.subject,
      message: validPayload.message,
      attachment: {
        filename: 'program.exe',
        contentType: 'application/pdf',
        base64: Buffer.from('test').toString('base64'),
      },
    }),
    /type is not allowed/i,
  )
})
