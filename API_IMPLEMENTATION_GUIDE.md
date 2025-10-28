# API Implementation Guide

**Base URL:** `https://mksm-sankalp.vercel.app`

Complete guide for integrating with the Sankalp Riyaz backend API.

---

## Quick Start

### 1. Register a New User
```javascript
const response = await fetch('https://mksm-sankalp.vercel.app/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    regNo: 'MKSM123',
    firstName: 'Sameer',
    lastName: 'Patil',
    email: 'sameer@example.com',
    batch: 'Batch A'
  })
});

const { token, user } = await response.json();
// Store token in localStorage or secure storage
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));
```

### 2. Login (Returning User)
```javascript
const response = await fetch('https://mksm-sankalp.vercel.app/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    regNo: 'MKSM123',
    email: 'sameer@example.com'
  })
});

const { token, user } = await response.json();
// Store token securely
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));
```

### 3. Create Practice Entry
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('https://mksm-sankalp.vercel.app/api/practice', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    entryClientId: crypto.randomUUID(), // Generate unique ID
    date: '2024-01-15',
    minutes: 120,
    practiceText: 'Practiced scales and arpeggios',
    sankalpWord: 'Dedication'
  })
});

const { entry } = await response.json();
```

---

## API Endpoints Reference

### 🔓 Public Endpoints

#### 1. Health Check
```http
GET https://mksm-sankalp.vercel.app/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "services": {
    "database": "connected",
    "api": "operational"
  }
}
```

---

#### 2. Register User
```http
POST https://mksm-sankalp.vercel.app/api/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "regNo": "MKSM123",
  "firstName": "Sameer",
  "lastName": "Patil",
  "email": "sameer@example.com",
  "batch": "Batch A"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "regNo": "MKSM123",
    "firstName": "Sameer",
    "lastName": "Patil",
    "email": "sameer@example.com",
    "batch": "Batch A"
  }
}
```

**Validation Rules:**
- `regNo`: Alphanumeric, 3-50 characters
- `firstName`, `lastName`: Required, max 100 characters
- `email`: Valid email format
- `batch`: Optional, max 50 characters

**Note:** If user already exists (by regNo), their details are updated and a new token is issued. For returning users, use the login endpoint instead.

---

#### 3. Login (Returning User)
```http
POST https://mksm-sankalp.vercel.app/api/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "regNo": "MKSM123",
  "email": "sameer@example.com"
}
```

**Response (200 - Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "regNo": "MKSM123",
    "firstName": "Sameer",
    "lastName": "Patil",
    "email": "sameer@example.com",
    "batch": "Batch A"
  }
}
```

**Response (401 - Invalid Credentials):**
```json
{
  "error": "Invalid registration number or email",
  "type": "auth_error"
}
```

**Validation Rules:**
- `regNo`: Alphanumeric, 3-50 characters
- `email`: Valid email format
- Both must match an existing user in the database

**Security Notes:**
- Requires both regNo AND email to authenticate (prevents unauthorized access)
- Generic error message prevents user enumeration
- Rate limited to prevent brute force attacks
- Returns JWT token (does not expire)

**Use Cases:**
- User logs out and wants to log back in
- User switches devices
- User reinstalls the app
- User wants to login on multiple devices

---

### 🔒 Authenticated Endpoints

All authenticated endpoints require:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 4. Create Practice Entry
```http
POST https://mksm-sankalp.vercel.app/api/practice
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2024-01-15",
  "minutes": 120,
  "practiceText": "Practiced scales and arpeggios for two hours",
  "sankalpWord": "Dedication"
}
```

**Response (201 - Created):**
```json
{
  "entry": {
    "id": "uuid",
    "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "regNo": "MKSM123",
    "date": "2024-01-15",
    "minutes": 120,
    "practiceText": "Practiced scales and arpeggios for two hours",
    "sankalpWord": "Dedication",
    "synced": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (200 - Duplicate):**
If the same `entryClientId` is sent again, returns existing entry with status 200.

**Validation Rules:**
- `entryClientId`: Valid UUID v4 format (use `crypto.randomUUID()`)
- `date`: ISO date format (YYYY-MM-DD), cannot be in future
- `minutes`: Integer between 1 and 1440 (24 hours)
- `practiceText`: Optional, max 5000 characters
- `sankalpWord`: Optional, max 100 characters

**Idempotency:** Safe to retry with same `entryClientId` - prevents duplicate entries.

---

#### 5. Get Practice History
```http
GET https://mksm-sankalp.vercel.app/api/history?limit=50&offset=0
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (optional): Number of entries to return (1-200, default: 50)
- `offset` (optional): Number of entries to skip (default: 0)

