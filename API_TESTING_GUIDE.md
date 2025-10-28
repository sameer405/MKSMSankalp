# API Testing Guide

Quick reference for testing all endpoints with curl commands.

## Setup

1. Start the server:
```bash
npm run dev
```

2. Set your base URL:
```bash
export API_URL="http://localhost:3000"
```

---

## 1. Health Check

```bash
curl $API_URL/api/health
```

**Expected Response:**
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

## 2. Register User

```bash
curl -X POST $API_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "regNo": "MKSM001",
    "firstName": "Sameer",
    "lastName": "Patil",
    "email": "sameer@example.com",
    "batch": "Batch A"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "regNo": "MKSM001",
    "firstName": "Sameer",
    "lastName": "Patil",
    "email": "sameer@example.com",
    "batch": "Batch A"
  }
}
```

**Save the token:**
```bash
export USER_TOKEN="paste-token-here"
```

---

## 3. Create Practice Entry

```bash
curl -X POST $API_URL/api/practice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2024-01-15",
    "minutes": 120,
    "practiceText": "Practiced scales and arpeggios for two hours",
    "sankalpWord": "Dedication"
  }'
```

**Expected Response:**
```json
{
  "entry": {
    "id": "entry-uuid",
    "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "regNo": "MKSM001",
    "date": "2024-01-15",
    "minutes": 120,
    "practiceText": "Practiced scales and arpeggios for two hours",
    "sankalpWord": "Dedication",
    "synced": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Save the entry ID:**
```bash
export ENTRY_ID="paste-entry-uuid-here"
```

---

## 4. Test Idempotency (Create Same Entry Again)

```bash
curl -X POST $API_URL/api/practice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "entryClientId": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2024-01-15",
    "minutes": 120,
    "practiceText": "Practiced scales and arpeggios for two hours",
    "sankalpWord": "Dedication"
  }'
```

**Expected:** Same response as before (200 OK, not 201 Created)

---

## 5. Get Practice History

```bash
curl "$API_URL/api/history?limit=10&offset=0" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response:**
```json
{
  "entries": [
    {
      "id": "entry-uuid",
      "date": "2024-01-15",
      "minutes": 120,
      "practiceText": "...",
      "sankalpWord": "Dedication",
      "synced": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## 6. Update Practice Entry

```bash
curl -X PUT $API_URL/api/practice/$ENTRY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "minutes": 150,
    "practiceText": "Updated: Practiced scales, arpeggios, and sight-reading"
  }'
```

**Expected Response:**
```json
{
  "entry": {
    "id": "entry-uuid",
    "minutes": 150,
    "practiceText": "Updated: Practiced scales, arpeggios, and sight-reading",
    "synced": false,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## 7. Register Admin User

```bash
curl -X POST $API_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "regNo": "ADMIN001",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "batch": "Admin"
  }'
```

**Note:** Make sure `admin@example.com` is in your `ADMIN_EMAILS` env var.

**Save admin token:**
```bash
export ADMIN_TOKEN="paste-admin-token-here"
```

---

## 8. View Failed Syncs (Admin)

```bash
curl $API_URL/api/admin/failed-syncs \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "entries": [
    {
      "id": "entry-uuid",
      "regNo": "MKSM001",
      "date": "2024-01-15",
      "minutes": 150,
      "synced": false,
      "syncAttempts": 0,
      "lastSyncError": null,
      "user": {
        "firstName": "Sameer",
        "lastName": "Patil",
        "email": "sameer@example.com"
      }
    }
  ],
  "summary": {
    "total": 1,
    "neverAttempted": 1,
    "failedRetries": 0
  }
}
```

---

## 9. Manual Resync to Airtable (Admin)

```bash
curl -X POST $API_URL/api/admin/resync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "entryIds": ["'$ENTRY_ID'"]
  }'
```

**Expected Response:**
```json
{
  "message": "Resync completed",
  "results": {
    "synced": 1,
    "failed": 0,
    "errors": []
  }
}
```

**Verify in Airtable:** The entry should now appear in your PracticeEntries table.

---

## 10. View Metrics (Admin)

```bash
curl $API_URL/api/admin/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "entries": {
    "total": 1,
    "synced": 1,
    "queued": 0,
    "failed": 0,
    "recentActivity": 1
  },
  "users": {
    "total": 2
  },
  "syncRate": 100,
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

## 11. Delete Practice Entry

```bash
curl -X DELETE $API_URL/api/practice/$ENTRY_ID \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Entry deleted successfully",
  "entryId": "entry-uuid"
}
```

---

## Error Testing

### 1. Test Rate Limiting

Create 201 entries rapidly (exceeds 200/hour limit):

```bash
for i in {1..201}; do
  curl -X POST $API_URL/api/practice \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d "{
      \"entryClientId\": \"$(uuidgen)\",
      \"date\": \"2024-01-15\",
      \"minutes\": 60
    }"
