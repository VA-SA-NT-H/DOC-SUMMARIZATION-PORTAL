package com.summarizer.service;

import com.summarizer.entity.Document;
import com.summarizer.entity.Summary;
import com.summarizer.exception.ResourceNotFoundException;
import com.summarizer.repository.DocumentRepository;
import com.summarizer.repository.SummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
public class SummaryService {

    @Autowired
    private SummaryRepository summaryRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private AIService aiService;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    public Summary createSummary(UUID documentId, BigDecimal summaryRatio) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        if (document.getContentText() == null || document.getContentText().trim().isEmpty()) {
            throw new IllegalStateException("Document has no content to summarize");
        }

        // Update document status to processing
        document.setStatus("processing");
        documentRepository.save(document);

        try {
            // Call AI service for summarization
            long startTime = System.currentTimeMillis();
            String summaryText = aiService.generateSummary(document.getContentText(), summaryRatio);
            long processingTime = System.currentTimeMillis() - startTime;

            // Create summary entity
            Summary summary = new Summary();
            summary.setDocument(document);
            summary.setSummaryText(summaryText);
            summary.setSummaryRatio(summaryRatio);
            summary.setModelUsed("facebook/bart-large-cnn"); // Default model
            summary.setProcessingTimeMs((int) processingTime);
            summary.setConfidenceScore(new BigDecimal("0.85")); // Mock confidence score

            Summary savedSummary = summaryRepository.save(summary);

            // Update document status to completed
            document.setStatus("completed");
            document.setProcessedAt(LocalDateTime.now());
            documentRepository.save(document);

            return savedSummary;

        } catch (Exception e) {
            // Update document status to failed
            document.setStatus("failed");
            documentRepository.save(document);
            throw new RuntimeException("Failed to generate summary: " + e.getMessage(), e);
        }
    }

    public List<Summary> getDocumentSummaries(UUID documentId) {
        return summaryRepository.findByDocumentIdOrderByCreatedAtDesc(documentId);
    }

    public Summary getDocumentSummary(UUID documentId) {
        return summaryRepository.findByDocumentId(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Summary", "documentId", documentId));
    }

    public Summary updateSummary(UUID summaryId, String newSummaryText) {
        Summary summary = summaryRepository.findById(summaryId)
            .orElseThrow(() -> new ResourceNotFoundException("Summary", "id", summaryId));

        summary.setSummaryText(newSummaryText);
        return summaryRepository.save(summary);
    }

    public void deleteSummary(UUID summaryId) {
        if (!summaryRepository.existsById(summaryId)) {
            throw new ResourceNotFoundException("Summary", "id", summaryId);
        }
        summaryRepository.deleteById(summaryId);
    }

    public Page<Summary> getUserSummaries(UUID userId, Pageable pageable) {
        return summaryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public Summary getUserSummary(UUID summaryId, UUID userId) {
        Summary summary = summaryRepository.findById(summaryId)
            .orElseThrow(() -> new ResourceNotFoundException("Summary", "id", summaryId));

        // Verify summary belongs to user
        if (!summary.getDocument().getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Summary", "id", summaryId);
        }

        return summary;
    }

    public Page<Summary> searchUserSummaries(UUID userId, String query, Pageable pageable) {
        return summaryRepository.findByUserIdAndSearchTerm(userId, query, pageable);
    }

    public void deleteUserSummary(UUID summaryId, UUID userId) {
        Summary summary = getUserSummary(summaryId, userId);
        summaryRepository.deleteById(summaryId);
    }
}