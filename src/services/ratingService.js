import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { firebaseAuth, firestoreDb } from '../firebase/firebase.js'
import { timestampToIso } from '../utils/timestamps.js'

export function ratingDocumentId(userId, resourceId) {
  return `${userId}__${resourceId}`
}

function normaliseRating(snapshot) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    userId: data.userId,
    resourceId: data.resourceId,
    score: data.score,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

export function subscribeToRatings(onData, onError) {
  return onSnapshot(
    collection(firestoreDb, 'ratings'),
    (snapshot) => onData(snapshot.docs.map(normaliseRating)),
    onError,
  )
}

export async function submitOrUpdateRating(resourceId, score) {
  const firebaseUser = firebaseAuth.currentUser

  if (!firebaseUser) {
    throw new Error('Login is required before submitting a rating.')
  }

  const reference = doc(
    firestoreDb,
    'ratings',
    ratingDocumentId(firebaseUser.uid, resourceId),
  )

  await runTransaction(firestoreDb, async (transaction) => {
    const snapshot = await transaction.get(reference)

    if (snapshot.exists()) {
      transaction.update(reference, {
        score,
        updatedAt: serverTimestamp(),
      })
      return
    }

    transaction.set(reference, {
      userId: firebaseUser.uid,
      resourceId,
      score,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
}
