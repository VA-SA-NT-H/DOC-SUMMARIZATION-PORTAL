import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Slider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { CloudUpload, InsertDriveFile } from '@mui/icons-material';
import { apiService } from '../services/api';
import { DocumentUploadResponse } from '../types/document';

interface FileUploadDropzoneProps {
  onUploadSuccess: (document: DocumentUploadResponse) => void;
  onUploadError: (error: string) => void;
}

const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [summaryRatio, setSummaryRatio] = useState(0.3);
  const [autoGenerateSummary, setAutoGenerateSummary] = useState(true);

  const maxSize = 50 * 1024 * 1024; // 50MB
  const acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setUploadProgress(0);
      onUploadError('');

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 500);

        const document = await apiService.uploadDocument(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Auto-generate summary if option is enabled
        if (autoGenerateSummary && document.status !== 'failed') {
          try {
            const ratioToSend = Math.min(Math.max(Number(summaryRatio), 0.10), 0.50);
            await apiService.createSummary(document.id, {
              summaryRatio: ratioToSend,
            });
          } catch (error) {
            console.error('Failed to auto-generate summary:', error);
          }
        }

        onUploadSuccess(document);
      } catch (error: any) {
        const message = error.response?.data?.message || 'Upload failed';
        onUploadError(message);
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    [onUploadSuccess, onUploadError, autoGenerateSummary, summaryRatio]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize,
    multiple: false,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasFileRejections = fileRejections.length > 0;
  const rejectionErrors = fileRejections.flatMap((rejection) =>
    rejection.errors.map((error) => {
      if (error.code === 'file-too-large') {
        return `File is too large. Maximum size is ${formatFileSize(maxSize)}`;
      }
      if (error.code === 'file-invalid-type') {
        return 'Invalid file type. Please upload PDF, TXT, or DOCX files.';
      }
      return error.message;
    })
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: `2px dashed ${isDragActive ? '#1976d2' : '#ccc'}`,
          backgroundColor: isDragActive ? '#f8f9fa' : '#ffffff',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: '#1976d2',
            backgroundColor: '#f8f9fa',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop your file here' : 'Drag & drop your document here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or click to browse files
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supported formats: PDF, TXT, DOCX (Max: {formatFileSize(maxSize)})
        </Typography>
      </Paper>

      {hasFileRejections && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {rejectionErrors.join(', ')}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography gutterBottom>
          Summary Length: {Math.round(summaryRatio * 100)}% of original
        </Typography>
        <Slider
          value={summaryRatio}
          onChange={(_, value) => setSummaryRatio(value as number)}
          min={0.1}
          max={0.5}
          step={0.05}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
          disabled={uploading}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={autoGenerateSummary}
              onChange={(e) => setAutoGenerateSummary(e.target.checked)}
              disabled={uploading}
            />
          }
          label="Auto-generate summary after upload"
        />
      </Box>

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading and generating summary...
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}
    </Box>
  );
};

export default FileUploadDropzone;