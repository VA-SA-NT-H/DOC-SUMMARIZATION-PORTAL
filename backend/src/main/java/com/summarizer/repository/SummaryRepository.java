package com.summarizer.repository;

import com.summarizer.entity.Summary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SummaryRepository extends JpaRepository<Summary, UUID> {

    List<Summary> findByDocumentIdOrderByCreatedAtDesc(UUID documentId);

    Optional<Summary> findByDocumentId(UUID documentId);

    @Query("SELECT s FROM Summary s WHERE s.document.userId = :userId " +
           "ORDER BY s.createdAt DESC")
    Page<Summary> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT s FROM Summary s WHERE s.document.userId = :userId AND " +
           "LOWER(s.summaryText) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Summary> findByUserIdAndSearchTerm(@Param("userId") UUID userId,
                                           @Param("searchTerm") String searchTerm,
                                           Pageable pageable);

    @Query("SELECT s FROM Summary s WHERE s.document.id = :documentId " +
           "ORDER BY s.createdAt DESC")
    List<Summary> findLatestByDocumentId(@Param("documentId") UUID documentId);

    boolean existsByDocumentId(UUID documentId);

    void deleteByDocumentId(UUID documentId);
}