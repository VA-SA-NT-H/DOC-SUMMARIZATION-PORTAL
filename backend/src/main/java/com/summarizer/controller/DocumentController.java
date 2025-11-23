package com.summarizer.controller;

import com.summarizer.dto.DocumentUploadResponse;
import com.summarizer.dto.SummaryRequest;
import com.summarizer.dto.SummaryResponse;
import com.summarizer.entity.Document;
import com.summarizer.entity.Summary;
import com.summarizer.repository.SummaryRepository;
import com.summarizer.service.DocumentProcessingService;
import com.summarizer.service.MappingService;
import com.summarizer.service.SummaryService;
import com.summarizer.service.UserService;
import org.apache.tika.exception.TikaException;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentProcessingService documentProcessingService;

    @Autowired
    private SummaryService summaryService;

    @Autowired
    private UserService userService;

    @Autowired
    private MappingService mappingService;

    @Autowired
    private SummaryRepository summaryRepository;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentUploadResponse> uploadDocument(
            @RequestParam MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());

        try {
            Document document = documentProcessingService.processUploadedFile(file, userId);

            DocumentUploadResponse response = new DocumentUploadResponse(
                    document.getId(),
                    document.getOriginalFilename(),
                    document.getFileType(),
                    document.getFileSize(),
                    document.getStatus(),
                    document.getUploadTimestamp());

            return ResponseEntity.ok(response);
        } catch (IOException | TikaException e) {
            throw new RuntimeException("Failed to process file: " + e.getMessage(), e);
        }
    }

    @GetMapping
    public ResponseEntity<Page<DocumentUploadResponse>> getDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "uploadTimestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Document> documents = userService.getUserDocuments(userId, pageable);

        Page<DocumentUploadResponse> response = documents.map(doc -> new DocumentUploadResponse(
                doc.getId(),
                doc.getOriginalFilename(),
                doc.getFileType(),
                doc.getFileSize(),
                doc.getStatus(),
                doc.getUploadTimestamp()));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Document> getDocument(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        Document document = userService.getUserDocument(id, userId);

        return ResponseEntity.ok(document);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        Document document = userService.getUserDocument(id, userId);

        // Delete file from storage
        if (document.getFilePath() != null) {
            documentProcessingService.deleteDocumentFile(userId, document.getFilePath());
        }

        // Delete from database (this will also delete summaries due to CASCADE)
        userService.deleteDocument(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        Document document = userService.getUserDocument(id, userId);

        try {
            Path filePath = Path.of(document.getFilePath());
            Resource resource = new FileSystemResource(filePath);

            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + document.getOriginalFilename() + "\"")
                    .body(resource);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/summarize")
    public ResponseEntity<SummaryResponse> createSummary(
            @PathVariable UUID id,
            @Valid @RequestBody SummaryRequest summaryRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());

        // Verify document belongs to user
        userService.getUserDocument(id, userId);

        SummaryResponse resp = mappingService
                .toSummaryResponse(summaryService.createSummary(id, summaryRequest.getSummaryRatio()));

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<List<Summary>> getDocumentSummaries(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());

        // Verify document belongs to user
        userService.getUserDocument(id, userId);

        List<Summary> summaries = summaryService.getDocumentSummaries(id);

        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DocumentUploadResponse>> searchDocuments(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size, Sort.by("uploadTimestamp").descending());

        Page<Document> documents = userService.searchUserDocuments(userId, query, pageable);

        Page<DocumentUploadResponse> response = documents.map(doc -> new DocumentUploadResponse(
                doc.getId(),
                doc.getOriginalFilename(),
                doc.getFileType(),
                doc.getFileSize(),
                doc.getStatus(),
                doc.getUploadTimestamp()));

        return ResponseEntity.ok(response);
    }
}