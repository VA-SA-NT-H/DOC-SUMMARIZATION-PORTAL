package com.summarizer.model;

import java.math.BigDecimal;

public class AISummaryResponse {
    private String summary_text;
    private String model_used;
    private Integer processing_time_ms;
    private BigDecimal confidence_score;
    private Integer original_length;
    private Integer summary_length;

    // Default constructor
    public AISummaryResponse() {}

    // Getters and setters
    public String getSummaryText() {
        return summary_text;
    }

    public void setSummaryText(String summary_text) {
        this.summary_text = summary_text;
    }

    public String getModel_used() {
        return model_used;
    }

    public void setModel_used(String model_used) {
        this.model_used = model_used;
    }

    public Integer getProcessing_time_ms() {
        return processing_time_ms;
    }

    public void setProcessing_time_ms(Integer processing_time_ms) {
        this.processing_time_ms = processing_time_ms;
    }

    public BigDecimal getConfidence_score() {
        return confidence_score;
    }

    public void setConfidence_score(BigDecimal confidence_score) {
        this.confidence_score = confidence_score;
    }

    public Integer getOriginal_length() {
        return original_length;
    }

    public void setOriginal_length(Integer original_length) {
        this.original_length = original_length;
    }

    public Integer getSummary_length() {
        return summary_length;
    }

    public void setSummary_length(Integer summary_length) {
        this.summary_length = summary_length;
    }
}