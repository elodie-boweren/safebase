import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { API_BASE_URL, ApiError, apiRequest, getToken, login, logout, setToken } from '../../src/services/api'

// minimal fetch Response
function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('session token', () => {
  test('logout removes the stored token (US00-07)', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')

    logout()
    expect(getToken()).toBeNull()
  })
})

describe('apiRequest', () => {
  test('sends the token as a Bearer header', async () => {
    setToken('abc')
    fetchMock.mockResolvedValue(jsonResponse(200, []))

    await apiRequest('/databases')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API_BASE_URL}/databases`)
    expect(options.headers.Authorization).toBe('Bearer abc')
  })

  test('without a token, no Authorization header is sent', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []))

    await apiRequest('/databases')

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
  })

  test('an API error becomes an ApiError with the server message and status', async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { error: 'Token invalide ou expiré' }))

    const error = await apiRequest('/databases').catch((err) => err)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(403)
    expect(error.message).toBe('Token invalide ou expiré')
  })

  test('API not reachable -> clear message with status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(apiRequest('/api/health')).rejects.toMatchObject({
      status: 0,
      message: "Impossible de joindre l'API. Est-elle démarrée ?",
    })
  })
})

describe('login', () => {
  test('valid credentials: the token is stored and the user returned (US00-04)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { token: 'jwt-token', user: { user_id: 1, email: 'emma@safebase.dev' } }))

    await expect(login('emma@safebase.dev', 'safebase123')).resolves.toEqual({ user_id: 1, email: 'emma@safebase.dev' })

    expect(getToken()).toBe('jwt-token')
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API_BASE_URL}/auth/login`)
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ email: 'emma@safebase.dev', password: 'safebase123' })
  })

  test('wrong password: no session is created (US00-05)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'Identifiants invalides' }))

    await expect(login('emma@safebase.dev', 'wrong')).rejects.toMatchObject({ status: 401 })
    expect(getToken()).toBeNull()
  })
})
