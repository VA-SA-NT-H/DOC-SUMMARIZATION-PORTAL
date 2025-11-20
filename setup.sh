#!/bin/bash

# AI Document Summarizer Setup Script
# This script sets up the development environment for the AI Document Summarizer

set -e

echo "🚀 Setting up AI Document Summarizer..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p database/init
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and update the JWT_SECRET before running the application!"
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
echo "🗄️  Checking PostgreSQL..."
if docker-compose exec postgres pg_isready -U postgres -d summarizer; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

# Check Redis
echo "🔴 Checking Redis..."
if docker-compose exec redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
    exit 1
fi

# Check Backend
echo "☕ Checking Backend..."
sleep 20  # Give backend more time to start
if curl -f http://localhost:8080/actuator/health &> /dev/null; then
    echo "✅ Backend is ready"
else
    echo "⚠️  Backend might still be starting... Check logs with: docker-compose logs backend"
fi

# Check AI Service
echo "🤖 Checking AI Service..."
sleep 30  # AI service takes longer to load models
if curl -f http://localhost:8001/health &> /dev/null; then
    echo "✅ AI Service is ready"
else
    echo "⚠️  AI Service might still be starting (downloading models)... Check logs with: docker-compose logs ai-service"
fi

# Check Frontend
echo "🌐 Checking Frontend..."
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend is ready"
else
    echo "⚠️  Frontend might still be starting..."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo "   AI Service: http://localhost:8001"
echo ""
echo "📊 Database Access:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: summarizer"
echo "   Username: postgres"
echo "   Password: 2004"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs: docker-compose logs -f [service]"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Rebuild services: docker-compose build --no-cache"
echo ""
echo "⚠️  Important Notes:"
echo "   - Make sure to update JWT_SECRET in .env file for production"
echo "   - AI service may take 2-5 minutes to download models on first run"
echo "   - Uploaded files are stored in ./uploads directory"
echo ""
echo "🎯 Next Steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Register a new account"
echo "   3. Upload a document and test the summarization"
echo ""