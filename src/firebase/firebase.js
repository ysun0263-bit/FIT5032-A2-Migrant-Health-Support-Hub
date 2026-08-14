import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
const demoProjectId = 'demo-migrant-health-hub'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (useEmulators ? 'demo-api-key' : ''),
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    (useEmulators ? `${demoProjectId}.firebaseapp.com` : ''),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (useEmulators ? demoProjectId : ''),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (useEmulators ? 'demo-app-id' : ''),
}

const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'appId']
const missingConfig = requiredConfig.filter((key) => !firebaseConfig[key])

if (missingConfig.length) {
  throw new Error(
    `Firebase configuration is incomplete. Add ${missingConfig.join(', ')} to .env.local.`,
  )
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)
export const firestoreDb = getFirestore(firebaseApp)
export const firebaseProjectId = firebaseConfig.projectId
export const usingFirebaseEmulators = useEmulators

const emulatorConnectionKey = '__migrantHealthHubFirebaseEmulatorsConnected__'

if (useEmulators && !globalThis[emulatorConnectionKey]) {
  connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(firestoreDb, '127.0.0.1', 8080)
  globalThis[emulatorConnectionKey] = true
}
