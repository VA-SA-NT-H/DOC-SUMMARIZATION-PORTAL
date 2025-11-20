# AI-Based-Document-Summarization-Portal

## Overview

Build a complete document summarization web application from scratch where users can upload documents (PDF, TXT, DOCX) and receive AI-generated concise summaries. The application will feature a React frontend with file upload interface, a Spring Boot backend API for document processing, HuggingFace Transformers for AI summarization, and PostgreSQL for storing document history and summaries.

## Current State Analysis

Based on research findings, this is a greenfield project with no existing code. The repository contains only basic configuration files (README.md and .gitignore). No Spring Boot, React, database, or AI integration exists yet. This requires complete implementation of all components including project setup, configuration, and all feature code.

## Desired End State

A fully functional web application where users can:

1. Upload documents through a web interface
2. View real-time processing progress
3. Access AI-generated summaries
4. Browse history of all processed documents
5. Search and filter previous summaries
6. Download summaries in various formats

The application will handle file processing securely, scale to multiple concurrent users, and provide reliable AI summarization using transformer models.

---

## System Architecture Decisions

### AI Model Integration Approach

**Decision**: Local HuggingFace Transformers for cost control and full control

**Models to implement:**

- **Primary**: facebook/bart-large-cnn for general summarization
- **Alternative**: sshleifer/distilbart-cnn-12-6 for faster processing
- **Fallback**: t5-small for resource-constrained scenarios

**Integration approach:**

- Java Spring Boot application uses Python microservice for AI processing
- Python microservice runs HuggingFace Transformers library
- Communication via REST API or message queue
- Models downloaded and cached locally on startup

### Project Structure

**Monorepo approach**: Single repository with frontend and backend folders

```
AI-Based-Document-Summarization-Portal/
├── backend/          # Spring Boot application
├── frontend/         # React application
├── docker-compose.yml # Local development setup
└── README.md
```

---

## Tech Stack Details

### Backend Components

- **Spring Boot 3.x** with Java 17
- **Spring Security** for authentication (JWT-based)
- **Spring Data JPA** with PostgreSQL
- **HuggingFace Transformers Java SDK** or Python microservice
- **Apache Tika** for document text extraction
- **Spring WebFlux** for async processing
- **Redis** for caching and job queue

### Frontend Components

- **React 18** with TypeScript
- **Material-UI (MUI)** for components
- **React Query** for server state management
- **React Router** for navigation
- **Axios** for API calls
- **React Dropzone** for file uploads

### Database Schema (PostgreSQL)

**Users Table**

- id (UUID, Primary Key)
- email (VARCHAR, Unique, Not Null)
- password\_hash (VARCHAR, Not Null)
- created\_at (TIMESTAMP, Not Null)
- updated\_at (TIMESTAMP, Not Null)

**Documents Table**

- id (UUID, Primary Key)
- user\_id (UUID, Foreign Key to users)
- original\_filename (VARCHAR, Not Null)
- file\_type (VARCHAR, Not Null) - pdf, txt, docx
- file\_size (BIGINT, Not Null)
- content\_text (TEXT) - Extracted text content
- file\_path (VARCHAR) - Storage location
- upload\_timestamp (TIMESTAMP, Not Null)
- processed\_at (TIMESTAMP)
- status (VARCHAR) - uploaded, processing, completed, failed

**Summaries Table**

- id (UUID, Primary Key)
- document\_id (UUID, Foreign Key to documents)
- summary\_text (TEXT, Not Null)
- summary\_ratio (DECIMAL) - User-selected length ratio (0.1 to 0.5)
- model\_used (VARCHAR) - bart-large-cnn, distilbart, etc.
- processing\_time\_ms (INTEGER)
- confidence\_score (DECIMAL)
- created\_at (TIMESTAMP, Not Null)

---

## API Endpoints Specification

### Authentication Endpoints

- POST /api/auth/register - User registration (email + password)
- POST /api/auth/login - User login (returns JWT)
- POST /api/auth/refresh - Token refresh
- POST /api/auth/logout - User logout

**Authentication approach:**

- Email and password only (no OAuth)
- JWT tokens with 24-hour expiry
- Password hashing with bcrypt
- Email validation (required, unique)

### Document Management Endpoints

- POST /api/documents/upload - Upload document file
- GET /api/documents - List user's documents (paginated)
- GET /api/documents/{id} - Get document details
- DELETE /api/documents/{id} - Delete document
- GET /api/documents/{id}/download - Download original file

