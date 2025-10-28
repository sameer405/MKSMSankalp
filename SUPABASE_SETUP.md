# Supabase Setup Guide

This guide walks you through setting up Supabase for the Sankalp Riyaz backend.

## Prerequisites

- Supabase account (free tier is sufficient)

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the details:
   - **Name**: `sankalp-riyaz` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Free tier is sufficient for development
4. Click "Create new project"
5. Wait for the project to be provisioned (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click "Settings" (gear icon) in the left sidebar
2. Click "API" under Project Settings
3. You'll see the following credentials:

   - **Project URL**: This is your `SUPABASE_URL`
     ```
     Example: https://abcdefghijklmnop.supabase.co
     ```

   - **anon public key**: This is your `SUPABASE_ANON_KEY`
     ```
     Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

   - **service_role secret key**: This is your `SUPABASE_SERVICE_ROLE_KEY`
     ```
     Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
     ⚠️ **WARNING**: Keep this secret! Never expose it to clients or commit to git.

4. Copy these values to your `.env.local` file

## Step 3: Run Database Migrations

You have two options to run the migrations:

### Option A: Using Supabase SQL Editor (Recommended for beginners)

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy the contents of `supabase/migrations/20240101_create_users_and_entries.sql`
4. Paste into the SQL editor
5. Click "Run" or press `Ctrl+Enter` / `Cmd+Enter`
6. You should see a success message

### Option B: Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Find your project ref in Settings → General)

4. Run migrations:
   ```bash
   supabase db push
   ```

## Step 4: Verify Tables

1. In Supabase dashboard, click "Table Editor" in the left sidebar
2. You should see two tables:
   - `users`
   - `practice_entries`
3. Click on each table to verify the schema matches the migration

### Expected Tables

#### users table
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| reg_no | text | NOT NULL, UNIQUE |
| first_name | text | NOT NULL |
| last_name | text | NOT NULL |
| email | text | NOT NULL |
| batch | text | nullable |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

#### practice_entries table
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| entry_client_id | text | NOT NULL, UNIQUE |
| user_id | uuid | FOREIGN KEY → users(id) |
| reg_no | text | NOT NULL |
| date | date | NOT NULL |
| minutes | integer | NOT NULL, CHECK (0-1440) |
| practice_text | text | nullable |
| sankalp_word | text | nullable |
| airtable_record_id | text | nullable |
| synced | boolean | DEFAULT false |
| sync_attempts | integer | DEFAULT 0 |
| last_sync_error | text | nullable |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

## Step 5: Configure Row Level Security (Optional but Recommended)

For production, you may want to add Row Level Security (RLS) policies:

1. In SQL Editor, run:

```sql
-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_entries ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS (for API operations)
-- The service role key will handle all operations
```

Since we're using the service role key for all API operations, RLS is optional. The API routes handle authorization logic.

## Step 6: Test Connection

Test your connection from your local app:

```bash
# Set environment variables
export SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"

# Run dev server
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "services": {
    "database": "connected",
    "api": "operational"
  }
}
```

## Troubleshooting

### Error: "relation 'users' does not exist"
- The migration didn't run successfully
- Re-run the migration SQL in the SQL Editor
- Check for any error messages

### Error: "Invalid API key"
- Double-check you copied the correct `service_role` key (not the `anon` key)
- Ensure there are no extra spaces or newlines in your `.env.local`
- Try regenerating the keys in Supabase Settings → API

### Error: "Permission denied"
- Make sure you're using the `service_role` key, not the `anon` key
- The service role key has admin privileges

### Connection timeout
- Check your internet connection
- Verify the SUPABASE_URL is correct
- Ensure your Supabase project is active (not paused)

## Monitoring

### View Data
- Use Table Editor in Supabase dashboard
- Run SQL queries in SQL Editor

### View Logs
- Click "Logs" in left sidebar
- Select "Database" to see query logs
- Useful for debugging issues

### Backups
- Free tier includes 7 days of backups
- Go to Settings → Database → Backups to restore

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use service_role key only server-side** - never expose to clients
3. **Rotate keys regularly** in production
4. **Enable RLS** for additional security layer
5. **Monitor usage** in Supabase dashboard
6. **Set up database backups** for production

## Next Steps

After Supabase is configured:
1. ✅ Set up Airtable (see [AIRTABLE_SETUP.md](AIRTABLE_SETUP.md))
2. ✅ Test API endpoints (see [README.md](README.md))
3. ✅ Deploy to Vercel

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Dashboard](https://app.supabase.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

