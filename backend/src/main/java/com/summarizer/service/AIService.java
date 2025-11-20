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
        // Simple fallback summarization
        int targetLength = (int) (contentText.length() * summaryRatio.doubleValue());

        if (contentText.length() <= targetLength) {
            return contentText;
        }

        String summary = contentText.substring(0, targetLength);
        if (summary.lastIndexOf('.') > 0) {
            summary = summary.substring(0, summary.lastIndexOf('.') + 1);
        }

        return summary;
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