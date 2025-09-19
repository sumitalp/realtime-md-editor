import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LoginPage from '../page'
import { useAuthStore } from '@/store/authStore'

// Mock the hooks at the module level
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => ''),
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}))

describe('LoginPage', () => {
  const mockLogin = jest.fn()
  const mockClearError = jest.fn()
  const mockPush = jest.fn()

  const defaultAuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: mockLogin,
    logout: jest.fn(),
    register: jest.fn(),
    clearError: mockClearError,
    checkAuth: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock implementations
    const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
    const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    
    mockedUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      refresh: jest.fn(),
      forward: jest.fn(),
    })
    
    mockedUseAuthStore.mockReturnValue(defaultAuthState)
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText("Don't have an account? Sign up")).toBeInTheDocument()
  })

  it('redirects to dashboard if already authenticated', () => {
    const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    mockedUseAuthStore.mockReturnValue({
      ...defaultAuthState,
      isAuthenticated: true,
    })

    render(<LoginPage />)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('clears errors on component mount', () => {
    render(<LoginPage />)

    expect(mockClearError).toHaveBeenCalled()
  })

  it('updates email and password fields correctly', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('submits form with correct credentials', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(mockClearError).toHaveBeenCalled()
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('prevents form submission with empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    // Should not call login with empty fields (HTML5 validation will prevent this)
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('shows loading state during authentication', () => {
    const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    mockedUseAuthStore.mockReturnValue({
      ...defaultAuthState,
      isLoading: true,
    })

    render(<LoginPage />)

    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('displays error message when authentication fails', () => {
    const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    const mockError = { message: 'Invalid credentials' }
    mockedUseAuthStore.mockReturnValue({
      ...defaultAuthState,
      error: mockError,
    })

    render(<LoginPage />)

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('clears error when form is resubmitted', async () => {
    const user = userEvent.setup()
    const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    mockedUseAuthStore.mockReturnValue({
      ...defaultAuthState,
      error: { message: 'Previous error' },
    })

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(mockClearError).toHaveBeenCalledTimes(2) // Once on mount, once on submit
  })

  it('handles login failure correctly', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockLogin.mockRejectedValue(new Error('Network error'))

    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })

  it('has proper form accessibility attributes', () => {
    render(<LoginPage />)

    const form = document.querySelector('form')
    expect(form).toBeInTheDocument()

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('autoComplete', 'email')
    expect(emailInput).toHaveAttribute('required')

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
    expect(passwordInput).toHaveAttribute('required')
  })

  it('navigates to register page when signup link is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const signupLink = screen.getByText("Don't have an account? Sign up")
    expect(signupLink.closest('a')).toHaveAttribute('href', '/register')
  })

  it('handles keyboard navigation correctly', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Tab through form elements
    await user.tab()
    expect(emailInput).toHaveFocus()

    await user.tab()
    expect(passwordInput).toHaveFocus()

    await user.tab()
    expect(submitButton).toHaveFocus()
  })

  it('prevents multiple submissions while loading', async () => {
    const user = userEvent.setup()
    const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    mockedUseAuthStore.mockReturnValue({
      ...defaultAuthState,
      isLoading: true,
    })

    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /signing in/i })
    expect(submitButton).toBeDisabled()

    await user.click(submitButton)
    expect(mockLogin).not.toHaveBeenCalled()
  })
})