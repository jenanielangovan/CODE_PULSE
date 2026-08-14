# API Documentation

This document lists the core endpoints offered by the Code Pulse Backend API.

## Base URL
`/api/v1`

## Endpoints

### Repositories

#### `GET /repositories`
Retrieve list of integrated repositories.

#### `POST /repositories`
Integrate a new repository.
- **Request Body**:
  ```json
  {
    "url": "https://github.com/owner/repo.git"
  }
  ```

### Analysis

#### `POST /repositories/:id/scan`
Trigger an on-demand scan.
- **Request Body**:
  ```json
  {
    "branch": "main"
  }
  ```

#### `GET /repositories/:id/reviews`
Retrieve code reviews history.

#### `GET /repositories/:id/pulse`
Retrieve historical trend pulse metrics.
