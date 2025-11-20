package com.summarizer.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

@Component
public class WebSocketHandler implements org.springframework.web.socket.WebSocketHandler {

    private static final Logger logger = Logger.getLogger(WebSocketHandler.class.getName());
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String documentId = extractDocumentId(session);
        if (documentId != null) {
            sessions.put(documentId, session);
            logger.info("WebSocket connection established for document: " + documentId);
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        // Handle incoming messages if needed
        logger.info("Received message: " + message.getPayload());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        logger.severe("WebSocket transport error: " + exception.getMessage());
        removeSession(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        logger.info("WebSocket connection closed: " + closeStatus);
        removeSession(session);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    public void sendProcessingUpdate(String documentId, ProcessingUpdate update) {
        WebSocketSession session = sessions.get(documentId);
        if (session != null && session.isOpen()) {
            try {
                String message = objectMapper.writeValueAsString(update);
                session.sendMessage(new TextMessage(message));
                logger.info("Sent processing update for document: " + documentId);
            } catch (IOException e) {
                logger.severe("Failed to send WebSocket message: " + e.getMessage());
                removeSession(session);
            }
        }
    }

    private String extractDocumentId(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null && query.contains("documentId=")) {
            return query.split("documentId=")[1].split("&")[0];
        }
        return null;
    }

    private void removeSession(WebSocketSession session) {
        sessions.entrySet().removeIf(entry -> entry.getValue().equals(session));
    }

    public static class ProcessingUpdate {
        private String type;
        private String documentId;
        private String step;
        private int progress;
        private int estimatedTimeRemaining;
        private String message;

        public ProcessingUpdate() {}

        public ProcessingUpdate(String type, String documentId, String step, int progress, int estimatedTimeRemaining, String message) {
            this.type = type;
            this.documentId = documentId;
            this.step = step;
            this.progress = progress;
            this.estimatedTimeRemaining = estimatedTimeRemaining;
            this.message = message;
        }

        // Getters and setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getDocumentId() { return documentId; }
        public void setDocumentId(String documentId) { this.documentId = documentId; }

        public String getStep() { return step; }
        public void setStep(String step) { this.step = step; }

        public int getProgress() { return progress; }
        public void setProgress(int progress) { this.progress = progress; }

        public int getEstimatedTimeRemaining() { return estimatedTimeRemaining; }
        public void setEstimatedTimeRemaining(int estimatedTimeRemaining) { this.estimatedTimeRemaining = estimatedTimeRemaining; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}