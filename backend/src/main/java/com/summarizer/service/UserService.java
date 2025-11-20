package com.summarizer.service;

import com.summarizer.entity.Document;
import com.summarizer.entity.User;
import com.summarizer.exception.ResourceNotFoundException;
import com.summarizer.repository.DocumentRepository;
import com.summarizer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    public UUID getCurrentUserId(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return user.getId();
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    public Document getUserDocument(UUID documentId, UUID userId) {
        return documentRepository.findByIdAndUserId(documentId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));
    }

    public Page<Document> getUserDocuments(UUID userId, Pageable pageable) {
        return documentRepository.findByUserIdOrderByUploadTimestampDesc(userId, pageable);
    }

    public Page<Document> searchUserDocuments(UUID userId, String searchTerm, Pageable pageable) {
        return documentRepository.findByUserIdAndSearchTerm(userId, searchTerm, pageable);
    }

    public void deleteDocument(UUID documentId) {
        documentRepository.deleteById(documentId);
    }

    public long getUserDocumentCount(UUID userId) {
        return documentRepository.countByUserIdAndStatus(userId, "completed");
    }

    public User createUser(String email, String passwordHash) {
        User user = new User(email, passwordHash);
        return userRepository.save(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public void deleteUser(UUID userId) {
        userRepository.deleteById(userId);
    }
}