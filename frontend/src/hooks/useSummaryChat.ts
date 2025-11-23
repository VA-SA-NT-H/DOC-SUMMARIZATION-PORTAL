import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, WebSocketMessage, UseSummaryChatReturn, ConnectionStatus } from '../types/chat';

interface UseSummaryChatProps {
  summaryId: string;
  wsUrl?: string;
}

export const useSummaryChat = ({
  summaryId,
  wsUrl // Optional override, otherwise auto-detect
}: UseSummaryChatProps): UseSummaryChatReturn => {
  // Auto-detect WebSocket URL based on current location (Nginx proxy)
  const getWsUrl = () => {
    if (wsUrl) return wsUrl;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>();
  const [isSaved, setIsSaved] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const isConnected = connectionStatus === 'connected';
  const isLoading = connectionStatus === 'connecting';

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      setError(null);

      const baseUrl = getWsUrl();
      const wsEndpoint = `${baseUrl}/ws/chat/${summaryId}`;
      ws.current = new WebSocket(wsEndpoint);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;

        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');

        // Attempt to reconnect if it wasn't a clean close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionStatus('error');
        setError('Connection error occurred');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setConnectionStatus('error');
      setError('Failed to connect to chat service');
    }
  }, [summaryId, wsUrl]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setError('Failed to reconnect after multiple attempts');
      return;
    }

    const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000); // Max 30 seconds
    reconnectAttempts.current++;

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
      connect();
    }, delay);
  };

  // Handle incoming WebSocket messages
  const handleMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case 'system':
        // System messages are handled by the UI component
        break;

      case 'message':
        if (data.role && data.message && data.timestamp) {
          const chatMessage: ChatMessage = {
            id: uuidv4(),
            role: data.role as 'user' | 'assistant',
            content: data.message,
            timestamp: new Date(data.timestamp * 1000) // Convert to milliseconds
          };

          setMessages(prev => [...prev, chatMessage]);
        }
        break;

      case 'typing':
        // Handle typing indicator if needed
        if (data.status) {
          setMessages(prev => {
            // Remove existing typing indicator
            const filtered = prev.filter(m => !m.isTyping);
            if (data.status) {
              // Add typing indicator
              return [...filtered, {
                id: uuidv4(),
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isTyping: true
              }];
            }
            return filtered;
          });
        }
        break;

      case 'error':
        setError(data.message || 'Unknown error occurred');
        break;

      case 'pong':
        // Handle keep-alive response
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  // Send a message through WebSocket
  const sendMessage = useCallback((content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN && content.trim()) {
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      };

      // Add user message immediately
      setMessages(prev => [...prev, userMessage]);

      // Send to WebSocket
      ws.current.send(JSON.stringify({
        type: 'message',
        message: content.trim()
      }));
    } else {
      setError('Not connected to chat service');
    }
  }, []);

  // Clear all messages
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsSaved(false);
    setConversationTitle('');
  }, []);

  // Save conversation (mock implementation for now)
  const saveConversation = useCallback(async (title: string) => {
    try {
      // In a real implementation, this would call an API endpoint
      console.log('Saving conversation:', { title, messages: messages.length });

      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsSaved(true);
      setConversationTitle(title);
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw error;
    }
  }, [messages.length]);

  // Load saved conversation (mock implementation)
  const loadSavedConversation = useCallback(async (savedConversationId: string) => {
    try {
      // In a real implementation, this would fetch from API
      console.log('Loading conversation:', savedConversationId);

      // Mock load operation
      await new Promise(resolve => setTimeout(resolve, 500));

      setConversationId(savedConversationId);
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      throw error;
    }
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (ws.current) {
      ws.current.close(1000, 'User disconnected');
      ws.current = null;
    }

    setConnectionStatus('disconnected');
    reconnectAttempts.current = 0;
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  // Send keep-alive ping every 30 seconds
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, []);

  // Initial connection
  useEffect(() => {
    if (summaryId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [summaryId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    sendMessage,
    isConnected,
    isLoading,
    error,
    clearChat,
    saveConversation,
    isSaved,
    conversationTitle,
    setConversationTitle,
    loadSavedConversation,
    disconnect,
    reconnect
  };
};