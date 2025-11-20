package com.summarizer.controller;

import com.summarizer.dto.SummaryRequest;
import com.summarizer.dto.SummaryResponse;
import com.summarizer.entity.Summary;
import com.summarizer.service.SummaryService;
import com.summarizer.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/summaries")
public class SummaryController {

    @Autowired
    private SummaryService summaryService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<Page<SummaryResponse>> getSummaries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Summary> summaries = summaryService.getUserSummaries(userId, pageable);

        Page<SummaryResponse> response = summaries.map(summary ->
            new SummaryResponse(
                summary.getId(),
                summary.getDocument().getId(),
                summary.getSummaryText(),
                summary.getSummaryRatio(),
                summary.getModelUsed(),
                summary.getProcessingTimeMs(),
                summary.getConfidenceScore(),
                summary.getCreatedAt()
            )
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SummaryResponse> getSummary(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        Summary summary = summaryService.getUserSummary(id, userId);

        SummaryResponse response = new SummaryResponse(
            summary.getId(),
            summary.getDocument().getId(),
            summary.getSummaryText(),
            summary.getSummaryRatio(),
            summary.getModelUsed(),
            summary.getProcessingTimeMs(),
            summary.getConfidenceScore(),
            summary.getCreatedAt()
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SummaryResponse> updateSummary(
            @PathVariable UUID id,
            @Valid @RequestBody SummaryRequest summaryRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        Summary summary = summaryService.getUserSummary(id, userId);

        // For now, only allow updating the summary text itself
        // In a real implementation, you might want to regenerate the summary
        // with the new ratio instead of just updating the text

        SummaryResponse response = new SummaryResponse(
            summary.getId(),
            summary.getDocument().getId(),
            summary.getSummaryText(),
            summary.getSummaryRatio(),
            summary.getModelUsed(),
            summary.getProcessingTimeMs(),
            summary.getConfidenceScore(),
            summary.getCreatedAt()
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSummary(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        summaryService.deleteUserSummary(id, userId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<Page<SummaryResponse>> searchSummaries(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Summary> summaries = summaryService.searchUserSummaries(userId, query, pageable);

        Page<SummaryResponse> response = summaries.map(summary ->
            new SummaryResponse(
                summary.getId(),
                summary.getDocument().getId(),
                summary.getSummaryText(),
                summary.getSummaryRatio(),
                summary.getModelUsed(),
                summary.getProcessingTimeMs(),
                summary.getConfidenceScore(),
                summary.getCreatedAt()
            )
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/document/{documentId}")
    public ResponseEntity<List<SummaryResponse>> getDocumentSummaries(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = userService.getCurrentUserId(userDetails.getUsername());

        // Verify document belongs to user
        userService.getUserDocument(documentId, userId);

        List<Summary> summaries = summaryService.getDocumentSummaries(documentId);

        List<SummaryResponse> response = summaries.stream()
            .map(summary -> new SummaryResponse(
                summary.getId(),
                summary.getDocument().getId(),
                summary.getSummaryText(),
                summary.getSummaryRatio(),
                summary.getModelUsed(),
                summary.getProcessingTimeMs(),
                summary.getConfidenceScore(),
                summary.getCreatedAt()
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}