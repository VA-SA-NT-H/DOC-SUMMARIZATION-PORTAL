# Use a Maven image to build the application
FROM maven:3.9.4-eclipse-temurin-17 AS build

WORKDIR /app
COPY pom.xml .
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Use a smaller runtime image
FROM eclipse-temurin:17-jre-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Create a non-root user named 'app'
# RUN addgroup -S app && adduser -S app -G app

# Create non-root user
RUN addgroup -g 1001 -S app && \
    adduser -u 1001 -S app -G app

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar



# Change ownership of the app directory
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose the port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]