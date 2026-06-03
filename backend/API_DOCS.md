# API Documentation

This document describes all available REST API endpoints for the Automated Log Analysis System.

All endpoints under `/api` that require authentication expect a Bearer token in the `Authorization` header:
`Authorization: Bearer <your_jwt_token>`

## Authentication & User Routes

### 1. Register User
- **Endpoint:** `/api/auth/register`
- **Method:** `POST`
- **Expected Parameters:** JSON Body
  ```json
  {
    "username": "myuser",
    "password": "mypassword"
  }
  ```
- **What it returns:** 
  A JSON object containing the newly created user details and a JWT access token.
  ```json
  {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "myuser"
    },
    "access_token": "eyJhbG...",
    "token_type": "bearer"
  }
  ```

### 2. Login User
- **Endpoint:** `/api/auth/login`
- **Method:** `POST`
- **Expected Parameters:** JSON Body
  ```json
  {
    "username": "myuser",
    "password": "mypassword"
  }
  ```
- **What it returns:** 
  A JSON object containing the authenticated user details and a JWT access token.
  ```json
  {
    "user": {
      "id": "69a0...",
      "username": "myuser"
    },
    "access_token": "eyJhbG...",
    "token_type": "bearer"
  }
  ```

### 3. Get Current User Info
- **Endpoint:** `/api/auth/me`
- **Method:** `GET`
- **Expected Parameters:** None (Requires Authorization header)
- **What it returns:**
  A JSON object detailing the currently authenticated user.
  ```json
  {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "myuser"
    }
  }
  ```

## Project & Log Analysis Routes

### 4. List User Projects
- **Endpoint:** `/api/project`
- **Method:** `GET`
- **Expected Parameters:** None (Requires Authorization header)
- **What it returns:**
  A JSON array of projects created by the authenticated user.
  ```json
  {
    "projects": [
      {
        "project_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "name": "My Prod Server",
        "created_at": "2026-02-26T18:11:00Z"
      }
    ]
  }
  ```

### 5. Create Project & Upload Logs
- **Endpoint:** `/api/project`
- **Method:** `POST`
- **Expected Parameters:** `multipart/form-data` (Requires Authorization header)
  - `name`: String (The name of the new project)
  - `files`: File objects (List of `.log` files to upload and parse)
- **What it returns:**
  A JSON object containing the new project's ID and an indicator that background vector embeddings have started.
  ```json
  {
    "project_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "embedding_started": true
  }
  ```

### 6. Get Parsed Project Logs
- **Endpoint:** `/api/project/<project_id>/logs`
- **Method:** `GET`
- **Expected Parameters:** `project_id` in the URL path (Requires Authorization header)
- **What it returns:**
  A JSON object containing all the parsed log dictionaries grouped by the files they were uploaded from.
  ```json
  {
    "project_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "files": [
      {
        "filename": "server.log",
        "created_at": "2026-02-26T18:11:00Z",
        "logs": [
          {
            "timestamp": "2026-02-19T19:08:00",
            "level": "ERROR",
            "message": "Failed to update..."
          }
        ]
      }
    ]
  }
  ```

### 7. RAG AI Chat
- **Endpoint:** `/api/project/<project_id>/chat`
- **Method:** `POST`
- **Expected Parameters:** JSON Body & `project_id` in URL (Requires Authorization header)
  ```json
  {
    "messages": [
      { "role": "user", "content": "What errors did my application encounter?" }
    ]
  }
  ```
- **What it returns:**
  A JSON object containing the generated Markdown narrative response from the LLM, alongside the exact database documents retrieved by the $vectorSearch pipeline that were used as context.
  ```json
  {
    "response": "Based on the internal system alerts, your application encountered severe errors related to connectivity...",
    "context": [
      {
        "score": 0.82389,
        "text": "[ALERT] High Error Rate (Severity: HIGH) - Reason: Exceeded 5 ERROR logs within 10 minutes - Triggered by 6 logs. Example log: 2026-02-19 19:08 [ERROR] MeshDataService connection forcibly closed."
      }
    ]
  }
  ```

### 8. Get Alert Rule Engine Evaluation
- **Endpoint:** `/api/project/<project_id>/alerts`
- **Method:** `GET`
- **Expected Parameters:** `project_id` in the URL path (Requires Authorization header)
- **What it returns:**
  A JSON array containing deterministic alerts fired against the project logs based on rolling time windows. It includes exactly why the alert fired, severity, rolling stats, and the explicit logs that triggered it.
  ```json
  {
    "alerts": [
      {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "project_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "name": "High Error Rate",
        "severity": "HIGH",
        "reason": "Exceeded 5 ERROR logs within 10 minutes.",
        "time_detected": "2026-02-19T13:42:00",
        "stats": {
          "count": 6,
          "time_window_minutes": 10,
          "latest_timestamp": "2026-02-19T13:42:00"
        },
        "logs": [
          { "level": "ERROR", "message": "..." }
        ]
      }
    ]
  }
  ```
