package com.summarizer.model;

import java.math.BigDecimal;

public class AISummaryRequest {
    private String text;
    private BigDecimal summary_ratio;
    private String model_name;

    public AISummaryRequest() {}

    public AISummaryRequest(String text, BigDecimal summaryRatio) {
        this.text = text;
        this.summary_ratio = summaryRatio;
        this.model_name = "facebook/bart-large-cnn"; // Default model
    }

    // Getters and setters
    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public BigDecimal getSummary_ratio() {
        return summary_ratio;
    }

    public void setSummary_ratio(BigDecimal summary_ratio) {
        this.summary_ratio = summary_ratio;
    }

    public String getModel_name() {
        return model_name;
    }

    public void setModel_name(String model_name) {
        this.model_name = model_name;
    }
}