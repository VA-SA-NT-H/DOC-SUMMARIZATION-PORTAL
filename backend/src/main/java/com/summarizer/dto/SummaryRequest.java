package com.summarizer.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SummaryRequest {

    @JsonProperty("summaryRatio")
    @NotNull(message = "Summary ratio is required")
    @DecimalMin(value = "0.10", message = "Summary ratio must be at least 0.10 (10%)")
    @DecimalMax(value = "0.50", message = "Summary ratio must be at most 0.50 (50%)")
    private BigDecimal summaryRatio;

    // Default constructor
    public SummaryRequest() {}

    // Constructor with ratio
    public SummaryRequest(BigDecimal summaryRatio) {
        this.summaryRatio = summaryRatio;
    }

    // Getters and setters
    public BigDecimal getSummaryRatio() {
        return summaryRatio;
    }

    public void setSummaryRatio(BigDecimal summaryRatio) {
        this.summaryRatio = summaryRatio;
    }

    @JsonProperty("summary_ratio")
    public void setSummaryRatioFromSnake(BigDecimal summaryRatio) {
        if (summaryRatio != null) {
            this.summaryRatio = summaryRatio;
        }
    }
}