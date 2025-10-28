# Airtable Setup Guide

This guide walks you through setting up Airtable as the reporting sink for the Sankalp Riyaz backend.

## Prerequisites

- Airtable account (free tier is sufficient)

## Step 1: Create an Airtable Base

1. Go to [airtable.com](https://airtable.com) and sign in
2. Click "Create a base" or "Add a base"
3. Choose "Start from scratch"
4. Name your base: **SankalpRiyaz** (or your preferred name)
5. Click "Create base"

## Step 2: Create the PracticeEntries Table

1. By default, Airtable creates a table called "Table 1"
2. Click on the table name and rename it to: **PracticeEntries**
3. Delete the default fields by clicking the dropdown arrow next to each field name and selecting "Delete field"

## Step 3: Add Required Fields

Add the following fields by clicking the "+" button to the right of the last column:

### Field Configuration

| Field Name | Type | Configuration |
|------------|------|---------------|
| **Timestamp** | Created time | Format: Local (24 hour) |
| **RegNo** | Single line text | - |
| **FirstName** | Single line text | - |
| **LastName** | Single line text | - |
| **Email** | Email | - |
| **Batch** | Single line text | - |
| **Date** | Date | Format: Local, Date only |
| **Minutes** | Number | Format: Integer, Precision: 0 |
| **PracticeText** | Long text | Enable rich text formatting |
| **SankalpWord** | Single line text | - |
| **EntryId** | Single line text | - |
| **SyncedAt** | Date | Format: Local (24 hour), Include time |
| **Deleted** | Checkbox | Default: unchecked |

### Detailed Field Setup Instructions

#### 1. Timestamp (Created time)
- Click "+" to add field
- Choose "Created time"
- Name: `Timestamp`
- Click "Create field"

#### 2. RegNo (Single line text)
- Click "+" to add field
- Choose "Single line text"
- Name: `RegNo`
- Click "Create field"

#### 3. FirstName (Single line text)
- Click "+" to add field
- Choose "Single line text"
- Name: `FirstName`
- Click "Create field"

#### 4. LastName (Single line text)
- Click "+" to add field
- Choose "Single line text"
- Name: `LastName`
- Click "Create field"

#### 5. Email (Email)
- Click "+" to add field
- Choose "Email"
- Name: `Email`
- Click "Create field"

#### 6. Batch (Single line text)
- Click "+" to add field
- Choose "Single line text"
- Name: `Batch`
- Click "Create field"

#### 7. Date (Date)
- Click "+" to add field
- Choose "Date"
- Name: `Date`
- Format: Local
- Include time field: NO (uncheck)
- Click "Create field"

#### 8. Minutes (Number)
- Click "+" to add field
- Choose "Number"
- Name: `Minutes`
- Format: Integer
- Precision: 0
- Click "Create field"

#### 9. PracticeText (Long text)
- Click "+" to add field
- Choose "Long text"
- Name: `PracticeText`
- Enable rich text formatting: YES (check)
- Click "Create field"

#### 10. SankalpWord (Single line text)
- Click "+" to add field
- Choose "Single line text"
- Name: `SankalpWord`
- Click "Create field"

#### 11. EntryId (Single line text)
- Click "+" to add field
- Choose "Single line text"
- Name: `EntryId`
- Click "Create field"
- **Note**: This stores the Supabase UUID for reference

#### 12. SyncedAt (Date)
- Click "+" to add field
- Choose "Date"
- Name: `SyncedAt`
- Format: Local (24 hour)
- Include time field: YES (check)
- Click "Create field"

#### 13. Deleted (Checkbox)
- Click "+" to add field
- Choose "Checkbox"
- Name: `Deleted`
- Click "Create field"

## Step 4: Arrange Fields (Optional)

Drag and drop fields to arrange them in this order for better readability:
1. Timestamp
2. RegNo
3. FirstName
4. LastName
5. Email
6. Batch
7. Date
8. Minutes
9. PracticeText
10. SankalpWord
11. EntryId
12. SyncedAt
13. Deleted

## Step 5: Get Your Airtable API Key

### Option A: Personal Access Token (Recommended)

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Click "Create new token"
3. Name: `Sankalp Riyaz Backend`
4. Add scopes:
   - `data.records:read`
   - `data.records:write`
5. Add access:
   - Select your workspace
   - Select the "SankalpRiyaz" base
6. Click "Create token"
7. **IMPORTANT**: Copy the token immediately (it won't be shown again!)
8. This is your `AIRTABLE_API_KEY`

### Option B: Legacy API Key (Deprecated but still works)

1. Go to [airtable.com/account](https://airtable.com/account)
2. Scroll to "API" section
3. Click "Generate API key"
4. Copy the key
5. This is your `AIRTABLE_API_KEY`

⚠️ **Note**: Airtable is deprecating legacy API keys. Use Personal Access Tokens instead.

## Step 6: Get Your Base ID

1. Go to [airtable.com/api](https://airtable.com/api)
2. Click on your "SankalpRiyaz" base
3. In the URL, you'll see something like:
   ```
   https://airtable.com/appXXXXXXXXXXXXXX/api/docs
   ```
4. The part starting with `app` is your Base ID
   ```
   Example: appAbCdEfGhIjKlMnO
   ```
5. This is your `AIRTABLE_BASE_ID`

Alternatively:
1. In your base, click "Help" (question mark icon) in the top right
2. Click "API documentation"
3. The Base ID is shown at the top of the documentation

## Step 7: Verify Table Name

1. Make sure your table is named exactly: `PracticeEntries`
2. This is case-sensitive!
3. This should match `AIRTABLE_TABLE_NAME` in your `.env.local`

## Step 8: Configure Environment Variables

Add to your `.env.local`:

```bash
AIRTABLE_API_KEY=patAbCdEfGhIjKlMnO.1234567890abcdef  # Personal Access Token
AIRTABLE_BASE_ID=appAbCdEfGhIjKlMnO
AIRTABLE_TABLE_NAME=PracticeEntries
```

## Step 9: Test Integration

1. Start your backend:
   ```bash
   npm run dev
   ```

2. Register a user:
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

3. Create a practice entry (use token from register response):
   ```bash
   curl -X POST http://localhost:3000/api/practice \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
       "date": "2024-01-15",
       "minutes": 60,
       "practiceText": "Test practice session",
       "sankalpWord": "Focus"
     }'
   ```

4. Trigger sync as admin:
   ```bash
   # First, register with an admin email (from ADMIN_EMAILS)
   # Then use that token to trigger resync
   curl -X POST http://localhost:3000/api/admin/resync \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -d '{
       "entryIds": ["entry-uuid-from-practice-response"]
     }'
   ```

5. Check your Airtable base - you should see the entry appear!

## Step 10: Create Useful Views (Optional)

### Recent Entries View
1. Click "Grid view" dropdown
2. Click "Create new view" → "Grid"
3. Name: "Recent Entries"
4. Click "Filter"
5. Add filter: "Timestamp is within the last week"
6. Click "Sort"
7. Sort by "Timestamp" descending

### Failed/Unsynced View
1. Create new view: "Needs Attention"
2. Filter: "EntryId is empty" (these are manually added)
3. Or use the Deleted checkbox to filter deleted entries

### By Student View
1. Create new view: "By Student"
2. Group by: "RegNo"
3. Sort by: "Date" descending

## Troubleshooting

### Error: "NOT_FOUND"
- Double-check your `AIRTABLE_BASE_ID`
- Ensure the base exists and you have access
- Verify the Personal Access Token has access to this specific base

### Error: "TABLE_NOT_FOUND"
- Check table name is exactly `PracticeEntries` (case-sensitive)
- Verify `AIRTABLE_TABLE_NAME` in `.env.local` matches

### Error: "INVALID_REQUEST_BODY" or field errors
- Ensure all field names match exactly (case-sensitive)
- Check field types match the configuration above
- Make sure required fields exist

### Error: "AUTHENTICATION_REQUIRED"
- Verify `AIRTABLE_API_KEY` is correct
- Ensure no extra spaces or newlines in `.env.local`
- Try regenerating the Personal Access Token

### Sync not working
- Check `/api/admin/failed-syncs` for error messages
- Review backend logs for Airtable API errors
- Verify rate limits haven't been exceeded (Airtable free tier: 5 requests/second)

## Airtable API Rate Limits

Free tier limits:
- **5 requests per second** per base
- **100,000 records** per base

The backend handles this by:
- Processing syncs with configurable concurrency (`SYNC_WORKER_CONCURRENCY`)
- Manual sync triggers (not continuous background polling)

## Using Airtable for Reporting

### Built-in Features
- **Filters**: View specific students, date ranges, or practice durations
- **Sorting**: Order by date, minutes, or student
- **Grouping**: Group by student, batch, or date
- **Charts**: Create bar/line charts for practice trends
- **Calendar view**: See practices on a calendar
- **Gallery view**: Visual card layout

### Sharing & Collaboration
1. Click "Share" button in top right
2. Invite admins/teachers with appropriate permissions:
   - **Editor**: Can modify data
   - **Commenter**: Can comment only
   - **Read-only**: View only

### Exporting Data
1. Click "..." menu on any view
2. Select "Export" → Choose format (CSV, Excel)
3. Download for offline analysis

## Security Best Practices

1. **Protect API keys**: Never commit to version control
2. **Use Personal Access Tokens**: More secure than legacy keys
3. **Limit token scope**: Only grant necessary permissions
4. **Restrict base access**: Only share with authorized users
5. **Regular audits**: Review who has access to the base
6. **Monitor usage**: Check activity log for suspicious behavior

## Next Steps

After Airtable is configured:
1. ✅ Test the integration end-to-end
2. ✅ Set up custom views for your needs
3. ✅ Train admins on using Airtable
4. ✅ Deploy to production (see [README.md](README.md))

## Resources

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [Personal Access Tokens Guide](https://airtable.com/developers/web/guides/personal-access-tokens)
- [Airtable Community](https://community.airtable.com/)

