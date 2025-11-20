import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthRequest, AuthResponse } from '../types/auth';
import { DocumentUploadResponse, SummaryRequest, SummaryResponse } from '../types/document';
import { Conversation } from '../types/chat';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        // 'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: AuthRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(credentials: AuthRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', credentials);
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/refresh');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  async getCurrentUser(): Promise<{ email: string }> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Document endpoints
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<DocumentUploadResponse> = await this.api.post(
      '/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async getDocuments(page = 0, size = 10, sortBy = 'uploadTimestamp', sortDir = 'desc'): Promise<{
    content: DocumentUploadResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    const response = await this.api.get('/documents', {
      params: { page, size, sortBy, sortDir },
    });
    return response.data;
  }

  async getDocument(id: string): Promise<DocumentUploadResponse> {
    const response: AxiosResponse<DocumentUploadResponse> = await this.api.get(`/documents/${id}`);
    return response.data;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.api.delete(`/documents/${id}`);
  }

  async downloadDocument(id: string): Promise<Blob> {
    const response = await this.api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async searchDocuments(query: string, page = 0, size = 10): Promise<{
    content: DocumentUploadResponse[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await this.api.get('/documents/search', {
      params: { query, page, size },
    });
    return response.data;
  }

  // Summary endpoints
  async createSummary(documentId: string, summaryRequest: SummaryRequest): Promise<SummaryResponse> {
    const response: AxiosResponse<SummaryResponse> = await this.api.post(
      `/documents/${documentId}/summarize`,
      summaryRequest
    );
    return response.data;
  }

  async getDocumentSummaries(documentId: string): Promise<SummaryResponse[]> {
    const response = await this.api.get(`/documents/${documentId}/summary`);
    return response.data;
  }

  async getSummaries(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Promise<{
    content: SummaryResponse[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await this.api.get('/summaries', {
      params: { page, size, sortBy, sortDir },
    });
    return response.data;
  }

  async getSummary(id: string): Promise<SummaryResponse> {
    const response: AxiosResponse<SummaryResponse> = await this.api.get(`/summaries/${id}`);
    return response.data;
  }

  async updateSummary(id: string, summaryRequest: SummaryRequest): Promise<SummaryResponse> {
    const response: AxiosResponse<SummaryResponse> = await this.api.put(
      `/summaries/${id}`,
      summaryRequest
    );
    return response.data;
  }

  async deleteSummary(id: string): Promise<void> {
    await this.api.delete(`/summaries/${id}`);
  }

  async searchSummaries(query: string, page = 0, size = 10): Promise<{
    content: SummaryResponse[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await this.api.get('/summaries/search', {
      params: { query, page, size },
    });
    return response.data;
  }

  // Conversation management endpoints
  async saveConversation(conversationId: string, title: string): Promise<void> {
    await this.api.post(`/conversations/${conversationId}/save`, { title });
  }

  async getUserConversations(userId: string, page = 0, size = 10): Promise<{
    content: Conversation[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await this.api.get(`/users/${userId}/conversations`, {
      params: { page, size },
    });
    return response.data;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.api.delete(`/conversations/${conversationId}`);
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const response: AxiosResponse<Conversation> = await this.api.get(`/conversations/${conversationId}`);
    return response.data;
  }

  async createChatSession(summaryId: string): Promise<{ sessionId: string }> {
    const response = await this.api.post('/chat/sessions', { summaryId });
    return response.data;
  }

  async closeChatSession(sessionId: string): Promise<void> {
    await this.api.delete(`/chat/sessions/${sessionId}`);
  }
}

export const apiService = new ApiService();