import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  createAuthHeaders,
} from '../auth'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

// Mock window object and localStorage
Object.defineProperty(global, 'window', {
  value: {
    localStorage: localStorageMock,
  },
  writable: true,
})

// Mock localStorage globally since auth functions access it directly
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('Auth Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage mocks
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  describe('getAuthToken', () => {
    it('returns token from localStorage when window is defined', () => {
      const mockToken = 'test-token-123'
      localStorageMock.getItem.mockReturnValue(mockToken)

      const result = getAuthToken()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth-token')
      expect(result).toBe(mockToken)
    })

    it('returns null when token is not in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = getAuthToken()

      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth-token')
      expect(result).toBeNull()
    })

    it('returns null when window is undefined (SSR)', () => {
      const originalWindow = global.window
      const originalLocalStorage = global.localStorage
      delete (global as any).window
      delete (global as any).localStorage

      const result = getAuthToken()

      expect(result).toBeNull()
      
      global.window = originalWindow
      global.localStorage = originalLocalStorage
    })

    it('handles empty string token', () => {
      localStorageMock.getItem.mockReturnValue('')

      const result = getAuthToken()

      expect(result).toBe('')
    })
  })

  describe('setAuthToken', () => {
    it('sets token in localStorage when window is defined', () => {
      const token = 'new-test-token'

      setAuthToken(token)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', token)
    })

    it('does not call localStorage when window is undefined (SSR)', () => {
      const originalWindow = global.window
      const originalLocalStorage = global.localStorage
      delete (global as any).window
      delete (global as any).localStorage
      const token = 'test-token'

      setAuthToken(token)

      // Since we deleted both window and localStorage, setItem should not be called
      expect(() => setAuthToken(token)).not.toThrow()
      
      global.window = originalWindow
      global.localStorage = originalLocalStorage
    })

    it('handles empty string token', () => {
      const token = ''

      setAuthToken(token)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', '')
    })

    it('handles very long token', () => {
      const longToken = 'a'.repeat(1000)

      setAuthToken(longToken)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', longToken)
    })
  })

  describe('removeAuthToken', () => {
    it('removes token from localStorage when window is defined', () => {
      removeAuthToken()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token')
    })

    it('does not call localStorage when window is undefined (SSR)', () => {
      const originalWindow = global.window
      const originalLocalStorage = global.localStorage
      delete (global as any).window
      delete (global as any).localStorage

      removeAuthToken()

      // Since we deleted both window and localStorage, removeItem should not be called
      expect(() => removeAuthToken()).not.toThrow()
      
      global.window = originalWindow
      global.localStorage = originalLocalStorage
    })
  })

  describe('createAuthHeaders', () => {
    it('returns headers with Authorization when token exists', () => {
      const mockToken = 'valid-jwt-token'
      localStorageMock.getItem.mockReturnValue(mockToken)

      const headers = createAuthHeaders()

      expect(headers).toEqual({
        'Authorization': `Bearer ${mockToken}`,
      })
    })

    it('returns empty headers when token is null', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const headers = createAuthHeaders()

      expect(headers).toEqual({})
    })

    it('returns empty headers when token is empty string', () => {
      localStorageMock.getItem.mockReturnValue('')

      const headers = createAuthHeaders()

      expect(headers).toEqual({})
    })

    it('returns empty headers when window is undefined (SSR)', () => {
      const originalWindow = global.window
      const originalLocalStorage = global.localStorage
      delete (global as any).window
      delete (global as any).localStorage

      const headers = createAuthHeaders()

      expect(headers).toEqual({})
      
      global.window = originalWindow
      global.localStorage = originalLocalStorage
    })

    it('handles token with special characters', () => {
      const specialToken = 'token.with-special_chars123'
      localStorageMock.getItem.mockReturnValue(specialToken)

      const headers = createAuthHeaders()

      expect(headers).toEqual({
        'Authorization': `Bearer ${specialToken}`,
      })
    })

    it('properly formats Authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      localStorageMock.getItem.mockReturnValue(token)

      const headers = createAuthHeaders()

      expect(headers['Authorization']).toBe(`Bearer ${token}`)
      expect(headers['Authorization']).toMatch(/^Bearer .+/)
    })
  })

  describe('Integration tests', () => {
    it('handles complete auth flow', () => {
      const token = 'integration-test-token'

      // Initially no token
      localStorageMock.getItem.mockReturnValue(null)
      expect(getAuthToken()).toBeNull()
      expect(createAuthHeaders()).toEqual({})

      // Set token
      setAuthToken(token)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', token)

      // Get token after setting
      localStorageMock.getItem.mockReturnValue(token)
      expect(getAuthToken()).toBe(token)
      expect(createAuthHeaders()).toEqual({
        'Authorization': `Bearer ${token}`,
      })

      // Remove token
      removeAuthToken()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token')

      // Verify token is gone
      localStorageMock.getItem.mockReturnValue(null)
      expect(getAuthToken()).toBeNull()
      expect(createAuthHeaders()).toEqual({})
    })

    it('handles SSR environment throughout auth flow', () => {
      const originalWindow = global.window
      const originalLocalStorage = global.localStorage
      delete (global as any).window
      delete (global as any).localStorage

      expect(getAuthToken()).toBeNull()
      expect(createAuthHeaders()).toEqual({})

      // These should not throw in SSR environment
      expect(() => setAuthToken('test-token')).not.toThrow()
      expect(() => removeAuthToken()).not.toThrow()
      
      global.window = originalWindow
      global.localStorage = originalLocalStorage
    })
  })

  describe('Error handling', () => {
    it('handles localStorage exceptions gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      expect(() => getAuthToken()).toThrow('localStorage not available')
    })

    it('handles localStorage setItem exceptions', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      expect(() => setAuthToken('token')).toThrow('Storage quota exceeded')
    })

    it('handles localStorage removeItem exceptions', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Cannot remove item')
      })

      expect(() => removeAuthToken()).toThrow('Cannot remove item')
    })
  })
})