**Response (200):**
```json
{
  "entries": [
    {
      "id": "uuid",
      "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-uuid",
      "regNo": "MKSM123",
      "date": "2024-01-15",
      "minutes": 120,
      "practiceText": "Practiced scales and arpeggios",
      "sankalpWord": "Dedication",
      "synced": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

**Pagination Example:**
```javascript
// Page 1
fetch('https://mksm-sankalp.vercel.app/api/history?limit=10&offset=0')

// Page 2
fetch('https://mksm-sankalp.vercel.app/api/history?limit=10&offset=10')

// Page 3
fetch('https://mksm-sankalp.vercel.app/api/history?limit=10&offset=20')
```

---

#### 6. Update Practice Entry
```http
PUT https://mksm-sankalp.vercel.app/api/practice/{entryId}
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body (partial update):**
```json
{
  "minutes": 150,
  "practiceText": "Updated practice notes",
  "sankalpWord": "Focus"
}
```

**Response (200):**
```json
{
  "entry": {
    "id": "uuid",
    "minutes": 150,
    "practiceText": "Updated practice notes",
    "sankalpWord": "Focus",
    "synced": false,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Notes:**
- Only the entry owner can update it
- Entry is marked as `synced: false` after update (will be resynced to Airtable)
- All fields are optional - only send fields you want to update

---

#### 7. Delete Practice Entry
```http
DELETE https://mksm-sankalp.vercel.app/api/practice/{entryId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Entry deleted successfully",
  "entryId": "uuid"
}
```

**Notes:**
- Only the entry owner can delete it
- This is a hard delete - entry is removed from database
- Cannot be undone

---

### 👑 Admin Endpoints

All admin endpoints require authentication with an email listed in `ADMIN_EMAILS`.

#### 8. View Failed Syncs
```http
GET https://mksm-sankalp.vercel.app/api/admin/failed-syncs
Authorization: Bearer {admin-token}
```

**Response (200):**
```json
{
  "entries": [
    {
      "id": "uuid",
      "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
      "regNo": "MKSM123",
      "date": "2024-01-15",
      "minutes": 120,
      "synced": false,
      "syncAttempts": 3,
      "lastSyncError": "Airtable sync failed: 429 - Rate limit exceeded",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "user": {
        "firstName": "Sameer",
        "lastName": "Patil",
        "email": "sameer@example.com"
      }
    }
  ],
  "summary": {
    "total": 5,
    "neverAttempted": 2,
    "failedRetries": 3
  }
}
```

---

#### 9. Manual Resync to Airtable
```http
POST https://mksm-sankalp.vercel.app/api/admin/resync
Content-Type: application/json
Authorization: Bearer {admin-token}
```

**Request Body:**
```json
{
  "entryIds": [
    "uuid1",
    "uuid2",
    "uuid3"
  ]
}
```

**Response (200):**
```json
{
  "message": "Resync completed",
  "results": {
    "synced": 2,
    "failed": 1,
    "errors": [
      {
        "entryId": "uuid3",
        "error": "Airtable sync failed: Invalid field value"
      }
    ]
  }
}
```

**Notes:**
- Processes entries with concurrency control (default: 5 concurrent)
- Updates entries in Airtable (creates new or patches existing)
- Automatically handles retry logic with exponential backoff

---

#### 10. View System Metrics
```http
GET https://mksm-sankalp.vercel.app/api/admin/metrics
Authorization: Bearer {admin-token}
```

**Response (200):**
```json
{
  "entries": {
    "total": 1523,
    "synced": 1498,
    "queued": 15,
    "failed": 10,
    "recentActivity": 87
  },
  "users": {
    "total": 45
  },
  "syncRate": 98.36,
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

**Metrics Explained:**
- `total`: All practice entries in database
- `synced`: Successfully synced to Airtable
- `queued`: Never attempted to sync (sync_attempts = 0)
- `failed`: Failed after one or more attempts
- `recentActivity`: Entries created in last 7 days
- `syncRate`: Percentage of entries successfully synced

---

## Implementation Examples

### React Native / Mobile App

```javascript
// api.js
const BASE_URL = 'https://mksm-sankalp.vercel.app';

export const api = {
  // Register new user
  async register(userData) {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  },

  // Login existing user
  async login(credentials) {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  },

  // Create practice entry
  async createEntry(token, entryData) {
    const response = await fetch(`${BASE_URL}/api/practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...entryData,
        entryClientId: entryData.entryClientId || crypto.randomUUID()
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  },

  // Get history
  async getHistory(token, limit = 50, offset = 0) {
    const response = await fetch(
      `${BASE_URL}/api/history?limit=${limit}&offset=${offset}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  },

  // Update entry
  async updateEntry(token, entryId, updates) {
    const response = await fetch(`${BASE_URL}/api/practice/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  },

  // Delete entry
  async deleteEntry(token, entryId) {
    const response = await fetch(`${BASE_URL}/api/practice/${entryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return response.json();
  }
};
```

### Usage in Components

```javascript
import { api } from './api';

// Registration Flow (New User)
async function handleRegister() {
  try {
    const { token, user } = await api.register({
      regNo: 'MKSM123',
      firstName: 'Sameer',
      lastName: 'Patil',
      email: 'sameer@example.com',
      batch: 'Batch A'
    });
    
    // Store token securely
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    // Navigate to main app
    navigation.navigate('Home');
  } catch (error) {
    Alert.alert('Registration Failed', error.message);
  }
}

// Login Flow (Returning User)
async function handleLogin() {
  try {
    const { token, user } = await api.login({
      regNo: 'MKSM123',
      email: 'sameer@example.com'
    });
    
    // Store token securely
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    // Navigate to main app
    navigation.navigate('Home');
  } catch (error) {
    Alert.alert('Login Failed', error.message);
  }
}

// Logout Flow
async function handleLogout() {
  try {
    // Clear stored credentials
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    
    // Navigate to login screen
    navigation.navigate('Login');
  } catch (error) {
    Alert.alert('Logout Failed', error.message);
  }
}

// Create Practice Entry
async function handleCreateEntry(minutes, practiceText, sankalpWord) {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    const { entry } = await api.createEntry(token, {
      entryClientId: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      minutes,
      practiceText,
      sankalpWord
    });
    
    Alert.alert('Success', 'Practice entry saved!');
    // Refresh history
    loadHistory();
  } catch (error) {
    Alert.alert('Error', error.message);
  }
}

// Load History with Pagination
async function loadHistory(page = 0) {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const limit = 20;
    const offset = page * limit;
    
    const { entries, pagination } = await api.getHistory(token, limit, offset);
    
    setEntries(entries);
    setHasMore(pagination.hasMore);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
}
```

### Offline Support

```javascript
// Queue entries when offline
const offlineQueue = [];

async function createEntryWithOfflineSupport(entryData) {
  const entry = {
    ...entryData,
    entryClientId: crypto.randomUUID(), // Generate UUID offline
    timestamp: Date.now()
  };
  
  if (!navigator.onLine) {
    // Store in queue
    offlineQueue.push(entry);
    await AsyncStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
    
    // Show to user immediately (optimistic update)
    return { entry, offline: true };
  }
  
  try {
    const token = await AsyncStorage.getItem('authToken');
    const result = await api.createEntry(token, entry);
    return result;
  } catch (error) {
    // If network error, queue it
    if (error.message.includes('network')) {
      offlineQueue.push(entry);
      await AsyncStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
      return { entry, offline: true };
    }
    throw error;
  }
}

// Sync queue when back online
async function syncOfflineQueue() {
  const token = await AsyncStorage.getItem('authToken');
  const queue = JSON.parse(await AsyncStorage.getItem('offlineQueue') || '[]');
  
  for (const entry of queue) {
    try {
      await api.createEntry(token, entry);
      // Remove from queue
      offlineQueue.splice(offlineQueue.indexOf(entry), 1);
    } catch (error) {
      console.error('Failed to sync entry:', error);
      // Keep in queue for next sync attempt
    }
  }
  
  await AsyncStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
}

// Listen for online event
window.addEventListener('online', syncOfflineQueue);
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message here",
  "type": "error_type"
}
```

### Error Types & Status Codes

| Status | Type | Description |
|--------|------|-------------|
| 400 | `validation_error` | Invalid input data |
| 401 | `auth_error` | Missing or invalid token |
| 403 | `forbidden_error` | Insufficient permissions |
| 404 | `not_found_error` | Resource not found |
| 429 | `rate_limit_error` | Rate limit exceeded |
| 500 | `internal_error` | Server error |

### Example Error Handling

```javascript
async function makeApiCall() {
  try {
    const response = await fetch('https://mksm-sankalp.vercel.app/api/practice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      switch (error.type) {
        case 'validation_error':
          Alert.alert('Invalid Data', error.error);
          break;
        case 'auth_error':
          // Token invalid - navigate to login
          await AsyncStorage.removeItem('authToken');
          navigation.navigate('Login');
          Alert.alert('Authentication Required', 'Please log in again');
          break;
        case 'rate_limit_error':
          Alert.alert('Slow Down', 'Too many requests. Please try again in a minute.');
          break;
        case 'forbidden_error':
          Alert.alert('Access Denied', error.error);
          break;
        default:
          Alert.alert('Error', error.error);
      }
      
      return null;
    }
    
    return await response.json();
  } catch (error) {
    // Network error
    Alert.alert('Network Error', 'Please check your internet connection');
    return null;
  }
}
```

---

## Rate Limiting

- **Limit:** 200 requests per hour per user
- **Tracking:** By registration number (regNo)
- **Response:** 429 status with error message when exceeded

**Best Practices:**
- Cache API responses locally
- Implement exponential backoff for retries
- Queue non-critical requests
- Show appropriate user feedback

---

## Authentication

### Token Management

**Token Expiry:** Never expires

**Storage:**
```javascript
// Store securely
await SecureStore.setItemAsync('authToken', token);

// Retrieve
const token = await SecureStore.getItemAsync('authToken');

// Validate token format
function isValidTokenFormat(token) {
  if (!token) return false;
  // JWT has 3 parts separated by dots
  return token.split('.').length === 3;
}

// Use token if valid, otherwise prompt login
if (!token || !isValidTokenFormat(token)) {
  // Navigate to login screen
  navigation.navigate('Login');
}
```

---

## Best Practices

### 1. Idempotency
Always generate `entryClientId` on the client:
```javascript
const entryId = crypto.randomUUID(); // or uuid.v4()
// Store this ID with your local entry
// Safe to retry with same ID
```

### 2. Offline Queue
Queue entries locally and sync when online:
```javascript
if (navigator.onLine) {
  await api.createEntry(token, entry);
} else {
  await queueForLater(entry);
}
```

### 3. Error Recovery
Implement retry logic with exponential backoff:
```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### 4. Optimistic Updates
Update UI immediately, rollback on error:
```javascript
// Add to UI immediately
setEntries([...entries, newEntry]);

try {
  await api.createEntry(token, newEntry);
} catch (error) {
  // Rollback on error
  setEntries(entries.filter(e => e.id !== newEntry.id));
  Alert.alert('Failed to save', 'Entry will be synced when online');
}
```

---

## Quick Reference

### All Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | Public | System status check |
| `/api/register` | POST | Public | Register new user & get token |
| `/api/login` | POST | Public | Login existing user & get token |
| `/api/practice` | POST | User | Create practice entry |
| `/api/history` | GET | User | Get practice history (paginated) |
| `/api/practice/:id` | PUT | User | Update practice entry |
| `/api/practice/:id` | DELETE | User | Delete practice entry |
| `/api/admin/failed-syncs` | GET | Admin | View entries that failed to sync |
| `/api/admin/resync` | POST | Admin | Manually trigger Airtable sync |
| `/api/admin/metrics` | GET | Admin | View system metrics & stats |

**Base URL:** `https://mksm-sankalp.vercel.app`

---

## Testing Endpoints

Use the provided test script or Postman collection:

```bash
# Health check
curl https://mksm-sankalp.vercel.app/api/health

# Register new user (save the token!)
curl -X POST https://mksm-sankalp.vercel.app/api/register \
  -H "Content-Type: application/json" \
  -d '{"regNo":"TEST001","firstName":"Test","lastName":"User","email":"test@example.com"}'

# Login existing user (save the token!)
curl -X POST https://mksm-sankalp.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"regNo":"TEST001","email":"test@example.com"}'

# Create entry (use token from above)
curl -X POST https://mksm-sankalp.vercel.app/api/practice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"entryClientId":"550e8400-e29b-41d4-a716-446655440000","date":"2024-01-15","minutes":60}'
```

---

## Support & Resources

- **API Documentation:** See README.md
- **Testing Guide:** See API_TESTING_GUIDE.md
- **Setup Guides:** See SUPABASE_SETUP.md and AIRTABLE_SETUP.md
- **Base URL:** `https://mksm-sankalp.vercel.app`

---

**Version:** 1.0  
**Last Updated:** January 2024

