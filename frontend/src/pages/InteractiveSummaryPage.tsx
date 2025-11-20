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

  // Initialize chat hook
  const chatHook = useSummaryChat({
    summaryId: documentId || 'default'
  });

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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header with Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton
            onClick={() => navigate(`/documents/${documentId}`)}
            title="Back to document"
          >
            <BackIcon />
          </IconButton>
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              color="inherit"
              href="/"
              onClick={(e) => handleBreadcrumbClick(e, '/')}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <HomeIcon fontSize="inherit" />
              Home
            </Link>
            <Link
              color="inherit"
              href="/documents"
              onClick={(e) => handleBreadcrumbClick(e, '/documents')}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <DocumentIcon fontSize="inherit" />
              Documents
            </Link>
            <Link
              color="inherit"
              href={`/documents/${documentId}`}
              onClick={(e) => handleBreadcrumbClick(e, `/documents/${documentId}`)}
            >
              {document.originalFilename || document.id}
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <ChatIcon fontSize="inherit" />
              Interactive Summary
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* Page Title */}
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Interactive Summary View
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Discuss this document with an AI assistant that has access to the full content
        </Typography>
      </Box>

      {/* Main Content - Split Layout */}
      <Grid container spacing={3}>
        {/* Left Panel - Enhanced Summary Display */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 'calc(100vh - 240px)', minHeight: 600 }}>
            {latestSummary ? (
              <EnhancedSummaryDisplay
                summaryText={latestSummary.summaryText}
                modelUsed={latestSummary.modelUsed}
                confidenceScore={latestSummary.confidenceScore}
                createdAt={latestSummary.createdAt}
                maxContentHeight={isMobile ? 400 : 600}
              />
            ) : (
              <Paper
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <Box>
                  <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Summary Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This document doesn't have a summary yet. Generate a summary first to use the interactive view.
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>
        </Grid>

        {/* Right Panel - Chat Interface */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 'calc(100vh - 240px)', minHeight: 600 }}>
            {latestSummary ? (
              <SummaryChat
                summaryId={latestSummary.id || documentId || 'default'}
                chatHook={chatHook}
                maxContentHeight={isMobile ? 400 : 600}
              />
            ) : (
              <Paper
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Chat Unavailable
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate a summary first to start chatting with the AI assistant.
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>

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