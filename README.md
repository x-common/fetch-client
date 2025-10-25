# Fetch API - TypeScript HTTP Client

A lightweight, modern TypeScript HTTP client library built on the native fetch API. This library provides a powerful alternative to axios with advanced features like interceptors, automatic retries, comprehensive error handling, and full TypeScript support.


## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Client Configuration](#client-configuration)
  - [HTTP Methods](#http-methods)
  - [Request Configuration](#request-configuration)
  - [Response Handling](#response-handling)
  - [Error Handling](#error-handling)
  - [Interceptors](#interceptors)
  - [Retry Logic](#retry-logic)
- [Advanced Usage](#advanced-usage)
- [TypeScript Support](#typescript-support)
- [Examples](#examples)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Lightweight**: Built on native fetch API with zero dependencies
- **TypeScript Support**: Full type safety with comprehensive type definitions
- **Interceptors**: Request and response middleware for authentication, logging, and transformation
- **Automatic Retries**: Configurable retry logic with exponential backoff
- **Error Handling**: Comprehensive error management with detailed error codes
- **Response Parsing**: Automatic response parsing based on content type
- **Timeout Support**: Request timeout handling with customizable timeouts
- **Base URL Support**: Configure base URLs for consistent API endpoints
- **Header Management**: Global and per-request header configuration
- **Modern ES6+**: Uses modern JavaScript features with excellent browser support

## Available Exports

The library provides the following exports organized by category:


## Installation

```bash
npm install @x-common/fetch-client
```

```bash
yarn add @x-common/fetch-client
```

```bash
pnpm add @x-common/fetch-client
```

## Module Support

This package supports **ESM**, **CommonJS**, and **Browser** environments:

### ESM (Recommended)
```typescript
import { Client, HTTP_STATUS } from '@x-common/fetch-client';
import type { RequestConfig } from '@x-common/fetch-client';
```

### CommonJS
```javascript
const { Client, HTTP_STATUS } = require('@x-common/fetch-client');
```

### Browser (CDN)
```html
<!-- For modern browsers (ESM) -->
<script type="module">
  import { Client } from 'https://unpkg.com/@x-common/fetch-client/dist/browser/index.esm.min.js';
  const api = new Client({ baseURL: 'https://api.example.com' });
</script>

<!-- For older browsers (UMD) -->
<script src="https://unpkg.com/@x-common/fetch-client/dist/browser/index.umd.min.js"></script>
<script>
  const { Client } = FetchClient;
  const api = new Client({ baseURL: 'https://api.example.com' });
</script>
```

### Framework Integration

**React/Next.js:**
```typescript
import { Client } from '@x-common/fetch-client';

const api = new Client({ baseURL: process.env.NEXT_PUBLIC_API_URL });
```

**Vue/Nuxt:**
```typescript
import { Client } from '@x-common/fetch-client';

export const $api = new Client({ baseURL: useRuntimeConfig().public.apiBase });
```

**Angular:**
```typescript
import { Injectable } from '@angular/core';
import { Client } from '@x-common/fetch-client';

@Injectable({ providedIn: 'root' })
export class ApiService extends Client {
  constructor() {
    super({ baseURL: environment.apiUrl });
  }
}
```

The package automatically resolves to the correct module format based on your environment.

## Quick Start

### Basic Usage

```typescript
import { Client } from '@x-common/fetch-client';

// Create a client instance
const api = new Client({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Make requests
const users = await api.get('/users');
const newUser = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### With Authentication

```typescript
import { Client } from '@x-common/fetch-client';

const api = new Client({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer your-access-token',
    'Content-Type': 'application/json'
  }
});

// All requests will include the Authorization header
const profile = await api.get('/profile');
```

## API Reference

### Client Configuration

The `Client` constructor accepts a configuration object with the following options:

```typescript
interface ClientConfig {
  baseURL?: string;           // Base URL for all requests
  timeout?: number;           // Request timeout in milliseconds
  headers?: Record<string, string>; // Default headers for all requests
  retry?: RetryConfig;        // Retry configuration
  responseType?: ResponseType; // Default response parsing type
}
```

#### Configuration Examples

```typescript
// Minimal configuration
const api = new Client();

// Basic configuration
const api = new Client({
  baseURL: 'https://api.example.com'
});

// Full configuration
const api = new Client({
  baseURL: 'https://api.example.com',
  timeout: 15000,
  headers: {
    'User-Agent': 'MyApp/1.0.0',
    'Accept': 'application/json',
    'Authorization': 'Bearer token'
  },
  retry: {
    maxRetries: 3,
    delay: 1000
  },
  responseType: 'json'
});
```

### HTTP Methods

The client supports all standard HTTP methods:

#### GET Requests

```typescript
// Simple GET request
const users = await api.get('/users');

// GET with query parameters
const users = await api.get('/users', {
  params: { page: 1, limit: 10 }
});

// GET with custom headers
const users = await api.get('/users', {
  headers: { 'Cache-Control': 'no-cache' }
});
```

#### POST Requests

```typescript
// POST with JSON data
const newUser = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// POST with form data
const formData = new FormData();
formData.append('file', file);
const upload = await api.post('/upload', formData);

// POST with custom options
const result = await api.post('/users', userData, {
  timeout: 30000,
  headers: { 'X-Custom-Header': 'value' }
});
```

#### PUT Requests

```typescript
// Update entire resource
const updatedUser = await api.put('/users/123', {
  name: 'Jane Doe',
  email: 'jane@example.com',
  status: 'active'
});
```

#### PATCH Requests

```typescript
// Partial update
const updatedUser = await api.patch('/users/123', {
  status: 'inactive'
});
```

#### DELETE Requests

```typescript
// Delete resource
await api.delete('/users/123');

// Delete with confirmation
await api.delete('/users/123', {
  headers: { 'X-Confirm': 'true' }
});
```

#### HEAD Requests

```typescript
// Get headers only
const headers = await api.head('/users/123');
```

### Request Configuration

Each request method accepts an optional configuration object:

```typescript
interface RequestOptions {
  headers?: Record<string, string>; // Request-specific headers
  timeout?: number;                 // Request-specific timeout
  retry?: RetryConfig;             // Request-specific retry config
  responseType?: ResponseType;     // How to parse the response
  params?: Record<string, string>; // Query parameters
}
```

### Response Handling

#### Automatic Response Parsing

The client automatically parses responses based on the `Content-Type` header:

```typescript
// JSON response (Content-Type: application/json)
const data = await api.get('/users'); // Returns parsed object

// Text response (Content-Type: text/plain)
const text = await api.get('/status'); // Returns string

// Binary response (Content-Type: application/octet-stream)
const blob = await api.get('/download'); // Returns Blob
```

#### Manual Response Type

You can specify the response type explicitly:

```typescript
// Force JSON parsing
const data = await api.get('/data', { responseType: 'json' });

// Force text parsing
const text = await api.get('/data', { responseType: 'text' });

// Get as Blob
const blob = await api.get('/file', { responseType: 'blob' });

// Get as ArrayBuffer
const buffer = await api.get('/binary', { responseType: 'arrayBuffer' });
```

#### Working with Raw Responses

For full control over response handling, use the `request` method:

```typescript
const response = await api.request({
  url: '/users',
  method: 'GET'
});

// Access response properties
console.log(response.status);     // HTTP status code
console.log(response.statusText); // HTTP status text
console.log(response.headers);    // Response headers

// Get raw response data
const rawData = response.getRawData();
const parsedData = await response.getData();
```

### Error Handling

The client provides comprehensive error handling with detailed error information:

```typescript
import { ApiError, ERROR_CODES } from '@x-common/fetch-client';

try {
  const data = await api.get('/protected');
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Error Code:', error.code);
    console.log('HTTP Status:', error.status);
    console.log('Message:', error.message);
    console.log('Request URL:', error.request.url);
    
    // Handle specific error types
    switch (error.code) {
      case ERROR_CODES.NETWORK_ERROR:
        console.log('Network connection failed');
        break;
      case ERROR_CODES.TIMEOUT_ERROR:
        console.log('Request timed out');
        break;
      case ERROR_CODES.HTTP_ERROR:
        console.log('Server returned error status');
        break;
      case ERROR_CODES.PARSE_ERROR:
        console.log('Failed to parse response');
        break;
    }
  }
}
```

#### Error Types

- `NETWORK_ERROR`: Network connection issues
- `TIMEOUT_ERROR`: Request exceeded timeout limit
- `HTTP_ERROR`: Server returned error status (4xx, 5xx)
- `PARSE_ERROR`: Failed to parse response data
- `VALIDATION_ERROR`: Request validation failed
- `ABORT_ERROR`: Request was cancelled
- `UNKNOWN_ERROR`: Unexpected error occurred

### Interceptors

Interceptors allow you to transform requests and responses globally:

#### Request Interceptors

```typescript
// Add authentication to all requests
api.interceptors.request.use((request) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

// Log all outgoing requests
api.interceptors.request.use((request) => {
  console.log(`Sending ${request.method} request to ${request.url}`);
  return request;
});

// Modify request data
api.interceptors.request.use((request) => {
  if (request.method === 'POST' && request.body) {
    // Add timestamp to all POST requests
    const data = JSON.parse(request.body as string);
    data.timestamp = new Date().toISOString();
    request.body = JSON.stringify(data);
  }
  return request;
});
```

#### Response Interceptors

```typescript
// Handle authentication errors globally
api.interceptors.response.use((response) => {
  if (response.status === 401) {
    // Redirect to login or refresh token
    window.location.href = '/login';
  }
  return response;
});

// Log all responses
api.interceptors.response.use((response) => {
  console.log(`Received ${response.status} response from ${response.request.url}`);
  return response;
});

// Transform response data
api.interceptors.response.use((response) => {
  // Add metadata to all responses
  const originalGetData = response.getData.bind(response);
  response.getData = async () => {
    const data = await originalGetData();
    return {
      data,
      requestTime: response.request.timestamp,
      responseTime: Date.now()
    };
  };
  return response;
});
```

### Retry Logic

Configure automatic retries for failed requests:

#### Basic Retry Configuration

```typescript
const api = new Client({
  retry: {
    maxRetries: 3,        // Maximum number of retry attempts
    delay: 1000,          // Initial delay between retries (ms)
    shouldRetry: [408, 429, 500, 502, 503, 504] // Status codes to retry
  }
});
```

#### Advanced Retry Configuration

```typescript
const api = new Client({
  retry: {
    maxRetries: 5,
    delay: 2000,
    // Custom retry logic
    shouldRetry: (error) => {
      // Retry on network errors
      if (error.code === ERROR_CODES.NETWORK_ERROR) {
        return true;
      }
      // Retry on specific HTTP status codes
      if (error.status && [408, 429, 500, 502, 503, 504].includes(error.status)) {
        return true;
      }
      return false;
    }
  }
});
```

#### Per-Request Retry

```typescript
// Override retry config for specific requests
const data = await api.get('/critical-data', {
  retry: {
    maxRetries: 10,
    delay: 5000
  }
});
```

## Advanced Usage

### Multiple Client Instances

Create different client instances for different APIs:

```typescript
// Main API client
const mainApi = new Client({
  baseURL: 'https://api.myapp.com',
  headers: { 'Authorization': 'Bearer main-token' }
});

// Analytics API client
const analyticsApi = new Client({
  baseURL: 'https://analytics.myapp.com',
  headers: { 'X-API-Key': 'analytics-key' },
  timeout: 5000
});

// File upload client
const uploadApi = new Client({
  baseURL: 'https://upload.myapp.com',
  timeout: 60000, // Longer timeout for uploads
  retry: { maxRetries: 1 } // Fewer retries for uploads
});
```

### Dynamic Configuration

Update client configuration at runtime:

```typescript
const api = new Client();

// Set headers dynamically
api.setHeader('Authorization', `Bearer ${newToken}`);
api.setHeader('X-Client-Version', '2.0.0');

// Remove headers
api.removeHeader('Authorization');

// Get current configuration
const config = api.getConfig();
console.log(config.baseURL, config.headers);
```

### File Uploads

Handle file uploads with progress tracking:

```typescript
// Single file upload
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('file', file);
formData.append('description', 'Profile picture');

const result = await api.post('/upload', formData, {
  timeout: 60000, // 60 second timeout for uploads
  headers: {
    // Don't set Content-Type - let browser set it with boundary
  }
});

// Multiple file upload
const files = Array.from(fileInput.files);
const formData = new FormData();

files.forEach((file, index) => {
  formData.append(`file${index}`, file);
});

const result = await api.post('/upload-multiple', formData);
```

### Timeout Configuration

Manage request timeouts to prevent long-running requests:

```typescript
// Global timeout configuration
const api = new Client({
  baseURL: 'https://api.example.com',
  timeout: 10000 // 10 seconds timeout for all requests
});

// Per-request timeout override
try {
  const result = await api.get('/long-running-request', {
    timeout: 30000 // 30 seconds timeout for this specific request
  });
} catch (error) {
  if (error.code === ERROR_CODES.TIMEOUT_ERROR) {
    console.log('Request timed out');
  }
}

// Different timeouts for different operations
const quickData = await api.get('/quick-data', { timeout: 5000 });
const uploadResult = await api.post('/upload', formData, { timeout: 60000 });
```

## TypeScript Support

The library is built with TypeScript and provides excellent type safety:

### Typed Responses

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

// Typed request and response
const newUser = await api.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
} as CreateUserRequest);

// newUser is now typed as User
console.log(newUser.id, newUser.name);
```

### Custom Error Types

```typescript
interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string>;
}

try {
  await api.post('/users', userData);
} catch (error) {
  if (error instanceof ApiError && error.response) {
    const errorData = await error.response.getData<ApiErrorResponse>();
    console.log('Error code:', errorData.code);
    console.log('Error message:', errorData.message);
  }
}
```

### Generic Client

Create a typed wrapper for your API:

```typescript
class MyApiClient {
  private client: Client;

  constructor(baseURL: string, token: string) {
    this.client = new Client({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getUsers(): Promise<User[]> {
    return this.client.get<User[]>('/users');
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    return this.client.post<User>('/users', userData);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    return this.client.patch<User>(`/users/${id}`, userData);
  }

  async deleteUser(id: number): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }
}
```

## Examples

### React Integration

```typescript
import React, { useEffect, useState } from 'react';
import { Client, ApiError } from '@x-common/fetch-client';

const api = new Client({
  baseURL: 'https://api.example.com'
});

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const userData = await api.get('/users');
        setUsers(userData);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`Failed to load users: ${err.message}`);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Node.js Server Integration

```typescript
import { Client } from '@x-common/fetch-client';

// External API client
const externalApi = new Client({
  baseURL: 'https://external-api.com',
  headers: {
    'X-API-Key': process.env.EXTERNAL_API_KEY
  },
  timeout: 10000
});

// Express route handler
app.get('/api/external-data', async (req, res) => {
  try {
    const data = await externalApi.get('/data', {
      params: { 
        category: req.query.category,
        limit: req.query.limit || 10
      }
    });
    
    res.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.status || 500).json({
        error: error.message,
        code: error.code
      });
    } else {
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
});
```

### Testing with Mock Responses

```typescript
import { Client } from '@x-common/fetch-client';

// Mock client for testing
const mockApi = new Client();

// Mock successful response
mockApi.interceptors.response.use((response) => {
  if (response.request.url.includes('/users')) {
    // Return mock data
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
    
    response.getData = async () => mockUsers;
  }
  return response;
});

// Test your code
describe('User Service', () => {
  it('should fetch users', async () => {
    const users = await mockApi.get('/users');
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('John Doe');
  });
});
```

## Requirements

- **Node.js**: 16.0.0 or higher
- **TypeScript**: 5.0 or higher (for development)
- **Browsers**: All modern browsers with fetch support

**All public APIs are exported from the main entry point, allowing for clean imports:**

```typescript
// Import the main client
import { Client } from '@x-common/fetch-client';

// Import specific classes and utilities
import { 
  Client, 
  ApiError, 
  ApiRequest, 
  ApiResponse,
  Interceptor 
} from '@x-common/fetch-client';

// Import types
import type { 
  RequestConfig, 
  ClientConfig, 
  ResponseType,
  HttpMethod 
} from '@x-common/fetch-client';

// Import constants
import { 
  HTTP_STATUS, 
  ERROR_CODES, 
  CONTENT_TYPES 
} from '@x-common/fetch-client';
```

### Core Classes
- **`Client`**: Main HTTP client class for making requests
- **`ApiError`**: Enhanced error class with detailed error information
- **`ApiRequest`**: Request wrapper with additional metadata
- **`ApiResponse`**: Response wrapper with parsing capabilities
- **`Interceptor`**: Middleware system for request/response processing

### TypeScript Types
- **`Body`**: Request body types (string, FormData, Blob, etc.)
- **`HttpMethod`**: HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD)
- **`ResponseType`**: Response parsing types (json, text, blob, arrayBuffer)
- **`RetryConfig`**: Retry logic configuration
- **`RequestConfig`**: Individual request configuration options
- **`ClientConfig`**: Client-wide configuration options
- **`RequestOptions`**: Simplified request options interface
- **`ErrorCode`**: Error categorization codes

### Constants
- **`HTTP_STATUS`**: Common HTTP status codes
- **`ERROR_CODES`**: Standardized error codes for consistent error handling
- **`CONTENT_TYPES`**: Content-type parsing patterns
- **`DEFAULT_RETRY_STATUSES`**: Default HTTP status codes that trigger retries
- **`RETRY_DEFAULTS`**: Default retry configuration
- **`DEFAULT_RESPONSE_TYPE`**: Default response parsing mode

## Contributing

We welcome contributions! Please see our contributing guidelines for details on:

- Code style and conventions
- Testing requirements
- Pull request process
- Issue reporting

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


## Support

- **Issues**: [GitHub Issues](https://github.com/x-common/fetch-client/issues)
- **Discussions**: [GitHub Discussions](https://github.com/x-common/fetch-client/discussions)
- **Documentation**: [API Docs](https://x-common.github.io/fetch-client/)