done
```

**Expected:** Last request returns 429 with rate limit error.

### 2. Test Invalid Token

```bash
curl $API_URL/api/practice \
  -H "Authorization: Bearer invalid-token"
```

**Expected:**
```json
{
  "error": "Invalid token",
  "type": "auth_error"
}
```

### 3. Test Missing Authorization

```bash
curl $API_URL/api/practice
```

**Expected:**
```json
{
  "error": "Missing authorization header",
  "type": "auth_error"
}
```

### 4. Test Invalid Date

```bash
curl -X POST $API_URL/api/practice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "entryClientId": "'$(uuidgen)'",
    "date": "2099-12-31",
    "minutes": 60
  }'
```

**Expected:**
```json
{
  "error": "Date cannot be in the future",
  "type": "validation_error"
}
```

### 5. Test Invalid Minutes

```bash
curl -X POST $API_URL/api/practice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "entryClientId": "'$(uuidgen)'",
    "date": "2024-01-15",
    "minutes": 2000
  }'
```

**Expected:**
```json
{
  "error": "Minutes must be between 1 and 1440",
  "type": "validation_error"
}
```

### 6. Test Admin Access Required

```bash
curl $API_URL/api/admin/metrics \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected:**
```json
{
  "error": "Admin access required",
  "type": "auth_error"
}
```

---

## Complete Test Flow

Run all tests in sequence:

```bash
#!/bin/bash
API_URL="http://localhost:3000"

echo "1. Health Check"
curl -s $API_URL/api/health | jq

echo -e "\n2. Register User"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{"regNo":"TEST001","firstName":"Test","lastName":"User","email":"test@example.com"}')
echo $REGISTER_RESPONSE | jq
USER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')

echo -e "\n3. Create Practice Entry"
ENTRY_RESPONSE=$(curl -s -X POST $API_URL/api/practice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"entryClientId":"550e8400-e29b-41d4-a716-446655440000","date":"2024-01-15","minutes":60}')
echo $ENTRY_RESPONSE | jq
ENTRY_ID=$(echo $ENTRY_RESPONSE | jq -r '.entry.id')

echo -e "\n4. Get History"
curl -s "$API_URL/api/history?limit=5" \
  -H "Authorization: Bearer $USER_TOKEN" | jq

echo -e "\n5. Update Entry"
curl -s -X PUT $API_URL/api/practice/$ENTRY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"minutes":90}' | jq

echo -e "\n6. Register Admin"
ADMIN_RESPONSE=$(curl -s -X POST $API_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{"regNo":"ADMIN001","firstName":"Admin","lastName":"User","email":"admin@example.com"}')
echo $ADMIN_RESPONSE | jq
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token')

echo -e "\n7. View Failed Syncs"
curl -s $API_URL/api/admin/failed-syncs \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

echo -e "\n8. Resync"
curl -s -X POST $API_URL/api/admin/resync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"entryIds\":[\"$ENTRY_ID\"]}" | jq

echo -e "\n9. Metrics"
curl -s $API_URL/api/admin/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

echo -e "\n✅ All tests completed!"
```

Save this as `test-api.sh`, make it executable, and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Tips

1. **Pretty print JSON:** Add `| jq` to any curl command
2. **Save tokens:** Export them as environment variables
3. **Generate UUIDs:** Use `uuidgen` command (macOS/Linux) or online generator
4. **Check logs:** View structured logs in your terminal where `npm run dev` is running
5. **Postman:** Import these curl commands into Postman for easier testing
6. **Rate limits:** If testing rate limiting, wait 1 hour or restart server

---

## Troubleshooting

**"Missing authorization header"**
- Did you include `-H "Authorization: Bearer $TOKEN"`?
- Is the token exported? Check with `echo $USER_TOKEN`

**"Invalid token"**
- Token might be expired (30 days)
- Register again to get a new token
- Check for extra spaces or quotes

**"Entry not found"**
- Verify the entry ID is correct
- Check if entry was deleted
- Ensure you're using the right user's token

**"Admin access required"**
- Ensure the email is in `ADMIN_EMAILS` env var
- Restart server after changing env vars
- Use the admin user's token, not a regular user's

**Rate limit errors**
- Wait 1 hour or restart server
- Rate limit is per regNo (200/hour default)

---

## Quick Reference

| Action | Endpoint | Auth | Method |
|--------|----------|------|--------|
| Register | `/api/register` | None | POST |
| Create entry | `/api/practice` | User | POST |
| Get history | `/api/history` | User | GET |
| Update entry | `/api/practice/:id` | User | PUT |
| Delete entry | `/api/practice/:id` | User | DELETE |
| Failed syncs | `/api/admin/failed-syncs` | Admin | GET |
| Manual sync | `/api/admin/resync` | Admin | POST |
| Metrics | `/api/admin/metrics` | Admin | GET |
| Health | `/api/health` | None | GET |

---

Happy testing! 🧪

