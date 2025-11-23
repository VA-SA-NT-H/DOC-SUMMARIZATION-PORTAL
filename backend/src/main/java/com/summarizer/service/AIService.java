package com.summarizer.service;

import com.summarizer.exception.AIServiceException;
import com.summarizer.model.AISummaryRequest;
import com.summarizer.model.AISummaryResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

@Service
public class AIService {

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    @Autowired
    private RestTemplate restTemplate;

    public String generateSummary(String contentText, BigDecimal summaryRatio) {
        try {
            String url = aiServiceUrl + "/summarize";

            AISummaryRequest request = new AISummaryRequest(contentText, summaryRatio);

            AISummaryResponse response = restTemplate.postForObject(url, request, AISummaryResponse.class);

            if (response != null && response.getSummaryText() != null) {
                return response.getSummaryText();
            } else {
                throw new AIServiceException("Empty response from AI service");
            }

        } catch (Exception e) {
            // Fallback to simple summarization if AI service is unavailable
            return generateFallbackSummary(contentText, summaryRatio);
        }
    }

    private String generateFallbackSummary(String contentText, BigDecimal summaryRatio) {
        // Improved fallback summarization: Extract first N sentences
        if (contentText == null || contentText.isEmpty()) {
            return "";
        }

        // Split by sentence boundaries (period followed by space or newline)
        String[] sentences = contentText.split("(?<=\\.)\\s+");
        int totalSentences = sentences.length;
        int targetSentenceCount = Math.max(1, (int) (totalSentences * summaryRatio.doubleValue()));

        StringBuilder summary = new StringBuilder();
        for (int i = 0; i < Math.min(targetSentenceCount, totalSentences); i++) {
            summary.append(sentences[i]).append(" ");
            // Limit fallback summary to reasonable length (e.g., 1000 chars) to avoid huge texts
            if (summary.length() > 1000) {
                break;
            }
        }

        return summary.toString().trim();
    }

    public boolean isHealthy() {
        try {
            String url = aiServiceUrl + "/health";
            String response = restTemplate.getForObject(url, String.class);
            return response != null && response.contains("healthy");
        } catch (Exception e) {
            return false;
        }
    }
}