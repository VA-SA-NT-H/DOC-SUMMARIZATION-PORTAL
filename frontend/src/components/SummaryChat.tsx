import React, { useState, useRef, useEffect } from 'react';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  InputAdornment,
  Alert,
  CircularProgress,
  Fade,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  ChatBubbleOutline as ChatIcon,
  SmartToy as AIIcon,
  Person as UserIcon
} from '@mui/icons-material';
import { ChatMessage, UseSummaryChatReturn } from '../types/chat';

interface SummaryChatProps {
  summaryId: string;
  chatHook: UseSummaryChatReturn;
  maxContentHeight?: number;
}

const SummaryChat: React.FC<SummaryChatProps> = ({
  summaryId,
  chatHook,
  maxContentHeight = 600
}) => {
  const theme = useTheme();
  const {
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
    disconnect
  } = chatHook;

  const [inputMessage, setInputMessage] = useState('');
  const [saveEnabled, setSaveEnabled] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input field when connected
  useEffect(() => {
    if (isConnected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isConnected]);

  // Auto-generate conversation title when save is enabled
  useEffect(() => {
    if (saveEnabled && !titleInput && messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        const autoTitle = firstUserMessage.content.substring(0, 50) +
          (firstUserMessage.content.length > 50 ? '...' : '');
        setTitleInput(autoTitle);
        setConversationTitle(autoTitle);
      }
    }
  }, [saveEnabled, titleInput, messages, setConversationTitle]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && isConnected) {
      sendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleSave = () => {
    const newSaveState = !saveEnabled;
    setSaveEnabled(newSaveState);

    if (!newSaveState) {
      setTitleInput('');
      setConversationTitle('');
    }
  };

  const handleSaveConversation = async () => {
    if (titleInput.trim()) {
      try {
        await saveConversation(titleInput.trim());
        setSaveEnabled(false);
      } catch (error) {
        console.error('Failed to save conversation:', error);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isTyping = message.isTyping;

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2
        }}
      >
        <Box
          sx={{
            maxWidth: '70%',
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: 1
          }}
        >
          {/* Avatar */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isUser
                ? theme.palette.primary.main
                : theme.palette.secondary.main,
              color: 'white',
              flexShrink: 0
            }}
          >
            {isUser ? (
              <UserIcon fontSize="small" />
            ) : (
              <AIIcon fontSize="small" />
            )}
          </Box>

          {/* Message bubble */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              backgroundColor: isUser
                ? theme.palette.primary.main
                : theme.palette.grey[100],
              color: isUser ? 'white' : theme.palette.text.primary,
              borderRadius: 2,
              borderBottomRightRadius: isUser ? 0 : 2,
              borderBottomLeftRadius: isUser ? 2 : 0,
              position: 'relative'
            }}
          >
            {isTyping ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">AI is thinking...</Typography>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </Typography>
            )}

            {!isTyping && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 1,
                  opacity: 0.7,
                  fontSize: '0.7rem'
                }}
              >
                {formatTime(message.timestamp)}
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    );
  };

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f9f9f9',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon />
            AI Assistant
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Save Conversation Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={saveEnabled}
                  onChange={handleToggleSave}
                  size="small"
                />
              }
              label="Save"
              sx={{ mr: 1 }}
            />

            {/* Clear Chat */}
            <IconButton
              onClick={clearChat}
              size="small"
              title="Clear chat"
            >
              <ClearIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Connection Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            size="small"
            color={isConnected ? 'success' : 'error'}
            variant={isConnected ? 'filled' : 'outlined'}
          />
          {isSaved && (
            <Chip
              label="Saved"
              size="small"
              color="info"
              icon={<SaveIcon />}
            />
          )}
        </Box>

        {/* Save Conversation Input */}
        {saveEnabled && (
          <Fade in={saveEnabled}>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Conversation title..."
                value={titleInput}
                onChange={(e) => {
                  setTitleInput(e.target.value);
                  setConversationTitle(e.target.value);
                }}
                sx={{ flex: 1 }}
              />
              <IconButton
                onClick={handleSaveConversation}
                disabled={!titleInput.trim()}
                color="primary"
                title="Save conversation"
              >
                <SaveIcon />
              </IconButton>
            </Box>
          </Fade>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ m: 2, mt: 1 }}>
          {error}
        </Alert>
      )}

      {/* Welcome Message */}
      {messages.length === 0 && isConnected && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            👋 Welcome! Ask me anything about this document summary.
          </Typography>
        </Box>
      )}

      {/* Messages Container */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: maxContentHeight - 200, // Account for header and input
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: alpha(theme.palette.grey[300], 0.3),
            borderRadius: '3px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.grey[500],
            borderRadius: '3px',
            '&:hover': {
              background: theme.palette.grey[700]
            }
          }
        }}
      >
        {messages.map((message, index) => renderMessage(message, index))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: 'white' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={
            isConnected
              ? "Ask me about this document..."
              : "Connecting to AI assistant..."
          }
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!isConnected || isLoading}
          inputRef={inputRef}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !isConnected || isLoading}
                  color="primary"
                >
                  {isLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <SendIcon />
                  )}
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default SummaryChat;