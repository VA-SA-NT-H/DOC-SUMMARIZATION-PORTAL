package com.summarizer.service;

import com.summarizer.entity.Document;
import com.summarizer.exception.FileProcessingException;
import com.summarizer.exception.ResourceNotFoundException;
import com.summarizer.repository.DocumentRepository;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class DocumentProcessingService {

    @Value("${file.storage.path}")
    private String storagePath;

    @Value("${file.max-size}")
    private Long maxFileSize;

    private static final Set<String> ALLOWED_CONTENT_TYPES = new HashSet<>(Arrays.asList(
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ));

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
        ".pdf", ".txt", ".docx", ".doc"
    ));

    @Autowired
    private DocumentRepository documentRepository;

    public Document processUploadedFile(MultipartFile file, UUID userId) throws IOException, TikaException {
        // Validate file
        validateFile(file);

        // Create file metadata
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String fileType = determineFileType(file, fileExtension);

        // Create user's directory if it doesn't exist
        Path userDir = Path.of(storagePath, userId.toString());
        if (!Files.exists(userDir)) {
            Files.createDirectories(userDir);
        }

        // Generate unique file name
        String uniqueFileName = UUID.randomUUID() + fileExtension;
        Path filePath = userDir.resolve(uniqueFileName);

        // Save file to disk
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Extract text content
        String extractedText = extractTextFromFile(file);

        // Create document entity
        Document document = new Document();
        document.setUserId(userId);
        document.setOriginalFilename(originalFilename);
        document.setFileType(fileType);
        document.setFileSize(file.getSize());
        document.setContentText(extractedText);
        document.setFilePath(filePath.toString());
        document.setStatus("uploaded");

        // Save to database
        return documentRepository.save(document);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileProcessingException("File is empty");
        }

        if (file.getSize() > maxFileSize) {
            throw new FileProcessingException("File size exceeds maximum limit of " + (maxFileSize / 1024 / 1024) + "MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new FileProcessingException("Filename is required");
        }

        String fileExtension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(fileExtension.toLowerCase())) {
            throw new FileProcessingException("File type not supported. Allowed types: " + ALLOWED_EXTENSIONS);
        }

        // Additional content type validation
        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new FileProcessingException("File content type not supported. Allowed types: " + ALLOWED_CONTENT_TYPES);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.')).toLowerCase();
    }

    private String determineFileType(MultipartFile file, String extension) {
        if (extension.equals(".pdf")) {
            return "pdf";
        } else if (extension.equals(".txt")) {
            return "txt";
        } else if (extension.equals(".docx") || extension.equals(".doc")) {
            return "docx";
        }
        return "unknown";
    }

    private String extractTextFromFile(MultipartFile file) throws IOException, TikaException {
        try (InputStream stream = file.getInputStream()) {
            Tika tika = new Tika();
            String text = tika.parseToString(stream);

            // Clean up the extracted text
            return cleanExtractedText(text);
        } catch (Exception e) {
            throw new FileProcessingException("Failed to extract text from file: " + e.getMessage());
        }
    }

    private String cleanExtractedText(String text) {
        if (text == null) {
            return "";
        }

        // Remove excessive whitespace and normalize line breaks
        String cleaned = text.trim();
        cleaned = cleaned.replaceAll("\\r\\n", "\n");
        cleaned = cleaned.replaceAll("\\r", "\n");
        cleaned = cleaned.replaceAll("\\n\\s*\\n\\s*\\n", "\n\n"); // Remove excessive blank lines
        cleaned = cleaned.replaceAll(" +", " "); // Replace multiple spaces with single space

        return cleaned;
    }

    public void updateDocumentStatus(UUID documentId, String status) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        document.setStatus(status);
        if ("completed".equals(status)) {
            document.setProcessedAt(java.time.LocalDateTime.now());
        }

        documentRepository.save(document);
    }

    public void deleteDocumentFile(UUID userId, String filePath) {
        try {
            Path path = Path.of(filePath);
            if (Files.exists(path)) {
                Files.delete(path);
            }
        } catch (IOException e) {
            // Log error but don't throw exception
            System.err.println("Failed to delete file: " + e.getMessage());
        }
    }
}