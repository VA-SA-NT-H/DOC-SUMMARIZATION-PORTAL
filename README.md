# AI-Based Document Summarization Portal

An intelligent platform for document summarization and interactive chat, powered by advanced AI models.

## 🚀 Features

- **Smart Summarization**: Automatically generates concise summaries for your documents.
- **AI Chat Assistant**: Interactive chat interface to query and discuss document content.
- **Secure Authentication**: Robust user login and registration system.
- **Document Management**: Easy upload and organization of files.
- **Responsive Design**: Modern, user-friendly interface built with React.

## 🛠️ Tech Stack

- **Frontend**: React, Nginx
- **Backend**: Java Spring Boot, PostgreSQL, Redis
- **AI Service**: Python, Google Gemini API
- **Infrastructure**: Docker, Docker Compose

## 📋 Prerequisites

- [Docker](https://www.docker.com/) installed on your machine.
- [Git](https://git-scm.com/) for cloning the repository.

## ⚡ Quick Start

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/yourusername/AI-Based-Document-Summarization-Portal.git](https://github.com/yourusername/AI-Based-Document-Summarization-Portal.git)
    cd AI-Based-Document-Summarization-Portal
    ```

2.  **Start the Application**
    Run the following command to build and start all services:
    ```bash
    docker-compose up --build
    ```

3.  **Access the Services**
    - **Web Interface**: [http://localhost:3000](http://localhost:3000)
    - **Backend API**: [http://localhost:8080](http://localhost:8080)
    - **AI Service**: [http://localhost:8001](http://localhost:8001)

## 📂 Project Structure

- `frontend/`: React-based user interface.
- `backend/`: Spring Boot application for business logic and data management.
- `ai-service/`: Python service handling AI model interactions.
- `database/`: Database initialization and migration scripts.