### Summary Endpoints

- POST /api/documents/{id}/summarize - Generate summary (request includes summary\_ratio parameter 0.1-0.5)
- GET /api/documents/{id}/summary - Get document summary
- PUT /api/summaries/{id} - Update summary notes
- GET /api/summaries/search - Search summaries by content

### WebSocket Endpoints

- /ws/processing-status - Real-time processing updates

---

## File Upload and Processing Pipeline

### Upload Process

1. **Frontend**: React Dropzone component validates file (max 50MB, allowed types)
2. **Backend**: Spring Boot receives multipart file, stores temporarily
3. **Validation**: File type verification, malware scanning
4. **Text Extraction**: Apache Tika extracts text content
5. **Storage**: File stored in secure local filesystem location
6. **Database**: Document record created with status "uploaded"

### AI Processing Pipeline

1. **Queue Job**: Document added to Redis processing queue
2. **Text Preprocessing**: Clean and prepare text for AI model
3. **Model Selection**: Choose appropriate summarization model based on text length
4. **AI Processing**: Generate summary using HuggingFace Transformers
5. **Post-processing**: Format summary, calculate confidence score
6. **Storage**: Save summary to database
7. **Notification**: Update document status, notify frontend via WebSocket

### Error Handling

- File size limits: Reject files > 50MB with clear error message
- Unsupported formats: Return 400 with list of supported formats
- Processing failures: Retry mechanism (max 3 attempts), then mark as failed
- AI model errors: Fallback to alternative model or API service

---

## Frontend Component Architecture

### Page Components

- **HomePage**: Landing page with upload area and recent summaries
- **DocumentListPage**: Browse and search all documents
- **DocumentDetailPage**: View document and its summaries
- **LoginPage**: User authentication
- **RegisterPage**: New user registration

### UI Components

- **FileUploadDropzone**: Drag-and-drop file upload with progress, custom summary length slider (10%-50%)
- **DocumentCard**: Preview of document in list view with file type icon and summary preview
- **SummaryDisplay**: Formatted summary display with copy/download options and processing metrics
- **ProcessingStatus**: Real-time processing progress with time estimates and step-by-step updates
- **SearchBar**: Search documents and summaries with filters for date, file type, length

### Processing Progress Updates

Frontend displays detailed progress with time estimates:

- **Step 1**: Uploading file (2-5 seconds estimated)
- **Step 2**: Extracting text content (5-15 seconds, depends on file size)
- **Step 3**: Generating summary (10-30 seconds, depends on text length)
- **Step 4**: Finalizing results (1-2 seconds)

Progress indicators show percentage completion and countdown timers when available.

### User Flow

1. User lands on HomePage
2. Drags file to upload area or clicks to browse
3. File uploads with progress indicator
4. Processing starts with real-time status updates
5. Summary displays once complete
6. User can view, copy, or download summary
7. All documents accessible from DocumentListPage

---

## Security Considerations

### File Security

- File type whitelist enforcement
- File size limits (50MB max)
- Virus scanning integration (ClamAV)
- Secure file storage with access controls
- Automatic file cleanup after 30 days

### API Security

- JWT-based authentication
- Rate limiting per user
- Input validation and sanitization
- CORS configuration for frontend domain
- HTTPS enforcement

### Data Privacy

- User isolation (users only see their own documents)
- Text encryption for sensitive documents
- Audit logging for all document access
- GDPR compliance features (data deletion)

---

## Performance and Scaling

### Caching Strategy

- Redis cache for frequently accessed summaries
- Browser caching for static assets
- Database query optimization with proper indexes

### Processing Optimization

- Async processing using Spring WebFlux
- Queue-based document processing
- Model warm-up for faster responses
- Batch processing for multiple documents

### Monitoring and Metrics

- Processing time tracking
- Success/failure rates
- User activity metrics
- Resource usage monitoring

---

## Testing Strategy

### Backend Testing

- Unit tests for all service classes
- Integration tests for API endpoints
- Database testing with TestContainers
- Mock AI model responses for testing

### Frontend Testing

- Component tests with React Testing Library
- E2E tests with Cypress for critical user flows
- File upload testing with various file types
- WebSocket connection testing

### Performance Testing

