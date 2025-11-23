package com.summarizer.controller;

import com.summarizer.entity.Document;
import com.summarizer.entity.Summary;
import com.summarizer.repository.DocumentRepository;
import com.summarizer.repository.SummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/internal")
public class InternalController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private SummaryRepository summaryRepository;

    @Value("${internal.api.key}")
    private String internalApiKey;

    @GetMapping("/documents/{summaryId}/content")
    public ResponseEntity<?> getDocumentContentBySummaryId(
            @PathVariable UUID summaryId,
            @RequestHeader("X-Internal-API-Key") String apiKey) {

        if (!internalApiKey.equals(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return summaryRepository.findById(summaryId)
                .map(Summary::getDocument)
                .map(doc -> {
                    return ResponseEntity.ok(Map.of(
                        "documentId", doc.getId(),
                        "content", doc.getContentText() != null ? doc.getContentText() : ""
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
