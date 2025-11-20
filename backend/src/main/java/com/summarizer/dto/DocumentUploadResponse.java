package com.summarizer.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;

public class DocumentUploadResponse {
    private UUID id;
    private String originalFilename;
    private String fileType;
    private Long fileSize;
    private String status;
    private LocalDateTime uploadTimestamp;
    private List<SummaryResponse> summaries;

    // Default constructor
    public DocumentUploadResponse() {}

    // Constructor with fields
    public DocumentUploadResponse(UUID id, String originalFilename, String fileType, Long fileSize, String status, LocalDateTime uploadTimestamp) {
        this.id = id;
        this.originalFilename = originalFilename;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.status = status;
        this.uploadTimestamp = uploadTimestamp;
    }

    public DocumentUploadResponse(String error, String message) {
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getUploadTimestamp() {
        return uploadTimestamp;
    }

    public void setUploadTimestamp(LocalDateTime uploadTimestamp) {
        this.uploadTimestamp = uploadTimestamp;
    }

    public List<SummaryResponse> getSummaries() {
        return summaries;
    }

    public void setSummaries(List<SummaryResponse> summaries) {
        this.summaries = summaries;
    }

}