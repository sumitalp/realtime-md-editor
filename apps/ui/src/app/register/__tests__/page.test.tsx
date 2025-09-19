import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import RegisterPage from '../page'

// Mock the hooks at the module level
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => ''),
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}))

// Mock window.alert
const mockAlert = jest.fn()
global.alert = mockAlert

describe('RegisterPage', () => {
  const mockRegister = jest.fn()
  const mockClearError = jest.fn()
  const mockPush = jest.fn()

  const defaultAuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: mockRegister,
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

  it('renders registration form correctly', () => {
    render(<RegisterPage />)

    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByText('Join our collaborative platform')).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByText('Already have an account? Sign in')).toBeInTheDocument()
  })

  it('redirects to dashboard if already authenticated', () => {
    const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    mockedUseAuthStore.mockReturnValue({
      ...defaultAuthState,
      isAuthenticated: true,
    })

    render(<RegisterPage />)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('clears errors on component mount', () => {
    render(<RegisterPage />)

    expect(mockClearError).toHaveBeenCalled()
  })

  it('updates form fields correctly', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')

    expect(nameInput).toHaveValue('John Doe')
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
    expect(confirmPasswordInput).toHaveValue('password123')
  })

  it('submits form with correct data when passwords match', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue(undefined)

    render(<RegisterPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)

    expect(mockClearError).toHaveBeenCalled()
    expect(mockRegister).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'test@example.com',
      password: 'password123',
    })
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('shows alert when passwords do not match and form is submitted', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const form = document.querySelector('form')

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'different123')
    
    // Submit form directly since button will be disabled
    fireEvent.submit(form!)

    expect(mockAlert).toHaveBeenCalledWith('Passwords do not match')
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('disables submit button when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'different123')

    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when passwords match', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')

    expect(submitButton).not.toBeDisabled()
  })

  it('shows loading state during registration', () => {
    const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    mockedUseAuthStore.mockReturnValue({
      ...defaultAuthState,
      isLoading: true,
    })

    render(<RegisterPage />)

    expect(screen.getByText('Creating account...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
  })

  it('displays error message when registration fails', () => {
    const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    const mockError = { message: 'Email already exists' }
    mockedUseAuthStore.mockReturnValue({
      ...defaultAuthState,
      error: mockError,
    })

    render(<RegisterPage />)

    expect(screen.getByText('Email already exists')).toBeInTheDocument()
  })

  it('clears error when form is resubmitted', async () => {
    const user = userEvent.setup()
    const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
    mockedUseAuthStore.mockReturnValue({
      ...defaultAuthState,
      error: { message: 'Previous error' },
    })

    render(<RegisterPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)

    expect(mockClearError).toHaveBeenCalledTimes(2) // Once on mount, once on submit
  })

  it('handles registration failure correctly', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    mockRegister.mockRejectedValue(new Error('Network error'))

    render(<RegisterPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Registration failed:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })

  it('has proper form accessibility attributes', () => {
    render(<RegisterPage />)

    const form = document.querySelector('form')
    expect(form).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

    expect(nameInput).toHaveAttribute('type', 'text')
    expect(nameInput).toHaveAttribute('required')

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('autoComplete', 'email')
    expect(emailInput).toHaveAttribute('required')

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('required')

    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('required')
  })

  it('navigates to login page when signin link is clicked', () => {
    render(<RegisterPage />)

    const signinLink = screen.getByText('Already have an account? Sign in')
    expect(signinLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('handles keyboard navigation correctly', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // Tab through form elements
    await user.tab()
    expect(nameInput).toHaveFocus()

    await user.tab()
    expect(emailInput).toHaveFocus()

    await user.tab()
    expect(passwordInput).toHaveFocus()

    await user.tab()
    expect(confirmPasswordInput).toHaveFocus()

    await user.tab()
    expect(submitButton).toHaveFocus()
  })

  it('prevents submission with empty required fields', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    // Should not call register with empty fields (HTML5 validation will prevent this)
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('updates button state correctly based on password match', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // Initially enabled (empty passwords are equal)
    expect(submitButton).not.toBeDisabled()

    // Type mismatched passwords
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'different')
    expect(submitButton).toBeDisabled()

    // Fix the password
    await user.clear(confirmPasswordInput)
    await user.type(confirmPasswordInput, 'password123')
    expect(submitButton).not.toBeDisabled()
  })
})