- Load testing for concurrent uploads
- AI processing benchmarking
- Database query performance testing
- Frontend bundle size optimization

---

## Detailed Implementation Specifications

### Backend Implementation Details

**Repository Structure:**

```
backend/
├── src/main/java/com/summarizer/
│   ├── config/          # Security, database, AI service config
│   ├── controller/      # REST API endpoints
│   ├── service/         # Business logic layer
│   ├── repository/      # JPA repositories
│   ├── entity/          # Database entities
│   ├── dto/             # Data transfer objects
│   └── exception/       # Custom exception handlers
├── src/main/resources/
│   ├── application.yml   # Configuration
│   └── db/migration/    # Flyway database migrations
└── Dockerfile
```

**Key Spring Boot Configuration:**

- Server port: 8080
- Database: PostgreSQL with Flyway migrations
- File upload: Max 50MB, temp directory configurable
- JWT secret: Environment variable
- AI service: Python microservice on port 8001

**Essential Dependencies:**

- spring-boot-starter-web
- spring-boot-starter-security
- spring-boot-starter-data-jpa
- spring-boot-starter-websocket
- jjwt (JWT tokens)
- apache-tika (text extraction)
- postgresql driver

### Python AI Service Implementation

**Repository Structure:**

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py         # FastAPI application
│   ├── models.py       # AI model management
│   ├── preprocessing.py # Text cleaning
│   └── schemas.py      # Pydantic models
├── requirements.txt
└── Dockerfile
```

**Key Features:**

- FastAPI REST API
- HuggingFace transformers integration
- Model caching in memory
- Async processing support
- Error handling and fallback models

**Models to Download:**

- facebook/bart-large-cnn (1.63GB)
- sshleifer/distilbart-cnn-12-6 (766MB)
- t5-small (242MB)

### Frontend Implementation Details

**Repository Structure:**

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API calls
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Helper functions
│   └── styles/         # CSS/styling
├── public/
└── package.json
```

**Key Technologies:**

- React 18 with TypeScript
- Material-UI v5 for components
- React Query for server state
- React Hook Form for form handling
- Axios for HTTP requests

**State Management:**

- Auth state: React Context
- Server state: React Query
- Form state: React Hook Form
- UI state: useState/useReducer

### Database Implementation

**PostgreSQL Schema:**

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('pdf', 'txt', 'docx')),
    file_size BIGINT NOT NULL,
    content_text TEXT,
    file_path VARCHAR(500),
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed'))
);

-- Summaries table
CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id),
    summary_text TEXT NOT NULL,
    summary_ratio DECIMAL(3,2) NOT NULL CHECK (summary_ratio >= 0.1 AND summary_ratio <= 0.5),
    model_used VARCHAR(50) NOT NULL,
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_summaries_document_id ON summaries(document_id);
CREATE INDEX idx_summaries_created_at ON summaries(created_at);
```

### Environment Configuration

**Backend Environment Variables:**

```
DATABASE_URL=jdbc:postgresql://localhost:5432/summarizer
DATABASE_USERNAME=summarizer_user
DATABASE_PASSWORD=secure_password
JWT_SECRET=your-256-bit-secret
AI_SERVICE_URL=http://localhost:8001
FILE_STORAGE_PATH=/app/uploads
MAX_FILE_SIZE=52428800
REDIS_URL=redis://localhost:6379
```

**Frontend Environment Variables:**

```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WS_URL=ws://localhost:8080/ws
REACT_APP_MAX_FILE_SIZE=52428800
```

**AI Service Environment Variables:**

```
MODEL_CACHE_DIR=/app/models
MAX_TEXT_LENGTH=1000000
BATCH_SIZE=8
```

### File Storage Implementation

**Local Storage Structure:**

```
uploads/
├── {user_id}/
│   ├── {document_id}/
│   │   ├── original.{extension}
│   │   └── extracted.txt
```

**Storage Service Features:**

- User-isolated directories
- Automatic cleanup of old files (30 days)
- File integrity validation
- Backup and restore procedures

### WebSocket Implementation

**WebSocket Endpoints:**

- `/ws/processing-status/{documentId}` - Real-time processing updates

**Message Format:**

```json
{
  "type": "progress_update",
  "documentId": "uuid",
  "step": "extracting_text",
  "progress": 45,
  "estimatedTimeRemaining": 12,
  "message": "Extracting text from PDF..."
}
```

### Error Handling Strategy

**Global Exception Handler:**

- File upload validation errors
- AI processing failures
- Database constraint violations
- Authentication/authorization errors
- Network and timeout errors

**Error Response Format:**

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "File size exceeds maximum limit of 50MB",
  "path": "/api/documents/upload"
}
```

