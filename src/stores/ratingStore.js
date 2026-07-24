import { ref } from 'vue'
import { healthResources } from '../data/healthResources.js'
import { createId } from '../utils/ids.js'
import { RATINGS_STORAGE_KEY, readStorageArray, writeStorageArray } from '../utils/storage.js'
import { currentUser, getInternalUsersForValidation } from './authStore.js'

const ratings = ref([])

function isValidScore(score) {
  return Number.isInteger(score) && score >= 1 && score <= 5
}

function resourceExists(resourceId) {
  return healthResources.some((resource) => resource.id === resourceId)
}

function activeUserExists(userId) {
  return getInternalUsersForValidation().some((user) => user.id === userId && user.active)
}

function isValidRating(rating) {
  return (
    rating &&
    typeof rating.id === 'string' &&
    typeof rating.resourceId === 'string' &&
    typeof rating.userId === 'string' &&
    isValidScore(rating.score) &&
    resourceExists(rating.resourceId) &&
    activeUserExists(rating.userId)
  )
}

function persist() {
  writeStorageArray(RATINGS_STORAGE_KEY, ratings.value)
}

export function initialiseRatings() {
  const seen = new Set()
  ratings.value = readStorageArray(RATINGS_STORAGE_KEY).filter((rating) => {
    if (!isValidRating(rating)) {
      return false
    }

    const key = `${rating.resourceId}:${rating.userId}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
  persist()
}

export function useRatings() {
  if (!ratings.value.length) {
    initialiseRatings()
  }

  function getRatingsForResource(resourceId) {
    if (!resourceExists(resourceId)) {
      return []
    }

    return ratings.value.filter((rating) => rating.resourceId === resourceId && isValidRating(rating))
  }

  function getUserRating(resourceId, userId) {
    if (!resourceExists(resourceId) || !activeUserExists(userId)) {
      return null
    }

    return (
      ratings.value.find((rating) => rating.resourceId === resourceId && rating.userId === userId) ??
      null
    )
  }

  function submitOrUpdateRating(resourceId, userId, score) {
    const numericScore = Number(score)

    if (!resourceExists(resourceId)) {
      throw new Error('This resource is not available for rating.')
    }

    if (!currentUser.value || currentUser.value.id !== userId || !activeUserExists(userId)) {
      throw new Error('Login is required before submitting a rating.')
    }

    if (!isValidScore(numericScore)) {
      throw new Error('Choose a whole-number rating from 1 to 5.')
    }

    const existingRating = ratings.value.find(
      (rating) => rating.resourceId === resourceId && rating.userId === userId,
    )
    const now = new Date().toISOString()

    if (existingRating) {
      ratings.value = ratings.value.map((rating) =>
        rating.id === existingRating.id ? { ...rating, score: numericScore, updatedAt: now } : rating,
      )
    } else {
      ratings.value = [
        {
          id: createId('rating'),
          resourceId,
          userId,
          score: numericScore,
          createdAt: now,
          updatedAt: now,
        },
        ...ratings.value,
      ]
    }

    persist()
    return getUserRating(resourceId, userId)
  }

  function getRatingCount(resourceId) {
    return getRatingsForResource(resourceId).length
  }

  function getAverageRating(resourceId) {
    const resourceRatings = getRatingsForResource(resourceId)

    if (!resourceRatings.length) {
      return null
    }

    const total = resourceRatings.reduce((sum, rating) => sum + rating.score, 0)
    return Math.round((total / resourceRatings.length) * 10) / 10
  }

  function getRatingDistribution(resourceId) {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

    getRatingsForResource(resourceId).forEach((rating) => {
      distribution[rating.score] += 1
    })

    return distribution
  }

  return {
    ratings,
    getRatingsForResource,
    getUserRating,
    submitOrUpdateRating,
    getAverageRating,
    getRatingCount,
    getRatingDistribution,
  }
}
