import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorAlert } from '../ErrorAlert'

describe('ErrorAlert', () => {
  const mockOnDismiss = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders error message correctly', () => {
    render(<ErrorAlert error="Something went wrong!" />)
    
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument()
    
    // Check for alert icon
    const alertIcon = document.querySelector('svg')
    expect(alertIcon).toBeInTheDocument()
  })

  it('renders without dismiss button when onDismiss is not provided', () => {
    render(<ErrorAlert error="Error message" />)
    
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.queryByText('×')).not.toBeInTheDocument()
  })

  it('renders with dismiss button when onDismiss is provided', () => {
    render(<ErrorAlert error="Error message" onDismiss={mockOnDismiss} />)
    
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.getByText('×')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    
    render(<ErrorAlert error="Error message" onDismiss={mockOnDismiss} />)
    
    const dismissButton = screen.getByText('×')
    await user.click(dismissButton)
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when dismiss button is activated via keyboard', async () => {
    const user = userEvent.setup()
    
    render(<ErrorAlert error="Error message" onDismiss={mockOnDismiss} />)
    
    const dismissButton = screen.getByText('×')
    dismissButton.focus()
    await user.keyboard('{Enter}')
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('has correct styling classes', () => {
    render(<ErrorAlert error="Test error" onDismiss={mockOnDismiss} />)
    
    // Container classes
    const outerContainer = screen.getByText('Test error').closest('.max-w-7xl')
    expect(outerContainer).toHaveClass(
      'max-w-7xl',
      'mx-auto',
      'px-4',
      'sm:px-6',
      'lg:px-8',
      'pt-4'
    )
    
    // Alert container classes
    const alertContainer = screen.getByText('Test error').closest('.bg-red-50')
    expect(alertContainer).toHaveClass(
      'bg-red-50',
      'border',
      'border-red-200',
      'rounded-lg',
      'p-4',
      'flex',
      'items-center',
      'space-x-2'
    )
    
    // Icon classes
    const icon = document.querySelector('svg')
    expect(icon).toHaveClass('w-5', 'h-5', 'text-red-500', 'flex-shrink-0')
    
    // Message classes
    const message = screen.getByText('Test error')
    expect(message).toHaveClass('text-red-700', 'text-sm')
    
    // Dismiss button classes
    const dismissButton = screen.getByText('×')
    expect(dismissButton).toHaveClass(
      'ml-auto',
      'text-red-500',
      'hover:text-red-700',
      'transition-colors'
    )
  })

  it('handles long error messages', () => {
    const longError = 'This is a very long error message that should wrap properly and not break the layout of the error alert component.'
    
    render(<ErrorAlert error={longError} />)
    
    expect(screen.getByText(longError)).toBeInTheDocument()
  })

  it('handles empty error message', () => {
    render(<ErrorAlert error="" />)
    
    // Should still render the container and icon, just with empty message
    const alertContainer = document.querySelector('.bg-red-50')
    expect(alertContainer).toBeInTheDocument()
    
    const icon = document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('properly handles special characters in error message', () => {
    const errorWithSpecialChars = 'Error: <script>alert("xss")</script> & other characters'
    
    render(<ErrorAlert error={errorWithSpecialChars} />)
    
    expect(screen.getByText(errorWithSpecialChars)).toBeInTheDocument()
  })

  it('maintains focus management for accessibility', async () => {
    const user = userEvent.setup()
    
    render(<ErrorAlert error="Error message" onDismiss={mockOnDismiss} />)
    
    const dismissButton = screen.getByText('×')
    
    // Test tab navigation
    await user.tab()
    expect(dismissButton).toHaveFocus()
    
    // Test space key activation
    await user.keyboard(' ')
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })
})