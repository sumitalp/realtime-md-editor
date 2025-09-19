import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock imports will be handled in individual test files as needed

// Mock Socket.io
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}))

// Mock Yjs and collaborative editing
jest.mock('yjs', () => ({
  Doc: jest.fn(() => ({
    getText: jest.fn(() => ({
      insert: jest.fn(),
      delete: jest.fn(),
      observe: jest.fn(),
      unobserve: jest.fn(),
      toString: jest.fn(() => ''),
    })),
    destroy: jest.fn(),
  })),
}))

jest.mock('y-websocket', () => ({
  WebsocketProvider: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    destroy: jest.fn(),
  })),
}))

// Mock CodeMirror
jest.mock('@uiw/react-codemirror', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea
      data-testid="codemirror-editor"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}))

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}