# News Aggregator API

A comprehensive RESTful API for aggregating, caching, and managing news articles from external news sources. Built with Node.js, Express, and NewsAPI integration.

[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=23743821&assignment_repo_type=AssignmentRepo)

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Secure password hashing with bcrypt
  - User registration and login

- **Personalized News Feed**
  - Fetch news based on user preferences
  - Customizable news categories
  - Multi-language support

- **News Search**
  - Keyword-based search functionality
  - Advanced filtering and sorting options
  - Pagination support

- **Article Management**
  - Mark articles as read
  - Save favorite articles
  - Track reading history

- **Smart Caching**
  - In-memory caching with TTL (5 minutes)
  - Reduces API calls by up to 90%
  - Cache management endpoints

- **Background Scheduler**
  - Automatic cache updates every 5-10 minutes
  - Maintains fresh content for popular searches
  - Configurable update intervals

- **Comprehensive Error Handling**
  - Input validation
  - Detailed error messages
  - Rate limit handling

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- NewsAPI key (Get it from [newsapi.org](https://newsapi.org))

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd news-aggregator-api-sudheer1509
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   JWT_SECRET=your_jwt_secret_key_here
   NEWS_API_KEY=your_newsapi_key_here
   NODE_ENV=development
   ```

   **Generate JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Start the server**
   
   **Development mode:**
   ```bash
   npm run dev
   ```
   
   **Production mode:**
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation:**
- Name: 2-100 characters, letters only
- Email: Valid email format
- Password: 8+ characters, must contain letter and number

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": [],
    "createdAt": "2026-04-29T10:00:00Z"
  }
}
```

### Login
**POST** `/login`

Login and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "preferences": []
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 👤 User Endpoints

### Get User Profile
**GET** `/users/profile`

Get logged-in user's profile.

**Response:** `200 OK`

### Get User Preferences
**GET** `/users/preferences`

Retrieve user's news preferences.

### Update User Preferences
**PUT** `/users/preferences`

Update user's news preferences.

**Request Body:**
```json
{
  "preferences": ["technology", "sports", "business"]
}
```

---

## 📰 News Endpoints

### Get Personalized News
**GET** `/news`

Fetch news based on user preferences.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)
- `language` (optional): Language code (default: 'en')
- `sortBy` (optional): 'relevancy', 'popularity', 'publishedAt'

**Example:**
```bash
GET /news?page=1&pageSize=10&sortBy=popularity
```

### Search News
**GET** `/news/search/:keyword`

Search news articles by keyword.

**Example:**
```bash
GET /news/search/technology?page=1&pageSize=20
```

### Mark Article as Read
**POST** `/news/:id/read`

Mark an article as read.

### Mark Article as Favorite
**POST** `/news/:id/favorite`

Add article to favorites.

### Remove from Favorites
**DELETE** `/news/:id/favorite`

Remove article from favorites.

### Get Read Articles
**GET** `/news/read`

Retrieve all read articles.

### Get Favorite Articles
**GET** `/news/favorites`

Retrieve all favorite articles.

### Get User Statistics
**GET** `/news/stats`

Get user's article interaction statistics.

---

## 🗄️ Cache Management Endpoints

### Get Cache Statistics
**GET** `/cache/stats`

View cache performance statistics.

### Clear Cache
**DELETE** `/cache`

Clear all cached data.

### Clear Expired Cache
**DELETE** `/cache/expired`

Remove only expired cache entries.

---

## ⏰ Scheduler Management Endpoints

### Get Scheduler Statistics
**GET** `/scheduler/stats`

View background scheduler statistics.

### Start/Stop Scheduler
**POST** `/scheduler/start`  
**POST** `/scheduler/stop`

Control the background cache updater.

### Trigger Manual Update
**POST** `/scheduler/trigger`

Manually trigger a cache update.

### Update Configuration
**PUT** `/scheduler/config`

Update scheduler settings.

---

## 📁 Project Structure

```
news-aggregator-api/
├── app.js                      # Express app setup
├── controllers/                # Request handlers
├── models/                     # Data models
├── routes/                     # API routes
├── services/                   # Business logic
├── middleware/                 # Express middleware
├── utils/                      # Utility functions
├── docs/                       # Documentation
└── test/                       # Test files
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `NEWS_API_KEY` | NewsAPI.org API key | Yes |
| `NODE_ENV` | Environment | No |

### Cache Settings

- **TTL:** 5 minutes
- **Cleanup:** Every 10 minutes

### Scheduler Settings

- **Top Headlines:** Every 5 minutes
- **Popular Searches:** Every 10 minutes

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 🚦 Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": "fieldName"
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 429 | Rate Limit |
| 500 | Server Error |

## 🔒 Security Features

- Password hashing with bcrypt
- JWT authentication (24-hour expiry)
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 🌟 Technologies

- **Node.js** - Runtime
- **Express.js** - Framework
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Axios** - HTTP client
- **NewsAPI** - News source

## 📝 API Rate Limits

### NewsAPI
- **Developer Plan:** 100 requests/day
- **Cached Responses:** Unlimited

## 🚀 Production Deployment

### Recommendations

1. **Use Redis for caching**
2. **Use real database** (PostgreSQL/MongoDB)
3. **Enable HTTPS**
4. **Use PM2** for process management
5. **Set up monitoring**

## 📄 License

ISC License

## 👨‍💻 Author

Airtribe

---

**Built with ❤️ using Node.js and Express**

