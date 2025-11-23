import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Home as HomeIcon,
  Description as DocumentIcon,
  Chat as ChatIcon
} from '@mui/icons-material';

import { useQuery } from 'react-query';
import { apiService } from '../services/api';
import { useSummaryChat } from '../hooks/useSummaryChat';
import EnhancedSummaryDisplay from '../components/EnhancedSummaryDisplay';
import SummaryChat from '../components/SummaryChat';

const InteractiveSummaryPage: React.FC = () => {
  const { id: documentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));



  // Fetch document and summary data
  const { data: document, isLoading: documentLoading, error: documentError } = useQuery(
    ['document', documentId],
    () => apiService.getDocument(documentId!),
    {
      enabled: !!documentId,
      retry: 1
    }
  );

  const { data: summaries, isLoading: summariesLoading, error: summariesError } = useQuery(
    ['summaries', documentId],
    () => apiService.getDocumentSummaries(documentId!),
    {
      enabled: !!documentId,
      retry: 1
    }
  );

  const handleBreadcrumbClick = (event: React.MouseEvent, path: string) => {
    event.preventDefault();
    navigate(path);
  };

  // Get the latest summary for display
  const latestSummary = summaries?.[summaries.length - 1];

  // Initialize chat hook with the correct summary ID
  const chatHook = useSummaryChat({
    summaryId: latestSummary?.id || ''
  });

  if (documentLoading || summariesLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading interactive summary...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (documentError || summariesError) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            {documentError instanceof Error ? documentError.message : 'Failed to load document'}
            {summariesError instanceof Error ? summariesError.message : 'Failed to load summaries'}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!document) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert severity="warning">
            Document not found
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#f5f5f5' }}>
      {/* Header with Back Button */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <IconButton
          onClick={() => navigate(`/documents/${documentId}`)}
          title="Back to document"
          edge="start"
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h6" component="h1" sx={{ ml: 2 }}>
          {document?.originalFilename || 'Document'} - AI Chat
        </Typography>
      </Box>

      {/* Main Content - Unified Layout */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Paper
          elevation={3}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2
          }}
        >
          {/* Chat Interface (Full Height) */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
            {latestSummary ? (
              <SummaryChat
                summaryId={latestSummary.id || documentId || 'default'}
                chatHook={chatHook}
                maxContentHeight={2000} // Large enough to not constrain
                initialSummary={latestSummary.summaryText}
              />
            ) : (
              <Box p={4} textAlign="center">
                <Typography color="text.secondary">Chat unavailable</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Connection Status Indicator */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000
        }}
      >
        {chatHook.isConnected ? (
          <Alert severity="success" sx={{ boxShadow: 2 }}>
            AI Assistant Connected
          </Alert>
        ) : chatHook.error ? (
          <Alert severity="error" sx={{ boxShadow: 2 }}>
            {chatHook.error}
          </Alert>
        ) : (
          <Alert severity="info" sx={{ boxShadow: 2 }}>
            Connecting to AI Assistant...
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default InteractiveSummaryPage;