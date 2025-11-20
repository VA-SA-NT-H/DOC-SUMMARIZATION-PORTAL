package com.summarizer.service;

import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.summarizer.dto.DocumentUploadResponse;
import com.summarizer.dto.SummaryResponse;
import com.summarizer.entity.Document;
import com.summarizer.entity.Summary;

@Service
public class MappingService {
    
    public SummaryResponse toSummaryResponse(Summary s) {
    SummaryResponse r = new SummaryResponse();
    r.setId(s.getId());
    r.setSummaryText(s.getSummaryText());
    r.setSummaryRatio(s.getSummaryRatio());
    r.setModelUsed(s.getModelUsed());
    r.setCreatedAt(s.getCreatedAt());
    r.setDocumentId(s.getDocument() != null ? s.getDocument().getId() : null);
    return r;
}

public DocumentUploadResponse toDocumentResponse(Document d) {
    DocumentUploadResponse r = new DocumentUploadResponse();
    r.setId(d.getId());
    r.setOriginalFilename(d.getOriginalFilename());
    r.setFileType(d.getFileType());
    r.setFileSize(d.getFileSize());
    r.setStatus(d.getStatus());
    r.setUploadTimestamp(d.getUploadTimestamp());
    if (d.getSummaries() != null) {
        r.setSummaries(d.getSummaries().stream().map(this::toSummaryResponse).collect(Collectors.toList()));
    }
    return r;
}
}
