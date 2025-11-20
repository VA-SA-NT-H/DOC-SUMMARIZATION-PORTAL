package com.summarizer.repository;

import com.summarizer.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    Page<Document> findByUserIdOrderByUploadTimestampDesc(UUID userId, Pageable pageable);

//    List<Document> findByUserIdAndStatus(UUID userId, String status);

    Optional<Document> findByIdAndUserId(UUID id, UUID userId);


    @Query("SELECT d FROM Document d WHERE d.userId = :userId AND d.status = :status")
    List<Document> findByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") String status);

    @Query("SELECT d FROM Document d WHERE d.userId = :userId AND " +
           "(LOWER(d.originalFilename) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(d.contentText) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Document> findByUserIdAndSearchTerm(UUID userId, String searchTerm, Pageable pageable);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.userId = :userId AND d.status = :status")
    long countByUserIdAndStatus(UUID userId, String status);

    @Query("SELECT d FROM Document d WHERE d.userId = :userId AND d.uploadTimestamp >= :since")
    List<Document> findByUserIdAndUploadTimestampAfter(UUID userId, LocalDateTime since);

    void deleteByUserId(UUID userId);
}