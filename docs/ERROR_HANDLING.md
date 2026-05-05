# News Aggregator API - Error Handling & Async/Await Implementation

## Overview
This document outlines the comprehensive error handling and async/await patterns implemented in the news fetching functionality.

## Async/Await Implementation

### 1. **Service Layer** (`services/newsService.js`)
- **All methods use `async/await`** for external API calls
- Axios requests properly awaited with timeout configuration (10 seconds)
- Promise-based error handling with try-catch blocks

```javascript
static async fetchNewsByPreferences(preferences = [], options = {}) {
    try {
        const response = await axios.get(url, config);
        return response.data;
    } catch (error) {
        // Comprehensive error handling
    }
}
```

### 2. **Controller Layer** (`controllers/newsController.js`)
- **All route handlers are async functions**
- Proper await for service layer calls
- Try-catch blocks for error boundary

```javascript
static async getNews(req, res) {
    try {
        const newsData = await NewsService.fetchNewsByPreferences(...);
        res.status(200).json({ success: true, data: newsData });
    } catch (error) {
        // Handle and respond with appropriate error
    }
}
```

### 3. **Route Layer** (`routes/newsRoutes.js`)
- All routes protected with authentication middleware
- Async handlers properly configured

## Error Handling Implementation

### 1. **Global Error Handlers** (`middleware/errorHandler.js`)

#### A. **asyncHandler Wrapper**
Eliminates repetitive try-catch blocks:
```javascript
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
```

#### B. **Global Error Handler**
Catches all unhandled errors:
- JWT authentication errors (401)
- Validation errors (400)
- Axios/Network errors (503)
- Generic server errors (500)

#### C. **404 Handler**
Catches undefined routes with helpful messages

### 2. **Service Layer Error Handling** (`services/newsService.js`)

#### Types of Errors Handled:

**A. HTTP Response Errors (error.response)**
- `401` - Invalid API key
- `426` - Upgrade required
- `429` - Rate limit exceeded
- `500` - Server error
- `4xx` - Client errors
- `5xx` - Server errors

**B. Network Errors (error.request)**
- `ECONNABORTED` - Request timeout
- `ENOTFOUND` - DNS lookup failed
- `ECONNREFUSED` - Connection refused
- Generic network errors

**C. Configuration Errors**
- Missing API key
- Invalid configuration

#### Input Validation:
- Validates API key exists
- Sanitizes preferences array
- Validates numeric parameters (page, pageSize)
- Filters invalid preferences
- Falls back to top headlines if no valid preferences

#### Response Validation:
- Verifies response structure
- Validates articles array exists
- Handles missing data gracefully

### 3. **Controller Layer Error Handling** (`controllers/newsController.js`)

#### Request Validation:
- Validates pagination parameters
- Checks page number is valid (>= 1)
- Checks pageSize is within limits (1-100)
- Returns 400 for invalid inputs

#### Error Response Mapping:
```javascript
| Service Error              | HTTP Status | User Message                          |
|---------------------------|-------------|---------------------------------------|
| NEWS_API_KEY missing      | 500         | Service not properly configured       |
| Invalid API key           | 500         | Invalid news API configuration        |
| Rate limit exceeded       | 429         | Rate limit exceeded                   |
| Timeout                   | 504         | Request timeout                       |
| Network error             | 503         | Unable to fetch news                  |
| Upgrade required          | 402         | Subscription upgrade required         |
| Generic error             | 500         | Internal server error                 |
```

#### Development vs Production:
- Development mode includes error details
- Production mode hides sensitive error information
- Error stacks logged server-side only

### 4. **Authentication Error Handling** (`middleware/authMiddleware.js`)

Protected routes handle:
- Missing authorization header (401)
- Invalid token format (401)
- Invalid token signature (401)
- Expired token (401)
- User not found (401)
- Network/service errors (500)

## Error Flow

```
Request
    ↓
Authentication Middleware (authMiddleware.js)
    ↓ [If auth fails → 401 response]
    ↓
Route Handler (newsController.js)
    ↓
Input Validation
    ↓ [If invalid → 400 response]
    ↓
Service Layer (newsService.js)
    ↓
External API Call (NewsAPI)
    ↓ [On error → Categorize & throw custom error]
    ↓
Catch in Controller
    ↓
Map to appropriate HTTP status & message
    ↓
Send Response
    ↓
[Unhandled errors → Global Error Handler]
```

## Best Practices Implemented

✅ **Async/Await**: All asynchronous operations use async/await
✅ **Try-Catch**: Comprehensive error boundaries at each layer
✅ **Error Logging**: All errors logged with context
✅ **User-Friendly Messages**: Generic messages for security
✅ **Appropriate Status Codes**: RESTful HTTP status codes
✅ **Timeout Configuration**: 10-second timeout on external APIs
✅ **Input Validation**: All inputs validated before processing
✅ **Response Validation**: API responses validated before use
✅ **Graceful Degradation**: Falls back to top headlines
✅ **Security**: Sensitive info not exposed in production

## Testing Error Scenarios

### 1. **Invalid Authentication**
```bash
curl -X GET http://localhost:3000/api/v1/news
# Response: 401 - Access denied. No token provided.
```

### 2. **Invalid Pagination**
```bash
curl -X GET "http://localhost:3000/api/v1/news?page=-1" \
  -H "Authorization: Bearer TOKEN"
# Response: 400 - Invalid page number
```

### 3. **Network Timeout**
```bash
# Simulate by setting very low timeout or blocking network
# Response: 504 - Request timeout
```

### 4. **Rate Limit**
```bash
# Make too many requests
# Response: 429 - Rate limit exceeded
```

## Environment Variables Required

```env
JWT_SECRET=your_jwt_secret_here
NEWS_API_KEY=your_newsapi_key_here
NODE_ENV=development  # or production
```

## Summary

The implementation provides:
- **Complete async/await** patterns throughout the stack
- **Multi-layer error handling** with specific error types
- **Proper HTTP status codes** for different scenarios
- **Security** through sanitization and validation
- **User experience** with clear, actionable error messages
- **Developer experience** with detailed logging
- **Production-ready** with environment-aware error details
