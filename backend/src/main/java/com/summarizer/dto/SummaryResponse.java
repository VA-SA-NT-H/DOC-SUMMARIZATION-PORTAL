package com.summarizer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class SummaryResponse {
    private UUID id;
    private UUID documentId;
    private String summaryText;
    private BigDecimal summaryRatio;
    private String modelUsed;
    private Integer processingTimeMs;
    private BigDecimal confidenceScore;
    private LocalDateTime createdAt;

    // Default constructor
    public SummaryResponse() {}

    // Constructor with fields
    public SummaryResponse(UUID id, UUID documentId, String summaryText, BigDecimal summaryRatio,
                          String modelUsed, Integer processingTimeMs, BigDecimal confidenceScore, LocalDateTime createdAt) {
        this.id = id;
        this.documentId = documentId;
        this.summaryText = summaryText;
        this.summaryRatio = summaryRatio;
        this.modelUsed = modelUsed;
        this.processingTimeMs = processingTimeMs;
        this.confidenceScore = confidenceScore;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getDocumentId() {
        return documentId;
    }

    public void setDocumentId(UUID documentId) {
        this.documentId = documentId;
    }

    public String getSummaryText() {
        return summaryText;
    }

    public void setSummaryText(String summaryText) {
        this.summaryText = summaryText;
    }

    public BigDecimal getSummaryRatio() {
        return summaryRatio;
    }

    public void setSummaryRatio(BigDecimal summaryRatio) {
        this.summaryRatio = summaryRatio;
    }

    public String getModelUsed() {
        return modelUsed;
    }

    public void setModelUsed(String modelUsed) {
        this.modelUsed = modelUsed;
    }

    public Integer getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(Integer processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }

    public BigDecimal getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(BigDecimal confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}