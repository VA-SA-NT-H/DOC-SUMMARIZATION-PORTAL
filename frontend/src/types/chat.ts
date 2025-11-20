export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  conversationId?: string;
  isSaved: boolean;
  conversationTitle: string;
}

export interface WebSocketMessage {
  type: 'message' | 'system' | 'error' | 'typing' | 'pong' | 'ping';
  message?: string;
  role?: 'user' | 'assistant';
  timestamp?: number;
  status?: boolean;
}

export interface UseSummaryChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  clearChat: () => void;
  saveConversation: (title: string) => Promise<void>;
  isSaved: boolean;
  conversationTitle: string;
  setConversationTitle: (title: string) => void;
  loadSavedConversation: (conversationId: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => void;
}

export interface Conversation {
  id: string;
  summaryId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isPersistent: boolean;
  messageCount?: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: Date;
  messageCount: number;
  lastMessage: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';