// // components/CollaborativeEditor.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { yCollab } from 'y-codemirror.next';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { Document } from '@/store/documentStore';

interface User {
  id: string;
  name: string;
  color: string;
}

interface CollaborativeEditorProps {
  documentId: string;
  className?: string;
  doc?: Document;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  className = '',
  doc,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const userIdRef = useRef<string>('');
  const [users, setUsers] = useState<Set<User>>(() => new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { user, token } = useAuthStore();

  const cleanup = useCallback(() => {
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!editorRef.current || !user || !token) return;

    // Create Y.js document and awareness
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const ytext = ydoc.getText('content');
    const awareness = new Awareness(ydoc);

    // Y.applyUpdate(ydoc, doc.content);
    
    // Set user information in awareness
    awareness.setLocalStateField('user', {
      name: user.name,
      color: user.color || '#4F46E5',
      id: user.id,
    });

    // Connect to WebSocket with authentication
    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}`, {
      path: '/collaboration',
      auth: {
        token: token,
      },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      // forceNew: true,
      timeout: 10000,
  reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Socket event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setConnectionError(null);
      console.log(`Emitting join-document from ${user._id}`)
          // Join the document room
      socket.emit('join-document', {
        documentId,
        userId: user._id || user.id,
      });
      
      // Store user ID for later use
      userIdRef.current = user._id || user.id || '';
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError('Failed to connect to collaboration server');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message || 'An error occurred');
    });

    // Document synchronization
    socket.on('document-state', (data: { state: number[]; content?: string }) => {
      console.log('Received document state');
      try {
        if (data.state?.length) {
          const state = new Uint8Array(data.state);
          Y.applyUpdate(ydoc, state);
          console.log(`Applied Yjs state update`);
        } else if (data.content) {
          // Fallback: use plain text content if no Yjs state
          console.log(`Using fallback content: ${data.content.length} chars`);
          const ytext = ydoc.getText('content');
          if (ytext.length > 0) ytext.delete(0, ytext.length);
          ytext.insert(0, data.content);
        }
        
        // Verify content was loaded
        const currentContent = ytext.toString();
        console.log(`Current document content: ${currentContent.length} characters`);
        
        // Create or update the editor view
        if (!viewRef.current && editorRef.current) {
          createEditor();
        }
        
      } catch (error) {
        console.log(`Error applying document state: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    socket.on('document-update', (data: { update: number[] }) => {
      console.log('Received document update:', data.update.length, 'bytes');
      const update = new Uint8Array(data.update);
      Y.applyUpdate(ydoc, update);
      console.log('Applied update, current content length:', ydoc.getText('content').toString().length);
    });

    // User presence
    socket.on('user-presence', (data: { userId: string; cursor: unknown; selection: unknown }) => {
      // Handle cursor updates from other users
      console.log('User presence update:', data);
    });

    socket.on('users-list', (usersList: User[]) => {
      console.log(`👥 Users list updated: ${usersList?.length || 0} users`);

      setUsers(() =>new Set(usersList));
    });

    socket.on('user-joined', (data: User) => {
      console.log(`👤 User joined: ${data?.name || 'unknown'}`);
      setUsers(prev => {
        const nextUsers = new Set(prev);
        nextUsers.add(data);
        return nextUsers;
      });
    });

    socket.on('user-left', (data: { userId: string }) => {
      console.log(`👤 User left: ${data.userId}`);
      setUsers(prev => {
        const nextUsers = new Set(prev);
        // Assuming 'id' is a unique identifier for users
        for (const user of nextUsers) {
          if (user.id === data.userId) {
            nextUsers.delete(user);
            break;
          }
        }
        return nextUsers;
      });
    });

    // Y.js update handler
    const updateHandler = (update: Uint8Array, origin: unknown) => {
      console.log('Y.js update from:', origin === socket ? 'socket' : 'editor', 'socket connected:', socket.connected);
      if (origin !== socket && socket.connected) {
        console.log('Sending update to other clients:', update.length, 'bytes');
        socket.emit('document-update', {
          update: Array.from(update),
        });
      }
    };

    ydoc.on('update', updateHandler);

    // Create CodeMirror editor
    const createEditor = () => {
      if (viewRef.current || !editorRef.current) return;

      const view = new EditorView({
        doc: ydoc.getText('content').toString(),
        extensions: [
          basicSetup,
          markdown({defaultCodeLanguage: markdownLanguage, codeLanguages: languages}),
          oneDark,
          yCollab(ytext, awareness),
          EditorView.updateListener.of((update) => {
            if (update.selectionSet && socket.connected) {
              // Send cursor updates
              const selection = update.state.selection;
              socket.emit('cursor-update', {
                cursor: {
                  from: selection.main.from,
                  to: selection.main.to,
                },
                selection: {
                  anchor: selection.main.anchor,
                  head: selection.main.head,
                },
              });
            }
          }),
          EditorView.theme({
            '&': {
              height: '100%',
            },
            '.cm-scroller': {
              fontFamily: 'inherit',
            },
            '.cm-focused': {
              outline: 'none',
            },
          }),
        ],
        parent: editorRef.current,
      });

      viewRef.current = view;
    }

    createEditor();

    // Cleanup function
    return cleanup;
  }, [documentId, user, token, cleanup]);

  // Auto-save functionality
  useEffect(() => {
    if (!ydocRef.current || !token) return;

    const saveInterval = setInterval(async () => {
      const content = ydocRef.current?.getText('content').toString();
      if (content) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/documents/${documentId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ title: (doc as Document).title, content }),
          });
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 10000); // Auto-save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [documentId, token]);

  return (
    <div className={`w-full h-full relative ${className}`}>
      {/* Connection status */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
          isConnected 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Error display */}
      {connectionError && (
        <div className="absolute top-16 right-4 z-10 max-w-sm">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {connectionError}
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="text-sm text-gray-600">Active users:</span>
        <div className="flex -space-x-1">
          {/* Current user */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white"
            style={{ backgroundColor: user?.color || '#4F46E5' }}
            title={`${user?.name} (you)`}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          
          {/* Other users */}
          {Array.from(users).filter(u => u.id !== user?.id).map((collaborator, index) => (
            <div
              key={index}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white"
              style={{ backgroundColor: collaborator.color }}
              title={collaborator.name}
            >
              {collaborator?.name?.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Editor container */}
      <div ref={editorRef} className="h-full w-full pt-16" />
    </div>
  );
};