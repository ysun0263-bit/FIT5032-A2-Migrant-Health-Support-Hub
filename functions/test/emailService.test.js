import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sendBulkEmails, sendSingleEmail } from '../services/emailService.js'

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

test('bulk delivery sends one private message per recipient', async () => {
  const deliveries = []
  const attachment = {
    filename: 'guide.txt',
    contentType: 'text/plain',
    base64: Buffer.from('guide').toString('base64'),
  }
  const result = await sendBulkEmails({
    recipients: [
      { userId: 'uid-a', email: 'a@example.test' },
      { userId: 'uid-b', email: 'b@example.test' },
    ],
    subject: 'Private update',
    message: 'One recipient per delivery.',
    attachment,
    deliver: async (payload) => {
      deliveries.push(payload)
      return { id: `mock-${deliveries.length}`, provider: 'mock' }
    },
  })

  assert.equal(result.sentCount, 2)
  assert.equal(result.failedCount, 0)
  assert.deepEqual(deliveries.map(({ to }) => to), ['a@example.test', 'b@example.test'])
  deliveries.forEach((delivery) => {
    assert.equal(typeof delivery.to, 'string')
    assert.equal('cc' in delivery, false)
    assert.equal('bcc' in delivery, false)
    assert.deepEqual(delivery.attachment, attachment)
  })
})

test('bulk delivery returns partial success when one provider call fails', async () => {
  const recipients = ['a', 'b', 'c'].map((name) => ({
    userId: `uid-${name}`,
    email: `${name}@example.test`,
  }))
  const result = await sendBulkEmails({
    recipients,
    subject: 'Partial delivery',
    message: 'Continue after one failure.',
    deliver: async ({ to }) => {
      if (to === 'b@example.test') throw new Error('simulated provider failure')
      return { id: `mock-${to}`, provider: 'mock' }
    },
  })

  assert.equal(result.sentCount, 2)
  assert.equal(result.failedCount, 1)
  assert.deepEqual(result.results, [
    { userId: 'uid-a', status: 'sent' },
    { userId: 'uid-b', status: 'failed' },
    { userId: 'uid-c', status: 'sent' },
  ])
})

test('bulk delivery never exceeds the configured concurrency', async () => {
  let activeDeliveries = 0
  let maximumActiveDeliveries = 0
  const recipients = Array.from({ length: 12 }, (_, index) => ({
    userId: `uid-${index}`,
    email: `user-${index}@example.test`,
  }))

  const result = await sendBulkEmails({
    recipients,
    subject: 'Concurrency test',
    message: 'Limited worker pool.',
    concurrency: 4,
    deliver: async () => {
      activeDeliveries += 1
      maximumActiveDeliveries = Math.max(maximumActiveDeliveries, activeDeliveries)
      await new Promise((resolve) => setTimeout(resolve, 2))
      activeDeliveries -= 1
    },
  })

  assert.equal(result.sentCount, 12)
  assert.equal(maximumActiveDeliveries, 4)
})
