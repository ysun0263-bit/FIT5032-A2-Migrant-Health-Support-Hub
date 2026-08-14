import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sendSingleEmail } from '../services/emailService.js'

test('mock provider returns evidence without a network request', async () => {
  const result = await sendSingleEmail({
    to: 'recipient@example.test',
    subject: 'Mock message',
    message: 'No provider request is made.',
    mode: 'mock',
  })

  assert.equal(result.provider, 'mock')
  assert.match(result.id, /^mock-/)
})
