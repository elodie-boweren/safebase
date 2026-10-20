/**
 * REST client for the SafeBase API.
 * Not used while the frontend is developed with static mocks.
 * Wire features to this module once the backend is available.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * @param {string} path - API path (e.g. "/api/health")
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `API error ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export { API_BASE_URL }
