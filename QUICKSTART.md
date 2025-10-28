# Quick Start Guide

Get the Sankalp Riyaz backend running in 5 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Supabase account (free tier)
- [ ] Airtable account (free tier)

## Step 1: Install Dependencies (30 seconds)

```bash
cd /path/to/MKSM
npm install
```

## Step 2: Setup Environment Variables (2 minutes)

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and fill in your credentials:
   - **Supabase**: Get from [Supabase Dashboard](https://app.supabase.com) → Settings → API
   - **Airtable**: Get from [Airtable API](https://airtable.com/api) and [Tokens](https://airtable.com/create/tokens)
   - **JWT Secret**: Generate with: `openssl rand -base64 32`

## Step 3: Setup Supabase Database (2 minutes)

1. Go to your Supabase project
2. Click "SQL Editor" in sidebar
3. Click "New Query"
4. Copy-paste contents from `supabase/migrations/20240101_create_users_and_entries.sql`
5. Click "Run"

✅ You should see: "Success. No rows returned"

## Step 4: Setup Airtable Base (1 minute)

1. Create new base at [Airtable](https://airtable.com)
2. Name it: **SankalpRiyaz**
3. Rename table to: **PracticeEntries**
4. Follow [AIRTABLE_SETUP.md](AIRTABLE_SETUP.md) to add all fields

Or use this quick import (if available in your Airtable):
- Timestamp (Created time)
- RegNo, FirstName, LastName (Single line text)
- Email (Email)
- Batch (Single line text)
- Date (Date)
- Minutes (Number)
- PracticeText (Long text)
- SankalpWord (Single line text)
- EntryId (Single line text)
- SyncedAt (Date with time)
- Deleted (Checkbox)

## Step 5: Start Development Server

```bash
npm run dev
```

The API will be running at `http://localhost:3000`

## Step 6: Test Your Setup

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok",...}`

### 2. Register a User
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "regNo": "TEST001",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "batch": "Test Batch"
  }'
```

Save the `token` from the response!

### 3. Create Practice Entry
```bash
curl -X POST http://localhost:3000/api/practice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2024-01-15",
    "minutes": 60,
    "practiceText": "First practice session",
    "sankalpWord": "Focus"
  }'
```

### 4. Sync to Airtable (as Admin)

First, register with an admin email (one from ADMIN_EMAILS), then:

```bash
curl -X POST http://localhost:3000/api/admin/resync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "entryIds": ["entry-id-from-previous-response"]
  }'
```

Check your Airtable base - the entry should appear!

## Troubleshooting

### "Missing environment variable" error
- Double-check all variables in `.env.local`
- Restart the dev server after changing env vars

### "Database connection failed"
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Check if Supabase project is active
- Run migrations in SQL Editor

### "Airtable sync failed"
- Verify AIRTABLE_API_KEY and AIRTABLE_BASE_ID
- Check table name is exactly "PracticeEntries"
- Ensure Personal Access Token has write permissions

### "Invalid token"
- Token might be malformed or corrupt
- Use the login endpoint to get a new token
- Check JWT_SIGNING_SECRET is set

## Next Steps

1. ✅ Read full [README.md](README.md) for all API endpoints
2. ✅ Explore [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for advanced DB setup
3. ✅ Review [AIRTABLE_SETUP.md](AIRTABLE_SETUP.md) for reporting views
4. ✅ Deploy to Vercel (see README.md)

## Common Use Cases

### View Practice History
```bash
curl http://localhost:3000/api/history?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update an Entry
```bash
curl -X PUT http://localhost:3000/api/practice/ENTRY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"minutes": 90}'
```

### Check Failed Syncs (Admin)
```bash
curl http://localhost:3000/api/admin/failed-syncs \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View Metrics (Admin)
```bash
curl http://localhost:3000/api/admin/metrics \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Support

- Issues? Check [README.md](README.md) troubleshooting section
- Questions? Review the full setup guides
- Still stuck? Contact the dev team

Happy coding! 🎵

