package com.summarizer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class CacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String DOCUMENT_CACHE_PREFIX = "document:";
    private static final String SUMMARY_CACHE_PREFIX = "summary:";
    private static final String PROCESSING_QUEUE_PREFIX = "processing:";
    private static final int DEFAULT_CACHE_EXPIRY_HOURS = 24;

    public void cacheDocument(String documentId, Object documentData) {
        String key = DOCUMENT_CACHE_PREFIX + documentId;
        redisTemplate.opsForValue().set(key, documentData, DEFAULT_CACHE_EXPIRY_HOURS, TimeUnit.HOURS);
    }

    public Object getCachedDocument(String documentId) {
        String key = DOCUMENT_CACHE_PREFIX + documentId;
        return redisTemplate.opsForValue().get(key);
    }

    public void cacheSummary(String summaryId, Object summaryData) {
        String key = SUMMARY_CACHE_PREFIX + summaryId;
        redisTemplate.opsForValue().set(key, summaryData, DEFAULT_CACHE_EXPIRY_HOURS, TimeUnit.HOURS);
    }

    public Object getCachedSummary(String summaryId) {
        String key = SUMMARY_CACHE_PREFIX + summaryId;
        return redisTemplate.opsForValue().get(key);
    }

    public void addToProcessingQueue(String documentId, Object processingData) {
        String key = PROCESSING_QUEUE_PREFIX + documentId;
        redisTemplate.opsForValue().set(key, processingData, 1, TimeUnit.HOURS);
    }

    public Object getFromProcessingQueue(String documentId) {
        String key = PROCESSING_QUEUE_PREFIX + documentId;
        return redisTemplate.opsForValue().get(key);
    }

    public void removeFromProcessingQueue(String documentId) {
        String key = PROCESSING_QUEUE_PREFIX + documentId;
        redisTemplate.delete(key);
    }

    public void evictDocumentCache(String documentId) {
        String key = DOCUMENT_CACHE_PREFIX + documentId;
        redisTemplate.delete(key);
    }

    public void evictSummaryCache(String summaryId) {
        String key = SUMMARY_CACHE_PREFIX + summaryId;
        redisTemplate.delete(key);
    }

    public boolean existsInCache(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void setCache(String key, Object value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }

    public Object getCache(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteCache(String key) {
        redisTemplate.delete(key);
    }

    public void clearAllCache() {
        redisTemplate.getConnectionFactory().getConnection().flushAll();
    }
}