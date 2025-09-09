import { Socket as SocketIOSocket } from 'socket.io';

// Extended Socket interface with custom data
export interface AuthenticatedSocket extends SocketIOSocket {
  data: {
    user?: {
      sub?: string;
      email: string;
      name: string;
      color?: string;
      userId?: string;
    };
    documentId?: string;
    updateHandler?: (update: Uint8Array, origin: unknown) => void;
  };
  user?: {
    email: string;
    name: string;
    color?: string;
    userId: string;
  };
}

// User presence data structure
export interface UserPresence {
  name: string;
  color: string;
  cursor: {
    from: number;
    to: number;
  } | null;
  selection: {
    anchor: number;
    head: number;
  } | null;
}

// Socket event payloads
export interface JoinDocumentPayload {
  documentId: string;
  userId: string;
}

export interface DocumentUpdatePayload {
  update: number[];
}

export interface DocumentStatePayload {
  state: number[];
  content?: string;
}

export interface CursorUpdatePayload {
  cursor: {
    from: number;
    to: number;
  };
  selection: {
    anchor: number;
    head: number;
  };
}

export interface UserPresencePayload {
  userId: string;
  cursor: {
    from: number;
    to: number;
  };
  selection: {
    anchor: number;
    head: number;
  };
}

export interface UserJoinedPayload {
  userId: string;
  user: {
    name: string;
    color: string;
  };
}

export interface UserLeftPayload {
  userId: string;
}

export interface ErrorPayload {
  message: string;
}

export interface JwtRequestPayload extends SocketIOSocket {} //eslint-disable-line @typescript-eslint/no-empty-object-type