### Security Implementation

**Password Security:**

- Minimum 8 characters
- Require uppercase, lowercase, number, special character
- bcrypt hashing with salt rounds = 12

**File Security:**

- File type validation by magic bytes, not just extension
- Virus scanning with ClamAV integration
- Secure filename generation (UUID-based)
- User directory isolation

**API Security:**

- JWT token validation
- Rate limiting: 10 requests/minute for upload endpoints
- CORS configuration for frontend domain only
- SQL injection prevention with parameterized queries

### Monitoring and Logging

**Application Logging:**

- Structured logging with JSON format
- Different levels: ERROR, WARN, INFO, DEBUG
- Log aggregation setup for production

**Metrics to Track:**

- Document processing success rate
- Average processing time by file type
- User registration and activity
- AI model performance metrics
- System resource usage

---

## Deployment Configuration

### Development Environment

**Docker Compose Setup:**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: summarizer
      POSTGRES_USER: summarizer_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=jdbc:postgresql://postgres:5432/summarizer
      - REDIS_URL=redis://redis:6379

  ai-service:
    build: ./ai-service
    ports:
      - "8001:8001"
    volumes:
      - model_cache:/app/models

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
  model_cache:
```

### Production Environment

**Infrastructure Requirements:**

- Minimum 4GB RAM for AI models
- 50GB storage for files + models
- Docker-capable hosting
- SSL certificate for HTTPS
- Backup strategy for database and files

**Production Optimizations:**

- Load balancer for multiple backend instances
- Redis cluster for high availability
- Database connection pooling
- CDN for file storage (optional upgrade path)
- Container orchestration (Kubernetes/Docker Swarm)

---

## Testing Requirements

### Backend Testing Requirements

**Unit Tests (Target: 90% coverage):**

- All service classes
- Repository methods
- Utility functions
- Authentication logic

**Integration Tests:**

- All API endpoints with various scenarios
- Database operations with test containers
- File upload and processing workflows
- WebSocket connections

**Test Scenarios:**

```java
@Test
void shouldUploadDocumentAndGenerateSummary() {
    // Test complete happy path
}

@Test
void shouldRejectInvalidFileTypes() {
    // Test file validation
}

@Test
void shouldHandleConcurrentProcessing() {
    // Test multiple simultaneous requests
}
```

### Frontend Testing Requirements

**Component Tests:**

- FileUploadDropzone component
- ProcessingStatus component
- DocumentCard component
- SummaryDisplay component

**E2E Tests with Cypress:**

- Complete user registration flow
- Document upload and processing
- Summary generation and display
- Error handling scenarios

**Accessibility Tests:**

- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation

### Performance Testing

**Load Testing Scenarios:**

- 100 concurrent file uploads
- 1000 simultaneous users browsing
- Large document processing (50MB PDF)
- Memory usage under sustained load

**Performance Benchmarks:**

- File upload: <5 seconds for 10MB file
- Text extraction: <15 seconds for 20MB document
- Summary generation: <30 seconds for most documents
- API response time: <200ms for non-processing requests

---

## Manual Testing Checklist

### Pre-Deployment Testing

**✅ User Authentication**

- User registration with valid/invalid emails
- Login with correct/incorrect passwords
- Session management and logout
- Password validation requirements

**✅ File Upload Functionality**

- Upload PDF, TXT, DOCX files successfully
- Reject unsupported file formats
- Handle files larger than 50MB
- Progress indicators work correctly

**✅ Document Processing**

- Text extraction from various file types
- Summary generation with different length settings
- Error handling for corrupted files
- Processing status updates via WebSocket

**✅ Summary Management**

- Display summaries in proper format
- Copy summary to clipboard functionality
- Download summary as text file
- Search and filter previous summaries

**✅ Security Validation**

- Users can only access their own documents
- File type validation bypass attempts
- SQL injection prevention
- XSS protection in summary display

**✅ Performance Validation**

- Multiple concurrent uploads work
- Memory usage stays within limits
- Database queries perform efficiently
- Frontend remains responsive during processing
# DOC-SUMMARIZATION-PORTAL
