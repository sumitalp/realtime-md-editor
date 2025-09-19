import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    // Check for spinner element
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('h-8', 'w-8') // Default md size
  })

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Saving document..." />)
    
    expect(screen.getByText('Saving document...')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />)
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass('h-6', 'w-6')
  })

  it('renders with medium size (default)', () => {
    render(<LoadingSpinner size="md" />)
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('renders with large size', () => {
    render(<LoadingSpinner size="lg" />)
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass('h-12', 'w-12')
  })

  it('has correct styling classes', () => {
    render(<LoadingSpinner />)
    
    const container = screen.getByText('Loading...').parentElement
    expect(container).toHaveClass('text-center', 'py-12')
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass(
      'animate-spin',
      'rounded-full',
      'border-b-2',
      'border-blue-600',
      'mx-auto',
      'mb-4'
    )
    
    const message = screen.getByText('Loading...')
    expect(message).toHaveClass('text-gray-600')
  })

  it('combines custom props correctly', () => {
    render(<LoadingSpinner message="Processing..." size="lg" />)
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass('h-12', 'w-12')
  })
})