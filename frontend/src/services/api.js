/**
 * REST client for the SafeBase API.
 * Auth and databases are wired; backups, schedules and alerts still use mocks.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const TOKEN_KEY = 'safebase_token'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable: the session only lasts until reload
  }
}

/**
 * @param {string} path - API path (e.g. "/api/health")
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
export async function apiRequest(path, options = {}) {
  const token = getToken()

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError("Impossible de joindre l'API. Est-elle démarrée ?", 0)
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message = (isJson && data?.error) || data || `API error ${response.status}`
    throw new ApiError(message, response.status, data)
  }

  return data
}

export async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return data.user
}

export function register(username, email, password) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}

export function logout() {
  setToken(null)
}

export function getDatabases() {
  return apiRequest('/databases')
}

export function createDatabase(database) {
  return apiRequest('/databases', {
    method: 'POST',
    body: JSON.stringify(database),
  })
}

export function deleteDatabase(databaseId, { force = false } = {}) {
  return apiRequest(`/databases/${databaseId}${force ? '?force=true' : ''}`, {
    method: 'DELETE',
  })
}

export function createBackup(databaseId) {
  return apiRequest(`/databases/${databaseId}/backup`, { method: 'POST' })
}

export function getBackups(databaseId) {
  return apiRequest(`/databases/${databaseId}/backups`)
}

export { API_BASE_URL }
