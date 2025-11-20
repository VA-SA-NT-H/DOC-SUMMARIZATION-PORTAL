import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  AccessTime as TimeIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { apiService } from '../services/api';
import { Conversation, ConversationSummary } from '../types/chat';
import { useAuth } from '../contexts/AuthContext';

const ConversationHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);

  // Fetch user conversations
  const {
    data: conversationsData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['conversations', user?.email],
    () => user ? apiService.getUserConversations(user.email) : Promise.resolve({ content: [], totalElements: 0, totalPages: 0 }),
    {
      enabled: !!user,
      retry: 1
    }
  );

  // Delete conversation mutation
  const deleteConversationMutation = useMutation(
    (conversationId: string) => apiService.deleteConversation(conversationId),
    {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setConversationToDelete(null);
        refetch();
      },
      onError: (error: any) => {
        console.error('Failed to delete conversation:', error);
      }
    }
  );

  // Filter conversations based on search query
  const filteredConversations = conversationsData?.content.filter(conversation =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.summaryId.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDeleteClick = (conversation: Conversation) => {
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (conversationToDelete) {
      deleteConversationMutation.mutate(conversationToDelete.id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        return `${Math.floor(diffDays / 7)} weeks ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Unknown date';
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Please log in to view your conversations.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton
          onClick={() => navigate(-1)}
          title="Back"
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Conversation History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ChatIcon />}
          onClick={() => navigate('/')}
        >
          New Chat
        </Button>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load conversations. Please try again.
        </Alert>
      ) : filteredConversations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Start a conversation about a document summary to see it here'
            }
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={() => navigate('/documents')}
            >
              Browse Documents
            </Button>
          )}
        </Paper>
      ) : (
        <Paper>
          <List sx={{ p: 0 }}>
            {filteredConversations.map((conversation, index) => (
              <React.Fragment key={conversation.id}>
                <ListItem
                  button
                  onClick={() => navigate(`/conversations/${conversation.id}`)}
                  sx={{
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <ChatIcon sx={{ color: theme.palette.primary.main }} />
                  </Box>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                          {conversation.title}
                        </Typography>
                        {conversation.isPersistent && (
                          <Chip
                            label="Saved"
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <DocumentIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Document: {conversation.summaryId}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(conversation.updatedAt.toString())}
                          </Typography>
                          {conversation.createdAt !== conversation.updatedAt && (
                            <Typography variant="caption" color="text.secondary">
                              (updated)
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(conversation);
                      }}
                      color="error"
                      title="Delete conversation"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>

                {index < filteredConversations.length - 1 && (
                  <Box
                    sx={{
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      mx: 2
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </List>
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
            Are you sure you want to delete the conversation "
            <strong>{conversationToDelete?.title}</strong>"?
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

export default ConversationHistoryPage;