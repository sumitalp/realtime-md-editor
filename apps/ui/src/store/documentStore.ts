// store/documentStore.ts
import { create } from 'zustand';
import axios from 'axios';

export interface Document {
  _id: string;
  title: string;
  content: string;
  ownerId: {
    _id: string;
    name: string;
    email: string;
    color?: string;
  };
  collaborators: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
      color?: string;
    };
    role: 'viewer' | 'editor' | 'owner';
    addedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
}

interface DocumentStore {
  // Public documents (visible to everyone)
  publicDocuments: Document[];
  // User's documents (owned + collaborated)
  userDocuments: Document[];
  currentDocument: Document | null;
  loading: boolean;
  error: string | null;
  
  // Public endpoints (no authentication required)
  fetchPublicDocuments: () => Promise<void>;
  fetchPublicDocument: (id: string) => Promise<void>;
  
  // Authenticated endpoints
  fetchUserDocuments: () => Promise<void>;
  fetchDocument: (id: string) => Promise<void>;
  createDocument: (title: string, content?: string) => Promise<Document>;
  updateDocument: (id: string, updates: { title?: string; content?: string }) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  addCollaborator: (documentId: string, email: string) => Promise<void>;
  removeCollaborator: (documentId: string, collaboratorId: string) => Promise<void>;
  
  // Utility methods
  setCurrentDocument: (document: Document | null) => void;
  clearError: () => void;
  getAllDocuments: () => Document[]; // Combines public + user documents
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
});

// Create separate axios instances for public and authenticated requests
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
});

const authenticatedApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
});

// Add auth interceptor only to authenticated API
authenticatedApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
authenticatedApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      // Optionally redirect to login or trigger auth state update
      window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(error);
  }
);

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  publicDocuments: [],
  userDocuments: [],
  currentDocument: null,
  loading: false,
  error: null,

  // Public Documents (no authentication required)
  fetchPublicDocuments: async () => {
    try {
      set({ loading: true, error: null });
      const response = await publicApi.get('/documents/public');
      set({ publicDocuments: response.data.documents, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch public documents', 
        loading: false 
      });
    }
  },

  fetchPublicDocument: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const response = await publicApi.get(`/documents/public/${id}`);
      set({ currentDocument: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch public document', 
        loading: false 
      });
    }
  },

  // Authenticated User Documents
  fetchUserDocuments: async () => {
    try {
      set({ loading: true, error: null });
      const response = await authenticatedApi.get('/documents');
      set({ userDocuments: response.data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch your documents', 
        loading: false 
      });
    }
  },

  fetchDocument: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const response = await authenticatedApi.get(`/documents/${id}`);
      set({ currentDocument: response.data, loading: false });
    } catch (error: any) {
      // If authenticated request fails, try public endpoint as fallback
      try {
        const publicResponse = await publicApi.get(`/documents/public/${id}`);
        set({ currentDocument: publicResponse.data, loading: false });
      } catch (publicError: any) {
        set({ 
          error: error.response?.data?.message || 'Failed to fetch document', 
          loading: false 
        });
      }
    }
  },

  createDocument: async (title: string, content = '') => {
    try {
      set({ error: null });
      const response = await authenticatedApi.post('/documents', { title, content });
      const newDocument = response.data;
      
      set(state => ({ 
        userDocuments: [newDocument, ...state.userDocuments] 
      }));
      
      return newDocument;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create document';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  updateDocument: async (id: string, updates: { title?: string; content?: string }) => {
    try {
      set({ error: null });
      const response = await authenticatedApi.patch(`/documents/${id}`, updates);
      const updatedDocument = response.data;
      
      // Update in userDocuments if it exists there
      set(state => ({
        userDocuments: state.userDocuments.map(doc => 
          doc._id === id ? updatedDocument : doc
        ),
        // Update currentDocument if it's the same document
        currentDocument: state.currentDocument?._id === id ? updatedDocument : state.currentDocument
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update document';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteDocument: async (id: string) => {
    try {
      set({ error: null });
      await authenticatedApi.delete(`/documents/${id}`);
      
      set(state => ({
        userDocuments: state.userDocuments.filter(doc => doc._id !== id),
        currentDocument: state.currentDocument?._id === id ? null : state.currentDocument
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete document';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  addCollaborator: async (documentId: string, email: string) => {
    try {
      set({ error: null });
      await authenticatedApi.post(`/documents/${documentId}/collaborators`, { email });
      
      // Refresh the document to get updated collaborators
      await get().fetchDocument(documentId);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add collaborator';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  removeCollaborator: async (documentId: string, collaboratorId: string) => {
    try {
      set({ error: null });
      await authenticatedApi.delete(`/documents/${documentId}/collaborators/${collaboratorId}`);
      
      // Refresh the document to get updated collaborators
      await get().fetchDocument(documentId);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove collaborator';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  // Utility methods
  setCurrentDocument: (document: Document | null) => {
    set({ currentDocument: document });
  },

  clearError: () => {
    set({ error: null });
  },

  getAllDocuments: () => {
    const { publicDocuments, userDocuments } = get();
    // Combine and deduplicate documents (user documents take precedence)
    const userDocIds = new Set(userDocuments.map(doc => doc._id));
    const uniquePublicDocs = publicDocuments.filter(doc => !userDocIds.has(doc._id));
    return [...userDocuments, ...uniquePublicDocs];
  },
}));

// Custom hook for easier usage
export const useDocuments = () => {
  const store = useDocumentStore();
  
  return {
    ...store,
    // Convenience methods
    refreshDocuments: async (isAuthenticated: boolean) => {
      await store.fetchPublicDocuments();
      if (isAuthenticated) {
        await store.fetchUserDocuments();
      }
    },
    
    // Get documents with proper fallback
    getDocuments: (isAuthenticated: boolean) => {
      if (isAuthenticated) {
        return store.getAllDocuments();
      }
      return store.publicDocuments;
    },
  };
};