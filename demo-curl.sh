#!/bin/bash
# ============================================================
# Monash Club Task Manager — Backend API Demo Script
# Run: chmod +x demo-curl.sh && ./demo-curl.sh
# Requires: curl, jq (brew install jq)
# Server must be running on localhost:3000
# ============================================================

BASE="http://localhost:3000/api/v1"
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

header() { echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n"; }
label()  { echo -e "${GREEN}→ $1${NC}"; }

# ---- 1. LOGIN (use seeded admin) ----
header "1. Login as seeded Admin (admin@monash.edu)"
ADMIN_RES=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@monash.edu","password":"admin123"}')
echo "$ADMIN_RES" | jq .
ADMIN_TOKEN=$(echo "$ADMIN_RES" | jq -r '.data.token')

header "2. Login as seeded Member (member1@monash.edu)"
MEMBER_RES=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"member1@monash.edu","password":"member123"}')
echo "$MEMBER_RES" | jq .
MEMBER_TOKEN=$(echo "$MEMBER_RES" | jq -r '.data.token')
MEMBER_ID=$(echo "$MEMBER_RES" | jq -r '.data.user.id')

# ---- 2. REGISTER A NEW USER ----
header "3. Register a brand new user"
curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"new.user@monash.edu","name":"New User","password":"password123","role":"MEMBER"}' | jq .

# ---- 3. GET ALL TASKS (seeded) ----
header "4. Get all tasks (seeded data)"
curl -s -X GET "$BASE/tasks" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# ---- 4. FILTER, SEARCH & PAGINATION ----
header "5. Filter tasks — status=TODO"
curl -s -X GET "$BASE/tasks?status=TODO" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

header "6. Filter tasks — priority=HIGH"
curl -s -X GET "$BASE/tasks?priority=HIGH" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

header "6a. Filter tasks — tag=urgent"
curl -s -X GET "$BASE/tasks?tag=urgent" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

header "6b. Filter tasks — multiple tags (events AND urgent)"
curl -s -X GET "$BASE/tasks?tag=events&tag=urgent" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

header "6c. Search tasks — keyword 'venue'"
curl -s -X GET "$BASE/tasks?search=venue" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

header "6d. Paginate tasks — page 1, limit 2"
curl -s -X GET "$BASE/tasks?page=1&limit=2" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

header "6e. Member view — RBAC scoped (only assigned/created tasks)"
curl -s -X GET "$BASE/tasks" \
  -H "Authorization: Bearer $MEMBER_TOKEN" | jq .

# ---- 5. CREATE A TASK ----
header "7. Create a new task (Admin only)"
CREATE_RES=$(curl -s -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Demo task from curl\",\"description\":\"Created during demo\",\"priority\":\"HIGH\",\"dueDate\":\"2026-04-15T00:00:00.000Z\"}")
echo "$CREATE_RES" | jq .
TASK_ID=$(echo "$CREATE_RES" | jq -r '.data.id')
label "Created task ID: $TASK_ID"

# ---- 6. GET TASK BY ID ----
header "8. Get task by ID"
curl -s -X GET "$BASE/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# ---- 7. ASSIGN TASK ----
header "9. Assign task to member"
curl -s -X PATCH "$BASE/tasks/$TASK_ID/assign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"assigneeId\":\"$MEMBER_ID\"}" | jq .

# ---- 8. CHANGE STATUS ----
header "10. Change status: TODO → IN_PROGRESS"
curl -s -X PATCH "$BASE/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"IN_PROGRESS"}' | jq .

header "11. Change status: IN_PROGRESS → DONE"
curl -s -X PATCH "$BASE/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"DONE"}' | jq .

# ---- 9. UPDATE TASK ----
header "12. Update task details"
curl -s -X PUT "$BASE/tasks/$TASK_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Updated demo task","description":"Modified during demo","priority":"LOW"}' | jq .

# ---- 10. RBAC CHECKS ----
header "13. RBAC: Member tries to create task (expect 403)"
curl -s -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -d '{"title":"Unauthorized"}' | jq .

header "14. RBAC: No token (expect 401)"
curl -s -X GET "$BASE/tasks" | jq .

header "15. RBAC: Member CAN view tasks (expect 200)"
curl -s -X GET "$BASE/tasks" \
  -H "Authorization: Bearer $MEMBER_TOKEN" | jq .

# ---- 11. USERS LISTING (RBAC-scoped) ----
header "15a. List users as Admin (expect every seeded user)"
curl -s -X GET "$BASE/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

header "15b. List users as Member (expect only own record)"
curl -s -X GET "$BASE/users" \
  -H "Authorization: Bearer $MEMBER_TOKEN" | jq .

header "15c. List users with no token (expect 401)"
curl -s -X GET "$BASE/users" | jq .

# ---- 12. AUDIT LOG ----
header "16. Audit log (Admin only)"
curl -s -X GET "$BASE/audit" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# ---- 11a. R3 REMINDERS — create a soon-due task and surface audit entry ----
# The ReminderScheduler runs every 5 min with a 24h lookahead. Any task whose
# dueDate falls in (now, now+24h] and is not DONE will appear in the audit log
# as a "TaskReminderDue" entry on the next tick.
header "16a. R3: Create a task due in 1 hour to trigger a reminder"
SOON_ISO=$(date -u -v+1H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "+1 hour" +%Y-%m-%dT%H:%M:%SZ)
curl -s -X POST "$BASE/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Reminder demo task\",\"description\":\"Due within 1 hour — scheduler should fire on next tick\",\"priority\":\"HIGH\",\"dueDate\":\"$SOON_ISO\"}" | jq .

label "Wait up to 5 min, then re-fetch the audit log to see TaskReminderDue entries:"
echo "  curl -s $BASE/audit -H 'Authorization: Bearer \$ADMIN_TOKEN' | jq '.data[] | select(.eventType==\"TaskReminderDue\")'"

# ---- 12. DELETE TASK ----
header "17. Delete task"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" -X DELETE "$BASE/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

header "18. Verify deletion — get task (expect 404)"
curl -s -X GET "$BASE/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo -e "\n${BOLD}${GREEN}✓ Demo complete!${NC}\n"
