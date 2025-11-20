package com.summarizer.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonBackReference;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "summaries")
@EntityListeners(AuditingEntityListener.class)
public class Summary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false, referencedColumnName = "id")
    @NotNull
    @JsonBackReference
    private Document document;

    @Column(name = "summary_text", nullable = false, columnDefinition = "TEXT")
    @NotNull
    private String summaryText;

    @Column(name = "summary_ratio", nullable = false, precision = 3, scale = 2)
    @NotNull
    @DecimalMin(value = "0.10", message = "Summary ratio must be at least 0.10")
    @DecimalMax(value = "0.50", message = "Summary ratio must be at most 0.50")
    private BigDecimal summaryRatio;

    @Column(name = "model_used", nullable = false, length = 50)
    @NotNull
    private String modelUsed;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    @Column(name = "confidence_score", precision = 3, scale = 2)
    private BigDecimal confidenceScore;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    // Default constructor
    public Summary() {}

    // Constructor with required fields
    public Summary(Document document, String summaryText, BigDecimal summaryRatio, String modelUsed) {
        this.document = document;
        this.summaryText = summaryText;
        this.summaryRatio = summaryRatio;
        this.modelUsed = modelUsed;
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Document getDocument() {
        return document;
    }

    public void setDocument(Document document) {
        this.document = document;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Summary summary = (Summary) o;
        return id != null && id.equals(summary.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Summary{" +
                "id=" + id +
                ", documentId=" + (document != null ? document.getId() : null) +
                ", modelUsed='" + modelUsed + '\'' +
                ", summaryRatio=" + summaryRatio +
                ", processingTimeMs=" + processingTimeMs +
                ", confidenceScore=" + confidenceScore +
                ", createdAt=" + createdAt +
                '}';
    }
}