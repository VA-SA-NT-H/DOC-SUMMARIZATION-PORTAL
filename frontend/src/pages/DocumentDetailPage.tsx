import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ArrowBack,
  Download,
  Delete,
  Summarize,
  Refresh,
  ContentCopy,
  FileDownload,
  Chat,
} from "@mui/icons-material";
import { useQuery, useMutation } from "react-query";
import { apiService } from "../services/api";
import {
  DocumentUploadResponse,
  SummaryRequest,
  SummaryResponse,
  ProcessingUpdate,
} from "../types/document";
import { Link as RouterLink } from 'react-router-dom';

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryRatio, setSummaryRatio] = useState(0.3);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState(0);

  // Fetch document details (renamed `document` -> `doc` to avoid DOM collision)
  const {
    data: doc,
    isLoading: docLoading,
    refetch: refetchDoc,
  } = useQuery<DocumentUploadResponse, Error>(
    ["document", id],
    () => apiService.getDocument(id!),
    {
      enabled: !!id,
      refetchInterval: (data) =>
        (data as DocumentUploadResponse)?.status === "processing" ? 3000 : false,
    }
  );

  // Fetch document summaries
  const {
    data: summaries,
    isLoading: summariesLoading,
    refetch: refetchSummaries,
  } = useQuery<SummaryResponse[], Error>(
    ["document-summaries", id],
    () => apiService.getDocumentSummaries(id!),
    {
      enabled: !!id && (doc as DocumentUploadResponse)?.status === "completed",
    }
  );

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (doc?.status === "processing" && id) {
      const ws = new WebSocket(
        `ws://localhost:8080/ws/processing-status?documentId=${id}`
      );
      ws.onmessage = (event) => {
        const update: ProcessingUpdate = JSON.parse(event.data);
        setProcessingStatus(update.message);
        setProcessingProgress(update.progress);
        if (update.progress === 100) {
          setTimeout(() => {
            refetchDoc();
            refetchSummaries();
          }, 2000);
        }
      };
      ws.onerror = () => {
        console.error("WebSocket connection error");
      };
      return () => {
        ws.close();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.status, id]);

  // Mutations
  const createSummaryMutation = useMutation(
    (request: SummaryRequest) => apiService.createSummary(id!, request),
    {
      onSuccess: () => {
        setSummaryDialogOpen(false);
        setError("");
        refetchDoc();
        refetchSummaries();
      },
      onError: (error: any) => {
        setError(error.response?.data?.message || "Failed to generate summary");
      },
    }
  );

  const downloadDocumentMutation = useMutation(() => apiService.downloadDocument(id!), {
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = window.window.document.createElement("a");
      link.href = url;
      link.download = doc?.originalFilename || "document";
      window.window.window.document.body.appendChild(link);
      link.click();
      window.window.window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || "Failed to download document");
    },
  });

  const deleteDocumentMutation = useMutation(() => apiService.deleteDocument(id!), {
    onSuccess: () => {
      navigate("/documents");
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || "Failed to delete document");
    },
  });

  const handleCreateSummary = () => {
    createSummaryMutation.mutate({
      summaryRatio: summaryRatio,
    });
  };

  const handleDownloadDocument = () => {
    downloadDocumentMutation.mutate();
  };

  const handleDeleteDocument = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this document and all its summaries?"
      )
    ) {
      deleteDocumentMutation.mutate();
    }
  };

  const handleCopySummary = (summaryText: string) => {
    navigator.clipboard.writeText(summaryText);
    // You could show a toast notification here
  };

  const handleDownloadSummary = (summary: SummaryResponse) => {
    const blob = new Blob([summary.summaryText], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = window.window.document.createElement("a");
    link.href = url;
    link.download = `summary_${doc?.originalFilename || "document"}_${summary.id}.txt`;
    window.window.window.document.body.appendChild(link);
    link.click();
    window.window.window.document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return "📄";
      case "txt":
        return "📝";
      case "docx":
        return "📋";
      default:
        return "📄";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (docLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!doc) {
    return (
      <Box>
        <Alert severity="error">Document not found</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/documents")}
          sx={{ mt: 2 }}
        >
          Back to Documents
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/documents")}
          sx={{ mr: 2 }}
        >
          Back to Documents
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">
            {getFileIcon(doc.fileType)} {doc.originalFilename}
          </Typography>
        </Box>
        {doc.status === "completed" && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Chat />}
            onClick={() => navigate(`/documents/${id}/interactive-summary`)}
            sx={{ ml: 2 }}
          >
            Chat with AI
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Document Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Document Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  File Type
                </Typography>
                <Typography variant="body1">
                  <Chip
                    label={doc.fileType.toUpperCase()}
                    size="small"
                    variant="outlined"
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  File Size
                </Typography>
                <Typography variant="body1">
                  {formatFileSize(doc.fileSize)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1">
                  <Chip
                    label={doc.status}
                    color={getStatusColor(doc.status)}
                    size="small"
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Upload Date
                </Typography>
                <Typography variant="body1">
                  {new Date(doc.uploadTimestamp).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>

            {/* Processing Progress */}
            {doc.status === "processing" && (
              <Box mt={3}>
                <Typography variant="body2" gutterBottom>
                  Processing Status: {processingStatus}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={processingProgress}
                  sx={{ mt: 1 }}
                />
              </Box>
            )}

            {/* Actions */}
            <Box mt={3}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownloadDocument}
                disabled={downloadDocumentMutation.isLoading}
                sx={{ mr: 2 }}
              >
                Download Document
              </Button>
              {doc.status === "completed" && (
                <Button
                  variant="outlined"
                  startIcon={<Summarize />}
                  onClick={() => setSummaryDialogOpen(true)}
                  sx={{ mr: 2 }}
                >
                  Generate Summary
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => refetchDoc()}
                sx={{ mr: 2 }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleDeleteDocument}
                disabled={deleteDocumentMutation.isLoading}
              >
                Delete Document
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary Statistics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Summaries
            </Typography>
            <Typography variant="h4" gutterBottom>
              {summaries?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last Summary
            </Typography>
            <Typography variant="body1">
              {summaries && summaries.length > 0
                ? new Date(summaries[0].createdAt).toLocaleDateString()
                : "No summaries yet"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Summaries Section */}
      {doc.status === "completed" && (
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            Summaries
          </Typography>
          {summariesLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : summaries && summaries.length > 0 ? (
            <Grid container spacing={3}>
              {summaries.map((summary) => (
                <Grid item xs={12} md={6} key={summary.id}>
                  <Card>
                    <CardContent>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={2}
                      >
                        <Typography variant="h6">
                          Summary #{summaries.indexOf(summary) + 1}
                        </Typography>
                        <Chip
                          label={`${Math.round(summary.summaryRatio * 100)}% length`}
                          size="small"
                          color="primary"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Created: {new Date(summary.createdAt).toLocaleString()}
                      </Typography>
                      {summary.modelUsed && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Model: {summary.modelUsed}
                        </Typography>
                      )}
                      {summary.processingTimeMs && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Processing Time: {summary.processingTimeMs}ms
                        </Typography>
                      )}
                      <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
                        {summary.summaryText}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Tooltip title="Copy to clipboard">
                        <IconButton size="small" onClick={() => handleCopySummary(summary.summaryText)}>
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download summary">
                        <IconButton size="small" onClick={() => handleDownloadSummary(summary)}>
                          <FileDownload />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chat with AI about this summary">
                        <IconButton
                          size="small"
                          component={RouterLink}
                          to={`/documents/${id}/interactive-summary`}
                          color="primary"
                        >
                          <Chat />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No summaries generated yet
              </Typography>
              <Button
                variant="contained"
                startIcon={<Summarize />}
                onClick={() => setSummaryDialogOpen(true)}
              >
                Generate First Summary
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {/* Summary Generation Dialog */}
      <Dialog open={summaryDialogOpen} onClose={() => setSummaryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Summary</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Select summary length (percentage of original document):</Typography>
          <Slider
            value={summaryRatio}
            onChange={(_, value) => setSummaryRatio(value as number)}
            min={0.1}
            max={0.5}
            step={0.05}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
            marks={[
              { value: 0.1, label: "10%" },
              { value: 0.2, label: "20%" },
              { value: 0.3, label: "30%" },
              { value: 0.4, label: "40%" },
              { value: 0.5, label: "50%" },
            ]}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSummary} variant="contained" disabled={createSummaryMutation.isLoading}>
            {createSummaryMutation.isLoading ? "Generating..." : "Generate Summary"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentDetailPage;

