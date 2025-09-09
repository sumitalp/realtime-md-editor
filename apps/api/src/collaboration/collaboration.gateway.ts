// src/collaboration/collaboration.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards, OnApplicationShutdown } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as Y from 'yjs';
import { DocumentModel, DocumentDocument } from '../schemas/document.schema';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';

import { log } from '@pnpmworkspace/logger';

import type {
  AuthenticatedSocket,
  UserPresence,
  JoinDocumentPayload,
  DocumentUpdatePayload,
  DocumentStatePayload,
  CursorUpdatePayload,
  UserPresencePayload,
  UserJoinedPayload,
  UserLeftPayload,
  ErrorPayload,
} from '../types/socket.types';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Support older Socket.IO versions
  path: '/collaboration',
})
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnApplicationShutdown
{
  @WebSocketServer()
  server: Server;

  private readonly logger = log;
  private documents = new Map<string, Y.Doc>();
  private documentConnections = new Map<string, Set<AuthenticatedSocket>>();

  constructor(
    @InjectModel(DocumentModel.name)
    private documentModel: Model<DocumentDocument>,
  ) {}

  onApplicationShutdown(signal?: string): void {
    log.info(`[Graceful Shutdown] Received signal: ${signal}`);

    // Disconnect all connected clients and close the server
    this.server.close(); //eslint-disable-line @typescript-eslint/no-floating-promises
    log.info('[Graceful Shutdown] WebSocket server closed.');
  }

  handleConnection(client: Socket): void {
    this.logger.info(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    log.info(`Client disconnected: ${client.id}`);
    let authUser = client.data.user;

    if (!authUser) {
      authUser = client?.user;
      client.data.user = {
        sub: authUser?.userId,
        email: authUser!.email,
        name: authUser!.name,
        color: authUser!.color,
        userId: authUser?.userId,
      };
    }

    // Remove client from all document rooms
    for (const [
      documentId,
      connections,
    ] of this.documentConnections.entries()) {
      if (connections.has(client)) {
        connections.delete(client);

        const presence = this.userPresence.get(documentId);
        if (presence && client.data.user) {
          presence.delete(client.data.user.sub || '');
          client.to(documentId).emit('user-left', {
            userId: client.data.user.sub,
          } as UserLeftPayload);
        }

        if (connections.size === 0) {
          await this.saveDocumentState(documentId);
          this.documents.delete(documentId);
          this.documentConnections.delete(documentId);
          this.userPresence.delete(documentId);
        }
      }
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('join-document')
  async handleJoinDocument(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinDocumentPayload,
  ) {
    // Normalize authenticated user from guard into client.data.user
    let authUser = client.data.user;
    const { documentId } = data;
    let effectiveUserId: string = '';

    if (!authUser) {
      authUser = client.user;
      client.data.user = {
        sub: authUser?.userId,
        email: authUser!.email,
        name: authUser!.name,
        color: authUser!.color,
        userId: authUser?.userId,
      };

      if (!authUser) {
        client.emit('error', {
          message: 'Unauthorized: missing user',
        } as ErrorPayload);
        return;
      }

      effectiveUserId = client.data.user?.sub || client.data.user?.userId || '';
    }

    const user = authUser;

    log.info(`Websocket User: ${effectiveUserId}`);

    // Verify user has access to document
    const hasAccess = await this.verifyDocumentAccess(
      documentId,
      effectiveUserId,
    );
    if (!hasAccess) {
      client.emit('error', { message: 'Access denied' } as ErrorPayload);
      return;
    }

    // Join document room
    await client.join(documentId);

    // Get or create Yjs document
    let ydoc = this.documents.get(documentId);
    if (!ydoc) {
      ydoc = await this.loadOrCreateDocument(documentId);
      this.documents.set(documentId, ydoc);
    }

    // Track connection
    if (!this.documentConnections.has(documentId)) {
      this.documentConnections.set(documentId, new Set());
    }
    const connections = this.documentConnections.get(documentId);
    if (connections) {
      connections.add(client);
    }

    // Track user presence
    if (!this.userPresence.has(documentId)) {
      this.userPresence.set(documentId, new Map());
    }
    this.userPresence.get(documentId)!.set(effectiveUserId, {
      name: user.name,
      color: user.color || '#4F46E5',
      cursor: null,
      selection: null,
    });

    // Send current document state to client
    const state = Y.encodeStateAsUpdate(ydoc);
    const contentText = ydoc.getText('content').toString(); //eslint-disable-line

    log.info(
      `Sending document state to client: ${state.length} bytes, content length: ${contentText.length}`,
    );

    client.emit('document-state', {
      state: Array.from(state),
      content: contentText, // Send plain text as backup
    });

    // Send initial content if Yjs state is empty but we have content
    if (state.length === 0 && contentText.length === 0) {
      const dbDocument = await this.documentModel.findById(documentId);
      if (dbDocument && dbDocument.content) {
        log.info(
          `Initializing document with saved content: ${dbDocument.content.length} chars`,
        );
        const ytext = ydoc.getText('content');
        ytext.insert(0, dbDocument.content);

        // Send updated state
        const newState = Y.encodeStateAsUpdate(ydoc);
        client.emit('document-state', {
          state: Array.from(newState),
          content: dbDocument.content,
        } as DocumentStatePayload);
      }
    }

    // Notify others about new user
    client.to(documentId).emit('user-joined', {
      userId: effectiveUserId,
      user: { name: user.name, color: user.color || '#4F46E5' },
    } as UserJoinedPayload);

    // Send current users list
    const currentUsers = Array.from(
      this.userPresence.get(documentId)?.entries() || [],
    ).map(([id, userData]) => ({ id, ...userData }));

    this.server.to(documentId).emit('users-list', currentUsers);

    // Set up Yjs update handler for this client
    const updateHandler = (update: Uint8Array, origin: any) => {
      if (origin !== client) {
        client.to(documentId).emit('document-update', {
          update: Array.from(update),
        } as DocumentUpdatePayload);
      }
    };

    ydoc.on('update', updateHandler);

    // Store handler reference for cleanup
    client.data.updateHandler = updateHandler;
    client.data.documentId = documentId;
  }

  @SubscribeMessage('document-update')
  handleDocumentUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: DocumentUpdatePayload,
  ) {
    const documentId = client.data.documentId;
    if (!documentId) return;

    const ydoc = this.documents.get(documentId);
    if (!ydoc) return;

    const update = new Uint8Array(data.update);

    // Apply update to Yjs document
    Y.applyUpdate(ydoc, update, client);

    // Broadcast update to other clients
    client.to(documentId).emit('document-update', data);

    // Periodically save to database (debounced)
    this.debouncedSave(documentId);
  }

  private saveTimeouts = new Map<string, NodeJS.Timeout>();

  private debouncedSave(documentId: string): void {
    const existingTimeout = this.saveTimeouts.get(documentId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const timeout = setTimeout(async (): Promise<void> => {
      await this.saveDocumentState(documentId);
      this.saveTimeouts.delete(documentId);
    }, 2000); // Save after 2 seconds of inactivity

    this.saveTimeouts.set(documentId, timeout);
  }

  private async saveDocumentState(documentId: string): Promise<void> {
    const ydoc = this.documents.get(documentId);
    if (!ydoc) return;

    const state = Y.encodeStateAsUpdate(ydoc);
    const text = ydoc.getText('content').toString(); //eslint-disable-line

    await this.documentModel.findByIdAndUpdate(documentId, {
      content: text,
      yjsState: Buffer.from(state),
      updatedAt: new Date(),
    });
  }

  private async loadOrCreateDocument(documentId: string): Promise<Y.Doc> {
    const document = await this.documentModel.findById(documentId);

    const ydoc = new Y.Doc();

    if (document?.yjsState) {
      // Load existing Yjs state
      Y.applyUpdate(ydoc, new Uint8Array(document.yjsState));
    } else if (document?.content) {
      // Initialize from plain text content
      const ytext = ydoc.getText('content');
      ytext.insert(0, document.content);
    }

    return ydoc;
  }

  private async verifyDocumentAccess(
    documentId: string,
    userId: string,
  ): Promise<boolean> {
    const userObjectId = new Types.ObjectId(userId);
    const document = await this.documentModel.findOne({
      _id: new Types.ObjectId(documentId),
      $or: [
        { ownerId: userObjectId },
        { 'collaborators.userId': userObjectId },
      ],
    });

    return !!document;
  }

  private userPresence = new Map<string, Map<string, UserPresence>>();

  @SubscribeMessage('cursor-update')
  handleCursorUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CursorUpdatePayload,
  ): void {
    const documentId = client.data.documentId;
    const userId = client.data.user?.sub;

    if (!documentId || !userId) return;

    if (!this.userPresence.has(documentId)) {
      this.userPresence.set(documentId, new Map());
    }

    const presence = this.userPresence.get(documentId);
    // Update user presence
    if (!presence) return;
    const userData = presence.get(userId);
    if (userData) {
      userData.cursor = data.cursor;
      userData.selection = data.selection;
    }

    // Broadcast to other users
    client.to(documentId).emit('user-presence', {
      userId,
      cursor: data.cursor,
      selection: data.selection,
    } as UserPresencePayload);
  }
}
