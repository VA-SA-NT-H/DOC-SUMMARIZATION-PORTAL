import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  useTheme,
  Divider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { apiService } from '../services/api';
import { Conversation, ChatMessage } from '../types/chat';
import { useSummaryChat } from '../hooks/useSummaryChat';
import SummaryChat from '../components/SummaryChat';
import EnhancedSummaryDisplay from '../components/EnhancedSummaryDisplay';

const ConversationPage: React.FC = () => {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch conversation details
  const {
    data: conversation,
    isLoading: conversationLoading,
    error: conversationError,
    refetch: refetchConversation
  } = useQuery(
    ['conversation', conversationId],
    () => conversationId ? apiService.getConversation(conversationId) : Promise.reject('No conversation ID'),
    {
      enabled: !!conversationId,
      retry: 1
    }
  );

  // Initialize chat with the summary ID from the conversation
  const chatHook = useSummaryChat({
    summaryId: conversation?.summaryId || 'default'
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation(
    (id: string) => apiService.deleteConversation(id),
    {
      onSuccess: () => {
        navigate('/conversations');
      },
      onError: (error: any) => {
        console.error('Failed to delete conversation:', error);
      }
    }
  );

  // Handle title editing
  const handleStartEdit = () => {
    setIsEditingTitle(true);
    setEditedTitle(conversation?.title || '');
  };

  const handleSaveTitle = () => {
    // In a real implementation, this would call an API to update the title
    setIsEditingTitle(false);
    refetchConversation();
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle(conversation?.title || '');
  };

  const handleCopyConversation = () => {
    // Copy conversation content to clipboard
    const conversationText = conversation?.title || '';
    navigator.clipboard.writeText(conversationText);
    // You could show a toast notification here
  };

  const handleExportConversation = () => {
    // Export conversation as text file
    const conversationText = conversation?.title || '';
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation_${conversationId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (conversationId) {
      deleteConversationMutation.mutate(conversationId);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  if (!conversationId) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Invalid conversation ID</Alert>
      </Container>
    );
  }

  if (conversationLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (conversationError) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Failed to load conversation. Please try again.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton
          onClick={() => navigate('/conversations')}
          title="Back to conversations"
        >
          <BackIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {isEditingTitle ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ flexGrow: 1, maxWidth: 400 }}
              />
              <IconButton onClick={handleSaveTitle} color="primary" title="Save title">
                <SaveIcon />
              </IconButton>
              <IconButton onClick={handleCancelEdit} title="Cancel editing">
                <BackIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" component="h1" fontWeight="bold" noWrap>
                {conversation?.title || 'Untitled Conversation'}
              </Typography>
              <IconButton
                onClick={handleStartEdit}
                size="small"
                title="Edit title"
              >
                <EditIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {conversation?.isPersistent && (
            <Chip
              label="Saved"
              size="small"
              color="info"
              variant="outlined"
            />
          )}
          <IconButton
            onClick={handleCopyConversation}
            title="Copy conversation"
          >
            <CopyIcon />
          </IconButton>
          <IconButton
            onClick={handleExportConversation}
            title="Export conversation"
          >
            <DownloadIcon />
          </IconButton>
          <IconButton
            onClick={handleDeleteClick}
            color="error"
            title="Delete conversation"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Conversation Metadata */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Document ID: {conversation?.summaryId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {conversation ? formatDate(conversation.createdAt.toString()) : 'Unknown'}
          </Typography>
          {conversation && conversation.updatedAt !== conversation.createdAt && (
            <Typography variant="body2" color="text.secondary">
              Updated: {formatDate(conversation.updatedAt.toString())}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Main Content */}
      {conversation ? (
        <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 280px)' }}>
          {/* Left Panel - Document Summary */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Document Summary
            </Typography>
            <Paper
              elevation={2}
              sx={{
                height: 'calc(100% - 40px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                textAlign: 'center'
              }}
            >
              <Box>
                <Typography variant="body1" color="text.secondary">
                  Document summary would be displayed here
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Summary ID: {conversation.summaryId}
                </Typography>
              </Box>
            </Paper>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Right Panel - Chat */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Conversation
            </Typography>
            <Box sx={{ height: 'calc(100% - 40px)' }}>
              <SummaryChat
                summaryId={conversation.summaryId}
                chatHook={chatHook}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        <Paper
          elevation={2}
          sx={{
            p: 8,
            textAlign: 'center',
            height: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Conversation not found
          </Typography>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Conversation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this conversation?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteConversationMutation.isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteConversationMutation.isLoading}
            startIcon={deleteConversationMutation.isLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ConversationPage;