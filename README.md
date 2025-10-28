# Sankalp Riyaz Backend

A micro-backend for the Sankalp Riyaz mobile-first app, where MKSM students register once and log their daily Riyaz (practice) sessions. Built with Next.js API routes, Supabase (PostgreSQL), and Airtable integration for reporting.

## Features

- **User Registration**: Students register with their details and receive a JWT token
- **Practice Logging**: Daily practice entries with minutes, notes, and Sankalp word
- **Idempotent Operations**: Client-generated UUIDs prevent duplicate entries
- **Offline Support**: Entries can be queued and synced when online
- **Airtable Integration**: All entries are mirrored to Airtable for admin visibility
- **Admin Dashboard**: View failed syncs, metrics, and manually trigger resyncs
- **Rate Limiting**: Protects API from abuse (200 requests/hour per user)
- **Structured Logging**: JSON logs for monitoring and debugging

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Mobile    │────────▶│   Next.js    │────────▶│  Supabase   │
│   Client    │◀────────│  API Routes  │◀────────│  (Postgres) │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               │ (Background Sync)
                               ▼
                        ┌─────────────┐
                        │  Airtable   │
                        │  (Reporting)│
                        └─────────────┘
```

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account and project
- **Airtable** account and base
- **Vercel** account (for deployment)

## Local Development Setup

### 1. Clone and Install

```bash
cd /path/to/MKSM
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here

# Airtable Configuration
AIRTABLE_API_KEY=your-airtable-api-key
AIRTABLE_BASE_ID=your-base-id
AIRTABLE_TABLE_NAME=PracticeEntries

# JWT Configuration
JWT_SIGNING_SECRET=your-super-secret-jwt-signing-key-change-this-in-production

# Application Configuration
APP_BASE_URL=http://localhost:3000
RATE_LIMIT_PER_HOUR=200
MAX_MINUTES_PER_ENTRY=1440

# Admin Configuration (comma-separated)
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Sync Worker Configuration
SYNC_WORKER_CONCURRENCY=5
```

See [`.env.example`](.env.example) for a template.

### 3. Setup Supabase Database

Follow the instructions in [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to:
- Create a Supabase project
- Run the SQL migrations
- Get your API keys

### 4. Setup Airtable Base

Follow the instructions in [AIRTABLE_SETUP.md](AIRTABLE_SETUP.md) to:
- Create an Airtable base
- Configure the PracticeEntries table
- Get your API key and Base ID

### 5. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

Test the health endpoint:
```bash
curl http://localhost:3000/api/health
```

## API Endpoints

### Public Endpoints

#### POST `/api/register`
Register a new user or update existing user details.

**Request:**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "regNo": "MKSM123",
    "firstName": "Sameer",
    "lastName": "Patil",
    "email": "sameer@example.com",
    "batch": "Batch A"
  }'
```

**Response:**
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

#### GET `/api/stats`
Get comprehensive practice statistics for the community.

**Request:**
```bash
curl http://localhost:3000/api/stats
```

**Response:**
```json
{
  "target": {
    "minutes": 3060000,
    "hours": 51000
  },
  "collective": {
    "totalMinutes": 1530000,
    "totalHours": 25500,
    "progressPercentage": 50.0,
    "remainingMinutes": 1530000,
    "remainingHours": 25500
  },
  "community": {
    "totalUsers": 45,
    "activeUsers": 38,
    "totalEntries": 1523
  },
  "recentActivity": {
    "last7Days": {
      "minutes": 12480,
      "hours": 208,
      "entries": 87
    }
  },
  "topPractitioners": [
    {
      "regNo": "MKSM123",
      "totalMinutes": 18000,
      "totalHours": 300,
      "entryCount": 150,
      "averageMinutesPerEntry": 120
    }
  ],
  "userStatistics": [...],
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

**Features:**
- No authentication required (public endpoint)
- Admin-configurable target hours (default: 51,000 hours)
- Individual user practice totals
- Collective community progress
- Top 10 practitioners leaderboard
- Recent activity tracking (last 7 days)

### Authenticated Endpoints

All authenticated endpoints require the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

#### POST `/api/practice`
Create a new practice entry.

**Request:**
```bash
curl -X POST http://localhost:3000/api/practice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2024-01-15",
    "minutes": 120,
    "practiceText": "Practiced scales and arpeggios",
    "sankalpWord": "Dedication"
  }'
