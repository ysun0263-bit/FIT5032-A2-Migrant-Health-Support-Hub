import { ref } from 'vue'
import { healthResources } from '../data/healthResources.js'
import {
  submitOrUpdateRating as persistRating,
  subscribeToRatings,
} from '../services/ratingService.js'
import { currentUser } from './authStore.js'

const ratings = ref([])
const ratingsLoading = ref(true)
const ratingsError = ref('')

let unsubscribeRatings

function isValidScore(score) {
  return Number.isInteger(score) && score >= 1 && score <= 5
}

function resourceExists(resourceId) {
  return healthResources.some((resource) => resource.id === resourceId)
}

function isValidRating(rating) {
  return (
    rating &&
    typeof rating.id === 'string' &&
    typeof rating.resourceId === 'string' &&
    typeof rating.userId === 'string' &&
    isValidScore(rating.score) &&
    resourceExists(rating.resourceId)
  )
}

export function initialiseRatings() {
  if (unsubscribeRatings) {
    return
  }

  ratingsLoading.value = true
  ratingsError.value = ''
  unsubscribeRatings = subscribeToRatings(
    (nextRatings) => {
      ratings.value = nextRatings.filter(isValidRating)
      ratingsLoading.value = false
    },
    () => {
      ratings.value = []
      ratingsError.value = 'Ratings could not be loaded.'
      ratingsLoading.value = false
    },
  )
}

export function useRatings() {
  initialiseRatings()

  function getRatingsForResource(resourceId) {
    if (!resourceExists(resourceId)) {
      return []
    }

    return ratings.value.filter(
      (rating) => rating.resourceId === resourceId && isValidRating(rating),
    )
  }

  function getUserRating(resourceId, userId) {
    if (!resourceExists(resourceId) || typeof userId !== 'string') {
      return null
    }

    return (
      ratings.value.find(
        (rating) => rating.resourceId === resourceId && rating.userId === userId,
      ) ?? null
    )
  }

  async function submitOrUpdateRating(resourceId, userId, score) {
    const numericScore = Number(score)

    if (!resourceExists(resourceId)) {
      throw new Error('This resource is not available for rating.')
    }

    if (!currentUser.value?.active || currentUser.value.uid !== userId) {
      throw new Error('Login is required before submitting a rating.')
    }

    if (!isValidScore(numericScore)) {
      throw new Error('Choose a whole-number rating from 1 to 5.')
    }

    ratingsError.value = ''

    try {
      await persistRating(resourceId, numericScore)
    } catch {
      ratingsError.value = 'The rating could not be saved.'
      throw new Error(ratingsError.value)
    }
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
    ratingsLoading,
    ratingsError,
    getRatingsForResource,
    getUserRating,
    submitOrUpdateRating,
    getAverageRating,
    getRatingCount,
    getRatingDistribution,
  }
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubscribeRatings?.()
    unsubscribeRatings = undefined
  })
}
