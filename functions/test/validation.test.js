import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MAX_ATTACHMENT_BYTES,
  ValidationError,
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