```

**Response:**
```json
{
  "entry": {
    "id": "uuid",
    "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "uuid",
    "regNo": "MKSM123",
    "date": "2024-01-15",
    "minutes": 120,
    "practiceText": "Practiced scales and arpeggios",
    "sankalpWord": "Dedication",
    "synced": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### GET `/api/history?limit=50&offset=0`
Retrieve practice history for the authenticated user.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/history?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "date": "2024-01-15",
      "minutes": 120,
      "practiceText": "...",
      "sankalpWord": "...",
      "synced": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

#### PUT `/api/practice/:entryId`
Update an existing practice entry.

**Request:**
```bash
curl -X PUT http://localhost:3000/api/practice/ENTRY_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "minutes": 150,
    "practiceText": "Updated practice notes"
  }'
```

#### DELETE `/api/practice/:entryId`
Delete a practice entry.

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/practice/ENTRY_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Admin Endpoints

Admin endpoints require authentication with an email listed in `ADMIN_EMAILS`.

#### GET `/api/admin/failed-syncs`
Get all entries that failed to sync to Airtable.

**Request:**
```bash
curl -X GET http://localhost:3000/api/admin/failed-syncs \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### POST `/api/admin/resync`
Manually trigger resync for specific entries.

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/resync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "entryIds": ["uuid1", "uuid2", "uuid3"]
  }'
```

#### GET `/api/admin/metrics`
Get system metrics and statistics.

**Request:**
```bash
curl -X GET http://localhost:3000/api/admin/metrics \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
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
  "timestamp": "2024-01-15T12:00:00Z"
}
```

#### GET/PUT `/api/admin/settings`
View and update system settings (like target practice hours).

**Get Settings:**
```bash
curl -X GET http://localhost:3000/api/admin/settings \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Update Target Hours:**
```bash
# Set target to 51,000 hours (3,060,000 minutes)
curl -X PUT http://localhost:3000/api/admin/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "key": "target_practice_minutes",
    "value": "3060000"
  }'
```

**Response:**
```json
{
  "setting": {
    "key": "target_practice_minutes",
    "value": "3060000",
    "description": "Total target practice minutes for the community (51,000 hours)",
    "updatedBy": "admin@example.com",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  },
  "message": "Setting updated successfully"
}
```

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Deploy again for changes to take effect

### Environment Variables in Production

Make sure to set all required environment variables in your Vercel project:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `JWT_SIGNING_SECRET` (use a strong random secret)
- `ADMIN_EMAILS`
- `APP_BASE_URL` (your production URL)

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Default**: 200 requests per hour per user (configurable via `RATE_LIMIT_PER_HOUR`)
- Rate limits are tracked by `regNo`
- Returns `429 Too Many Requests` when limit exceeded

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "type": "error_type"
}
```

Error types:
- `validation_error` (400)
- `auth_error` (401)
- `forbidden_error` (403)
- `not_found_error` (404)
- `rate_limit_error` (429)
- `internal_error` (500)

## Logging

The application uses structured JSON logging:
- All logs include: timestamp, level, message, traceId, metadata
- Logs are output to stdout (captured by Vercel)
- Log levels: `info`, `warn`, `error`

## Idempotency

Practice entries use client-generated UUIDs (`entryClientId`) for idempotency:
- Same `entryClientId` returns existing entry (200 OK)
- Prevents duplicate entries from retries
- Safe for offline queuing and reconnection

## Testing

### Manual Testing with curl

See the curl examples above for each endpoint.

### Testing Airtable Sync

1. Create a practice entry
2. Check `/api/admin/failed-syncs` to see if it needs syncing
3. Trigger manual sync via `/api/admin/resync`
4. Verify the entry appears in your Airtable base

## Monitoring

- **Health Check**: `GET /api/health`
- **Metrics Dashboard**: `GET /api/admin/metrics`
- **Failed Syncs**: `GET /api/admin/failed-syncs`

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. Use strong, random `JWT_SIGNING_SECRET` in production
3. Rotate API keys regularly
4. Keep service role keys secure (never expose to clients)
5. Use HTTPS in production
6. Limit admin email addresses to trusted users

## Troubleshooting

### Database Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is active
- Test connection with health endpoint

### Airtable Sync Failures
- Verify `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` are correct
- Check Airtable base exists and table is named correctly
- Review `/api/admin/failed-syncs` for error messages
- Check Airtable API rate limits

### JWT Token Issues
- Ensure `JWT_SIGNING_SECRET` is set
- Tokens do not expire (use login endpoint to get new token if needed)
- Verify Authorization header format: `Bearer <token>`

## Project Structure

```
MKSM/
├── app/
│   └── api/
│       ├── register/route.ts
│       ├── practice/
│       │   ├── route.ts
│       │   └── [entryId]/route.ts
│       ├── history/route.ts
│       ├── health/route.ts
│       └── admin/
│           ├── failed-syncs/route.ts
│           ├── resync/route.ts
│           └── metrics/route.ts
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── validation.ts
│   ├── rate-limit.ts
│   ├── airtable.ts
│   ├── logger.ts
│   └── errors.ts
├── supabase/
│   └── migrations/
│       └── 20240101_create_users_and_entries.sql
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## License

ISC

## Support

For issues or questions, contact the development team or create an issue in the repository.

