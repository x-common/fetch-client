# Fetch Client Examples

This directory contains comprehensive examples demonstrating various features and use cases of the fetch-client library. Each example is a standalone TypeScript file that showcases specific functionality with detailed comments and real-world scenarios.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Example Files](#example-files)
- [Running Examples](#running-examples)
- [Example Categories](#example-categories)
- [Contributing](#contributing)

## 🚀 Getting Started

### Prerequisites

Before running the examples, ensure you have:

- **Node.js** 16.0.0 or higher
- **TypeScript** 5.0 or higher
- All project dependencies installed (`npm install`)

### Quick Setup

1. Clone or download the fetch-client project
2. Navigate to the project root directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Navigate to the examples directory:
   ```bash
   cd examples
   ```

## 📁 Example Files

### Core HTTP Operations

#### `basic-methods.ts` - HTTP Methods Fundamentals
**Purpose**: Demonstrates all basic HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD)

**What you'll learn**:
- Making GET requests with and without parameters
- POST requests with JSON data
- PUT requests for full resource updates
- PATCH requests for partial updates
- DELETE operations
- HEAD requests for metadata only
- Parallel request execution
- Custom headers for specific requests

**Key Features**:
```typescript
// Basic GET request
const post = await api.get<Post>('/posts/1');

// POST with data
const newPost = await api.post<Post>('/posts', {
  title: 'My New Post',
  body: 'Content here',
  userId: 1
});

// Parallel requests
const [post1, post2, post3] = await Promise.all([
  api.get('/posts/1'),
  api.get('/posts/2'),
  api.get('/posts/3')
]);
```

### File Operations

#### `upload.ts` - File Upload Examples
**Purpose**: Comprehensive file upload scenarios including single files, multiple files, and metadata

**What you'll learn**:
- Single file uploads with FormData
- Multiple file uploads in one request
- Image upload simulation
- Uploading files with rich metadata
- File validation before upload
- Progress tracking concepts

**Key Features**:
```typescript
// Single file upload
const formData = new FormData();
formData.append('file', fileBlob, 'filename.txt');
formData.append('description', 'File description');
const result = await api.post('/upload', formData);

// Multiple files with metadata
files.forEach((file, index) => {
  formData.append(`file${index}`, file.blob, file.name);
});
formData.append('totalFiles', files.length.toString());
```

#### `download.ts` - File Download Examples
**Purpose**: Various file download scenarios with different response types and processing methods

**What you'll learn**:
- Downloading text files
- JSON data downloads with parsing
- Binary file downloads
- Blob handling for different file types
- Streaming download simulation
- Conditional downloads based on content
- Custom headers for downloads

**Key Features**:
```typescript
// Text download
const textData = await api.get('/data', { responseType: 'text' });

// Binary download
const binaryData = await api.get('/file', { responseType: 'arrayBuffer' });
const buffer = Buffer.from(binaryData);

// Blob download with processing
const blob = await api.get('/content', { responseType: 'blob' });
const text = await blob.text();
```

### Configuration & Performance

#### `timeout.ts` - Timeout Configuration
**Purpose**: Comprehensive timeout management and error handling

**What you'll learn**:
- Global timeout configuration
- Per-request timeout overrides
- Timeout error handling and recovery
- Timeout behavior with retry logic
- Different timeout strategies for different operations
- Best practices for timeout configuration

**Key Features**:
```typescript
// Global timeout
const api = new Client({
  timeout: 10000 // 10 seconds for all requests
});

// Per-request override
const response = await api.get('/slow-endpoint', {
  timeout: 30000 // 30 seconds for this specific request
});

// Timeout error handling
try {
  await api.get('/endpoint');
} catch (error) {
  if (error.code === ERROR_CODES.TIMEOUT) {
    console.log('Request timed out');
  }
}
```

#### `retry.ts` - Retry Logic Implementation
**Purpose**: Advanced retry strategies and failure recovery mechanisms

**What you'll learn**:
- Basic retry configuration
- Custom retry conditions
- Exponential backoff strategies
- Retry behavior for different HTTP methods
- Circuit breaker pattern implementation
- Retry statistics and monitoring

**Key Features**:
```typescript
// Basic retry setup
const api = new Client({
  retry: {
    maxRetries: 3,
    delay: 1000,
    shouldRetry: [408, 429, 500, 502, 503, 504]
  }
});

// Custom retry logic
const customRetryClient = new Client({
  retry: {
    maxRetries: 5,
    delay: 2000,
    shouldRetry: (error) => {
      return error.code === ERROR_CODES.NETWORK_ERROR || 
             error.code === ERROR_CODES.TIMEOUT;
    }
  }
});
```

### Security & Authentication

#### `auth.ts` - Authentication Methods
**Purpose**: Various authentication strategies and security implementations

**What you'll learn**:
- Bearer token authentication
- API key authentication (header and query parameter)
- Basic authentication with credentials
- Custom authentication schemes
- JWT-like token handling
- Authentication interceptors for automatic token management
- Multi-service authentication patterns

**Key Features**:
```typescript
// Bearer token
const api = new Client({
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// API key authentication
const apiKeyClient = new Client({
  headers: {
    'X-API-Key': apiKey
  }
});

// Basic authentication
const credentials = btoa(`${username}:${password}`);
const basicAuthClient = new Client({
  headers: {
    'Authorization': `Basic ${credentials}`
  }
});

// Authentication interceptor
api.interceptors.request.use((request) => {
  if (isTokenExpired()) {
    token = refreshToken();
  }
  request.headers.set('Authorization', `Bearer ${token}`);
  return request;
});
```

#### `refresh-token.ts` - Advanced Refresh Token Authentication
**Purpose**: Comprehensive refresh token authentication patterns for modern applications

**What you'll learn**:
- Automatic token refresh mechanisms
- Token expiration detection and handling
- Retry on authentication failure
- Shared authentication across multiple clients
- Advanced token management with events and statistics
- Proactive token refresh strategies
- Token storage and lifecycle management

**Key Features**:
```typescript
// Token storage with expiration handling
class TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  isTokenExpired(): boolean {
    if (!this.expiresAt) return true;
    return Date.now() >= this.expiresAt - 60000; // 1 minute buffer
  }

  async getValidAccessToken(): Promise<string | null> {
    if (this.accessToken && !this.isTokenExpired()) {
      return this.accessToken;
    }
    
    if (this.refreshToken) {
      return await this.refreshAccessToken();
    }
    
    return null;
  }
}

// Authentication service with auto-refresh
class AuthService {
  async login(username: string, password: string) {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      const tokens = await response.json();
      this.tokenStorage.setTokens(tokens);
      return tokens;
    }
    
    throw new Error('Login failed');
  }
  
  async refreshAccessToken(): Promise<string> {
    // Automatic token refresh logic
    // Returns new access token or throws if refresh fails
  }
}

// Multiple clients with shared authentication
const authService = new AuthService();

const userApi = new Client({ baseURL: 'https://api.example.com/users' });
const orderApi = new Client({ baseURL: 'https://api.example.com/orders' });

// Shared authentication interceptor
const authInterceptor = async (request: Request) => {
  const token = await authService.getValidAccessToken();
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
};

userApi.interceptors.request.use(authInterceptor);
orderApi.interceptors.request.use(authInterceptor);
```

**Advanced Scenarios**:
- **Basic Refresh**: Simple token refresh when expired
- **Automatic Refresh**: Transparent token refresh during API calls
- **Expiration Handling**: Proactive refresh before token expires
- **Retry on Auth Failure**: Automatic retry after token refresh
- **Multi-Client Shared Auth**: Single auth service for multiple API clients
- **Token Statistics**: Usage tracking and performance monitoring

### Monitoring & Debugging

#### `logger.ts` - Logging Integration
**Purpose**: Comprehensive logging strategies for debugging and monitoring

**What you'll learn**:
- Basic request/response logging
- Structured logging with metadata
- Performance logging and metrics
- Error logging and categorization
- Conditional logging based on environment
- Log aggregation and statistics

**Key Features**:
```typescript
// Request logging interceptor
api.interceptors.request.use((request) => {
  logger.info('Outgoing Request', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });
  return request;
});

// Performance logging
const startTime = performance.now();
const response = await api.get('/endpoint');
const duration = performance.now() - startTime;
logger.info(`Request completed in ${duration}ms`);

// Error logging
try {
  await api.get('/endpoint');
} catch (error) {
  logger.error('Request failed', {
    error: error.message,
    status: error.status,
    code: error.code
  });
}
```

#### `timer.ts` - Performance Monitoring
**Purpose**: Advanced timing and performance analysis tools

**What you'll learn**:
- Basic request timing with interceptors
- Comprehensive performance monitoring
- Real-time metrics dashboard simulation
- Resource timing analysis
- Performance budgets and violation tracking
- Performance statistics and reporting

**Key Features**:
```typescript
// Basic timing
const timer = new RequestTimer();
api.interceptors.request.use((request) => {
  timer.startTimer(requestId);
  return request;
});

api.interceptors.response.use((response) => {
  const duration = timer.endTimer(requestId);
  console.log(`Request took ${duration}ms`);
  return response;
});

// Performance budgets
const budgets = {
  maxRequestTime: 2000,
  maxTotalTime: 10000,
  maxErrorRate: 0.1
};

// Real-time metrics
const metrics = {
  activeRequests: 0,
  requestsPerSecond: 0,
  avgResponseTime: 0
};
```

## 🏃 Running Examples

### Individual Examples

Run any example file directly using ts-node:

```bash
# Install ts-node globally if not already installed
npm install -g ts-node

# Run specific examples
npx ts-node basic-methods.ts
npx ts-node upload.ts
npx ts-node download.ts
npx ts-node timeout.ts
npx ts-node retry.ts
npx ts-node auth.ts
npx ts-node refresh-token.ts
npx ts-node logger.ts
npx ts-node timer.ts
```

### Compiled Examples

Alternatively, compile and run with Node.js:

```bash
# Compile TypeScript to JavaScript
npx tsc basic-methods.ts --outDir ./dist --target es2020 --module commonjs

# Run compiled JavaScript
node dist/basic-methods.js
```

### All Examples

Run all examples in sequence:

```bash
# Create a simple runner script
for file in *.ts; do
  echo "Running $file..."
  npx ts-node "$file"
  echo "---"
done
```

## 📚 Example Categories

### 🔧 Configuration Examples
- **timeout.ts**: Timeout management and configuration
- **retry.ts**: Retry logic and failure recovery
- **auth.ts**: Authentication and security
- **refresh-token.ts**: Advanced refresh token authentication

### 📁 File Operations
- **upload.ts**: File upload scenarios
- **download.ts**: File download and processing

### 🌐 HTTP Operations
- **basic-methods.ts**: Core HTTP methods and operations

### 📊 Monitoring & Debugging
- **logger.ts**: Logging and debugging tools
- **timer.ts**: Performance monitoring and analysis

## 🎯 Use Case Examples

### E-commerce API Integration
```typescript
// From basic-methods.ts
const products = await api.get('/products', {
  params: { category: 'electronics', limit: '10' }
});

const order = await api.post('/orders', {
  items: selectedItems,
  shippingAddress: userAddress,
  paymentMethod: 'credit_card'
});
```

### File Management System
```typescript
// From upload.ts and download.ts
// Upload user documents
const uploadResult = await api.post('/documents', formData, {
  timeout: 60000,
  headers: { 'X-User-ID': userId }
});

// Download processed reports
const report = await api.get('/reports/monthly', {
  responseType: 'blob',
  headers: { 'Accept': 'application/pdf' }
});
```

### Microservices Communication
```typescript
// From auth.ts and retry.ts
const serviceA = new Client({
  baseURL: 'https://auth.service.com',
  headers: { 'Authorization': `Bearer ${authToken}` },
  retry: { maxRetries: 3, delay: 1000 }
});

const serviceB = new Client({
  baseURL: 'https://data.service.com',
  headers: { 'X-API-Key': dataApiKey },
  timeout: 15000
});
```

### Real-time Dashboard
```typescript
// From timer.ts and logger.ts
// Performance monitoring
const metrics = await Promise.all([
  api.get('/metrics/cpu'),
  api.get('/metrics/memory'),
  api.get('/metrics/network')
]);

// Log aggregation
logger.info('Dashboard metrics updated', {
  timestamp: new Date().toISOString(),
  metrics: metrics.map(m => m.value)
});
```

## 🔍 Debugging Examples

Each example includes extensive error handling and debugging information:

```typescript
try {
  const result = await api.get('/endpoint');
  console.log('✅ Success:', result);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('❌ API Error:', {
      code: error.code,
      status: error.status,
      message: error.message,
      url: error.request.url
    });
  } else {
    console.error('❌ Unexpected error:', error);
  }
}
```

## 📝 Example Output

Each example produces detailed console output showing:

- **Step-by-step execution** with clear indicators
- **Success/failure status** with appropriate emojis
- **Performance metrics** (timing, response sizes)
- **Error details** when things go wrong
- **Best practice demonstrations**

Example output format:
```
🚀 Basic HTTP Methods Examples
==========================================

📡 1. GET - Fetching single post
✅ Post: sunt aut facere repellat provident...
   Body preview: quia et suscipit suscipit recusandae...

📡 2. GET with params - Fetching posts by user
✅ Found 3 posts by user 1
   1. sunt aut facere repellat provident...
   2. qui est esse
   3. ea molestias quasi exercitationem...

🎉 All basic HTTP methods demonstrated successfully!
```

## 🛠️ Customization

All examples are designed to be easily customizable:

### Changing API Endpoints
```typescript
// Replace JSONPlaceholder with your API
const api = new Client({
  baseURL: 'https://your-api.com',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

### Adding Custom Logic
```typescript
// Extend examples with your business logic
api.interceptors.response.use((response) => {
  // Your custom response processing
  if (response.status === 200) {
    // Track successful requests
    analytics.track('api_success', {
      endpoint: response.request.url
    });
  }
  return response;
});
```

### Environment Configuration
```typescript
// Use environment variables
const api = new Client({
  baseURL: process.env.API_BASE_URL,
  timeout: parseInt(process.env.API_TIMEOUT || '10000'),
  headers: {
    'Authorization': `Bearer ${process.env.API_TOKEN}`
  }
});
```

## 🤝 Contributing

We welcome contributions to improve these examples! Here's how you can help:

### Adding New Examples
1. Create a new `.ts` file following the naming convention
2. Include comprehensive comments and documentation
3. Add error handling and logging
4. Test with real API endpoints
5. Update this README with the new example

### Improving Existing Examples
1. Add more use cases or scenarios
2. Improve error handling
3. Add performance optimizations
4. Include additional TypeScript types
5. Enhance documentation

### Example Template
```typescript
/**
 * [Feature Name] Examples
 * 
 * This example demonstrates [description of what it shows]
 */

import { Client, ApiError } from '../libs/index';

async function demonstrate[FeatureName]() {
  console.log('🔧 [Step Description]...');
  
  try {
    // Your example code here
    console.log('✅ Success message');
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('❌ API Error:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

async function main() {
  console.log('🚀 [Feature Name] Examples\n');
  console.log('==========================================\n');
  
  await demonstrate[FeatureName]();
  
  console.log('🎉 All examples completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

export { demonstrate[FeatureName] };
```

## 📖 Additional Resources

- **Main Documentation**: [../README.md](../README.md)
- **API Reference**: TypeScript definitions in `../libs/types.ts`
- **Source Code**: Implementation in `../libs/` directory
- **Tests**: Test files in `../test/` directory

## 🐛 Troubleshooting

### Common Issues

#### TypeScript Compilation Errors
```bash
# Ensure TypeScript is installed
npm install -g typescript

# Check TypeScript version
tsc --version

# Compile with explicit configuration
npx tsc --target es2020 --module commonjs --esModuleInterop example.ts
```

#### Import Errors
```typescript
// Use relative imports
import { Client } from '../libs/index';

// Or absolute imports if configured
import { Client } from '@x-common/fetch-client';
```

#### Network Errors in Examples
```typescript
// Check if you have internet connection
// Some examples use external APIs like httpbin.org and jsonplaceholder.typicode.com

// For offline testing, modify the baseURL to use local servers
const api = new Client({
  baseURL: 'http://localhost:3000'
});
```

#### Permission Errors (File Operations)
```bash
# Ensure you have write permissions in the examples directory
chmod 755 examples/

# Run with appropriate permissions
sudo npx ts-node upload.ts  # If needed
```

---

💡 **Pro Tip**: Start with `basic-methods.ts` to understand the fundamentals, then explore other examples based on your specific use case!

🎯 **Next Steps**: After running the examples, check out the main project documentation and consider contributing your own examples or improvements!
