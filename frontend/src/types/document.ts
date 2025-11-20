export interface Document {
  id: string;
  originalFilename: string;
  fileType: 'pdf' | 'txt' | 'docx';
  fileSize: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  uploadTimestamp: string;
  processedAt?: string;
  contentText?: string;
}

export interface DocumentUploadResponse {
  body: any;
  createElement: any;
  id: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  status: string;
  uploadTimestamp: string;
}

export interface Summary {
  id: string;
  documentId: string;
  summaryText: string;
  summaryRatio: number;
  modelUsed: string;
  processingTimeMs?: number;
  confidenceScore?: number;
  createdAt: string;
}

export interface SummaryRequest {
  summaryRatio: number;
  summary_ratio?: number;
}

export interface SummaryResponse {
  id: string;
  documentId: string;
  summaryText: string;
  summaryRatio: number;
  modelUsed: string;
  processingTimeMs?: number;
  confidenceScore?: number;
  createdAt: string;
}

export interface ProcessingUpdate {
  type: string;
  documentId: string;
  step: string;
  progress: number;
  estimatedTimeRemaining: number;
  message: string;
}