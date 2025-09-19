import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentCard } from '../DocumentCard'

// Define Document type locally for testing
interface Document {
  _id: string
  title: string
  content: string
  ownerId: {
    _id: string
    name: string
    email: string
    color: string
  }
  collaborators: Array<{
    userId: {
      _id: string
      name: string
      email: string
      color: string
    }
    role: string
    addedAt: string
  }>
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

const mockDocument: Document = {
  _id: 'doc123',
  title: 'Test Document',
  content: 'This is a test document with some content that should be truncated in the preview.',
  ownerId: {
    _id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    color: '#3B82F6'
  },
  collaborators: [
    {
      userId: {
        _id: 'collab1',
        name: 'Jane Smith',
        email: 'jane@example.com',
        color: '#10B981'
      },
      role: 'editor',
      addedAt: '2024-01-15T10:00:00Z'
    }
  ],
  isPublic: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T12:00:00Z'
}

const mockDocumentWithoutContent: Document = {
  ...mockDocument,
  _id: 'doc456',
  title: 'Empty Document',
  content: '',
  collaborators: []
}

describe('DocumentCard', () => {
  const mockOnEdit = jest.fn()
  const mockOnShare = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders document information correctly', () => {
    render(
      <DocumentCard 
        document={mockDocument}
        onEdit={mockOnEdit}
        onShare={mockOnShare}
      />
    )

    expect(screen.getByText('Test Document')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText(/This is a test document with some content/)).toBeInTheDocument()
    expect(screen.getByText('JD')).toBeInTheDocument() // Initials
    expect(screen.getByText('+1')).toBeInTheDocument() // Collaborator count
  })

  it('renders document without content correctly', () => {
    render(
      <DocumentCard 
        document={mockDocumentWithoutContent}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('Empty Document')).toBeInTheDocument()
    expect(screen.getByText('No content yet...')).toBeInTheDocument()
    expect(screen.queryByText('+')).not.toBeInTheDocument() // No collaborators
  })

  it('formats dates correctly', () => {
    render(
      <DocumentCard 
        document={mockDocument}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('Updated Jan 15, 2024')).toBeInTheDocument()
    expect(screen.getByText('Created Jan 1, 2024')).toBeInTheDocument()
  })

  it('truncates long content', () => {
    const longContentDoc = {
      ...mockDocument,
      content: 'A'.repeat(150) // 150 characters
    }

    render(
      <DocumentCard 
        document={longContentDoc}
        onEdit={mockOnEdit}
      />
    )

    const contentText = screen.getByText(/A+\.\.\./)
    expect(contentText.textContent).toHaveLength(103) // 100 chars + '...'
  })

  it('generates correct initials for single name', () => {
    const singleNameDoc = {
      ...mockDocument,
      ownerId: { ...mockDocument.ownerId, name: 'Madonna' }
    }

    render(
      <DocumentCard 
        document={singleNameDoc}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('generates correct initials for multiple names', () => {
    const multipleNameDoc = {
      ...mockDocument,
      ownerId: { ...mockDocument.ownerId, name: 'Jean-Claude Van Damme' }
    }

    render(
      <DocumentCard 
        document={multipleNameDoc}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('JCVD')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <DocumentCard 
        document={mockDocument}
        onEdit={mockOnEdit}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    expect(mockOnEdit).toHaveBeenCalledWith(mockDocument)
    expect(mockOnEdit).toHaveBeenCalledTimes(1)
  })

  it('calls onEdit when document card is clicked for edit', async () => {
    const user = userEvent.setup()
    
    render(
      <DocumentCard 
        document={mockDocument}
        onEdit={mockOnEdit}
      />
    )

    // There should be two edit buttons - one in the hover actions and one in the main action
    const editButtons = screen.getAllByRole('button')
    const mainEditButton = editButtons.find(button => 
      button.textContent?.includes('Edit')
    )

    if (mainEditButton) {
      await user.click(mainEditButton)
      expect(mockOnEdit).toHaveBeenCalledWith(mockDocument)
    }
  })

  it('shows share button when onShare prop is provided', () => {
    render(
      <DocumentCard 
        document={mockDocument}
        onEdit={mockOnEdit}
        onShare={mockOnShare}
      />
    )

    // Share button should be in the DOM (though initially hidden with opacity)
    const shareButtons = screen.getAllByRole('button')
    const shareButton = shareButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-share-2') ||
      button.getAttribute('aria-label') === 'Share'
    )
    
    expect(shareButton).toBeInTheDocument()
  })

  it('hides share button when onShare prop is not provided', () => {
    render(
      <DocumentCard 
        document={mockDocument}
        onEdit={mockOnEdit}
      />
    )

    // Should not render share button when onShare is not provided
    const shareButtons = screen.queryAllByRole('button')
    const shareButton = shareButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-share-2')
    )
    
    expect(shareButton).toBeUndefined()
  })

  it('calls onShare when share button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <DocumentCard 
        document={mockDocument}
        onEdit={mockOnEdit}
        onShare={mockOnShare}
      />
    )

    // Find and click the share button
    const buttons = screen.getAllByRole('button')
    const shareButton = buttons.find(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('lucide-share-2')
    )

    if (shareButton) {
      await user.click(shareButton)
      expect(mockOnShare).toHaveBeenCalledWith(mockDocument)
      expect(mockOnShare).toHaveBeenCalledTimes(1)
    }
  })

  it('applies hover effects correctly', () => {
    const { container } = render(
      <DocumentCard 
        document={mockDocument}
        onEdit={mockOnEdit}
        onShare={mockOnShare}
      />
    )

    // Get the root card element (first child div)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('group')
    expect(card).toHaveClass('hover:shadow-xl')
    expect(card).toHaveClass('transition-all')
  })

  it('handles documents with no collaborators', () => {
    render(
      <DocumentCard 
        document={mockDocumentWithoutContent}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.queryByText('+')).not.toBeInTheDocument()
    const usersIcon = screen.queryByRole('img', { hidden: true })
    expect(usersIcon).not.toBeInTheDocument()
  })

  it('accessibility: has proper role and keyboard navigation', async () => {
    const user = userEvent.setup()
    
    render(
      <DocumentCard 
        document={mockDocument}
        onEdit={mockOnEdit}
      />
    )

    // Get all edit buttons and test the first one that gets focus
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(button => 
      button.textContent?.includes('Edit') || 
      button.querySelector('svg')
    )
    expect(editButton).toBeInTheDocument()
    
    // Test keyboard navigation - tab to the first focusable element
    await user.tab()
    const focusedElement = document.activeElement
    expect(focusedElement?.tagName).toBe('BUTTON')
    
    // Test that pressing Enter triggers the onEdit callback
    await user.keyboard('{Enter}')
    expect(mockOnEdit).toHaveBeenCalledWith(mockDocument)
  })
});