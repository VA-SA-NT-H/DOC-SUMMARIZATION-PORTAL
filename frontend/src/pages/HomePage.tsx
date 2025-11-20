import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import { Description, Schedule, Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import FileUploadDropzone from '../components/FileUploadDropzone';
import { apiService } from '../services/api';
import { DocumentUploadResponse } from '../types/document';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadError, setUploadError] = useState('');

  const {
    data: recentDocuments,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useQuery(
    'recentDocuments',
    () => apiService.getDocuments(0, 5, 'uploadTimestamp', 'desc'),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleUploadSuccess = (document: DocumentUploadResponse) => {
    setUploadError('');
    refetchDocuments();
    // Navigate to document detail page
    navigate(`/documents/${document.id}`);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'txt':
        return '📝';
      case 'docx':
        return '📋';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Hero Section */}
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          AI Document Summarizer
        </Typography>
        <Typography variant="h6" paragraph>
          Transform your documents into concise summaries with AI-powered technology.
          Upload PDF, TXT, or DOCX files and get instant summaries.
        </Typography>
      </Paper>

      {/* Upload Section */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Upload Document
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload your document to generate an AI-powered summary. Choose your desired summary length and let our AI do the work.
        </Typography>

        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError('')}>
            {uploadError}
          </Alert>
        )}

        <FileUploadDropzone
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </Paper>

      {/* Features Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Description sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Smart AI Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Powered by advanced transformer models for accurate and coherent summaries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Real-time Processing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Watch your documents being processed in real-time with live progress updates
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Star sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Customizable Summaries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Adjust summary length from 10% to 50% of the original document
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Documents */}
      {recentDocuments?.content && recentDocuments.content.length > 0 && (
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Recent Documents</Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/documents')}
            >
              View All Documents
            </Button>
          </Box>

          <Grid container spacing={2}>
            {recentDocuments.content.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h4" sx={{ mr: 1 }}>
                        {getFileIcon(doc.fileType)}
                      </Typography>
                      <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1 }}>
                        {doc.originalFilename}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {formatFileSize(doc.fileSize)}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={doc.status}
                        color={getStatusColor(doc.status)}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(doc.uploadTimestamp).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default HomePage;