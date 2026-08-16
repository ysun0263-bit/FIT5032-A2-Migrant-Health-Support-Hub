import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createConnectivityState } from '../src/composables/useConnectivity.js'

function fakeBrowser(initialOnline = true) {
  const listeners = new Map()
  const navigatorSource = { onLine: initialOnline }
  const eventTarget = {
    addEventListener(type, listener) {
      listeners.set(type, listener)
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type)
    },
  }
  return {
    eventTarget,
    navigatorSource,
    dispatch(type) {
      navigatorSource.onLine = type === 'online'
      listeners.get(type)?.()
    },
    listenerCount() {
      return listeners.size
    },
  }
}

test('connectivity uses the initial browser online state', () => {
  const browser = fakeBrowser(true)
  const connectivity = createConnectivityState(browser)
  assert.equal(connectivity.isOnline.value, true)
})

test('offline event updates connectivity state', () => {
  const browser = fakeBrowser(true)
  const connectivity = createConnectivityState(browser)
  connectivity.start()
  browser.dispatch('offline')
  assert.equal(connectivity.isOnline.value, false)
})

test('online event restores connectivity state', () => {
  const browser = fakeBrowser(false)
  const connectivity = createConnectivityState(browser)
  connectivity.start()
  browser.dispatch('online')
  assert.equal(connectivity.isOnline.value, true)
})

test('connectivity listeners are removed on stop', () => {
  const browser = fakeBrowser(true)
  const connectivity = createConnectivityState(browser)
  connectivity.start()
  assert.equal(browser.listenerCount(), 2)
  connectivity.stop()
  assert.equal(browser.listenerCount(), 0)
})
