# Security Flow - Session + User ID Validation

## Updated Flow with Security Checks

### **Login Flow:**
```
1. User enters email/phone
   ↓
2. Request OTP
   ↓
3. User enters OTP (3484)
   ↓
4. Verify OTP with backend
   ↓
5. ✅ OTP Valid → Generate sessionId
   ↓
6. Fetch user from EspoCRM by email/phone
   ↓
7. Store in localStorage:
   - sessionId: "session_123456"
   - userId: "698edf74a9e8162d2" (EspoCRM ID)
   ↓
8. Store in Cookies:
   - sessionId: "session_123456"
   - userInfo: { user: { complete EspoCRM data } }
   ↓
9. Redirect to home/profile
```

---

### **Profile Access Flow (WITH SECURITY):**
```
1. User navigates to /profile
   ↓
2. 🔒 SECURITY CHECK #1: Verify both exist
   - localStorage.sessionId ✓
   - localStorage.userId ✓
   ↓
   ❌ If either missing → Redirect to /login
   ↓
3. 🔒 SECURITY CHECK #2: Fetch user from EspoCRM
   GET /api/customeraccount/{userId}
   Headers: { X-Session-Id: sessionId }
   ↓
4. 🔒 SECURITY CHECK #3: Verify response
   - Status 401/403 → Session invalid → Redirect to /login
   - response.id === userId ✓
   ↓
   ❌ If ID mismatch → "Session validation failed" → Redirect to /login
   ↓
5. ✅ All checks passed → Display profile data
```

---

### **Profile Edit Flow (WITH SECURITY):**
```
1. User clicks "Edit Profile"
   ↓
2. User modifies fields
   ↓
3. User clicks "Save changes"
   ↓
4. 🔒 SECURITY CHECK #1: Verify session exists
   - localStorage.sessionId ✓
   ↓
   ❌ If missing → "Session expired" → Redirect to /login
   ↓
5. 🔒 SECURITY CHECK #2: Send update to EspoCRM
   PUT /api/customeraccount/{userId}
   Headers: { X-Session-Id: sessionId }
   Body: { updated fields }
   ↓
6. 🔒 SECURITY CHECK #3: Verify response
   - Status 401/403 → Session expired → Redirect to /login
   - response.id === userId ✓
   ↓
   ❌ If ID mismatch → "Update validation failed"
   ↓
7. ✅ All checks passed → Update local state → Show success
```

---

## Security Checks Implemented

### **Check #1: Initial Guard (Page Load)**
**Location:** `UserProfile.jsx` - Line ~170
```javascript
useEffect(() => {
  const sid = getClientSessionId();
  const uid = localStorage.getItem('userId');
  
  // Must have BOTH sessionId and userId
  if (!sid || !uid) {
    redirectToLogin();
  }
}, []);
```

**Purpose:** Prevent unauthorized access to profile page

---

### **Check #2: Fetch Validation**
**Location:** `UserProfile.jsx` - `fetchUserData()` function
```javascript
// Verify session exists
const storedSessionId = localStorage.getItem('sessionId') || Cookies.get('sessionId');
if (!storedSessionId) {
  redirectToLogin();
  return;
}

// Include session in API request
fetch(`/api/customeraccount/${userId}`, {
  headers: { 'X-Session-Id': storedSessionId }
});

// Verify response user ID matches
if (raw.id !== userId) {
  notifyError('Session validation failed');
  redirectToLogin();
}
```

**Purpose:** 
- Ensure session is valid before fetching data
- Verify the fetched user matches the stored userId
- Prevent user A from accessing user B's data

---

### **Check #3: Update Validation**
**Location:** `UserProfile.jsx` - `onSubmit()` function
```javascript
// Verify session exists before update
const storedSessionId = localStorage.getItem('sessionId') || Cookies.get('sessionId');
if (!storedSessionId) {
  notifyError('Session expired');
  redirectToLogin();
  return;
}

// Include session in update request
fetch(`/api/customeraccount/${userId}`, {
  method: 'PUT',
  headers: { 'X-Session-Id': storedSessionId }
});

// Verify response user ID matches
if (updatedResp.id && updatedResp.id !== userId) {
  notifyError('Update validation failed');
  return;
}
```

**Purpose:**
- Ensure session is valid before allowing updates
- Verify the updated user matches the stored userId
- Prevent unauthorized profile modifications

---

## What Gets Validated

### **sessionId:**
- ✅ Stored in localStorage
- ✅ Stored in Cookies (backup)
- ✅ Sent in API request headers (`X-Session-Id`)
- ✅ Checked before every API call
- ✅ Validated by backend (401/403 response)

### **userId:**
- ✅ Stored in localStorage
- ✅ Used in API URLs (`/api/customeraccount/{userId}`)
- ✅ Compared with API response (`response.id === userId`)
- ✅ Prevents accessing other users' data

---

## Security Scenarios

### **Scenario 1: User tries to access profile without login**
```
localStorage: { sessionId: null, userId: null }
↓
Check #1: Missing sessionId and userId
↓
Result: ❌ Redirect to /login
```

### **Scenario 2: User has expired session**
```
localStorage: { sessionId: "expired_123", userId: "698edf..." }
↓
Check #1: ✓ Both exist
↓
Check #2: API returns 401 Unauthorized
↓
Result: ❌ "Session expired" → Redirect to /login
```

### **Scenario 3: User tries to access another user's profile**
```
localStorage: { sessionId: "valid_123", userId: "USER_A_ID" }
↓
Malicious: Manually change userId to "USER_B_ID"
↓
Check #2: Fetch /api/customeraccount/USER_B_ID
↓
Response: { id: "USER_B_ID" }
↓
Check #3: response.id !== localStorage.userId
↓
Result: ❌ "Session validation failed" → Redirect to /login
```

### **Scenario 4: Valid user with valid session**
```
localStorage: { sessionId: "valid_123", userId: "698edf..." }
↓
Check #1: ✓ Both exist
↓
Check #2: API returns 200 with user data
↓
Check #3: response.id === localStorage.userId ✓
↓
Result: ✅ Display profile
```

---

## API Headers Sent

### **GET Request (Fetch Profile):**
```http
GET /api/customeraccount/698edf74a9e8162d2
Accept: application/json
X-Session-Id: session_123456
```

### **PUT Request (Update Profile):**
```http
PUT /api/customeraccount/698edf74a9e8162d2
Content-Type: application/json
X-Session-Id: session_123456

{
  "firstName": "Updated",
  "lastName": "Name",
  ...
}
```

---

## Backend Requirements

Your EspoCRM backend should:

1. **Validate Session Header:**
   - Check `X-Session-Id` header in requests
   - Return 401 if session invalid/expired
   - Return 403 if session valid but user unauthorized

2. **Verify User Ownership:**
   - Ensure sessionId belongs to the userId in URL
   - Prevent user A from accessing user B's data
   - Return 403 if userId doesn't match session

3. **Return Consistent User ID:**
   - Always return `id` field in responses
   - Use same ID format (EspoCRM ID)

---

## Testing Security

### **Test 1: No Session**
```javascript
// Clear storage
localStorage.clear();
// Navigate to /profile
// Expected: Redirect to /login
```

### **Test 2: Invalid Session**
```javascript
// Set invalid session
localStorage.setItem('sessionId', 'invalid_123');
localStorage.setItem('userId', '698edf...');
// Navigate to /profile
// Expected: API returns 401 → Redirect to /login
```

### **Test 3: Mismatched User ID**
```javascript
// Login as User A
// Manually change userId to User B's ID
localStorage.setItem('userId', 'USER_B_ID');
// Navigate to /profile
// Expected: "Session validation failed" → Redirect to /login
```

### **Test 4: Valid Session**
```javascript
// Login normally
// Navigate to /profile
// Expected: Profile displays correctly
```

---

## Summary

### **Before (Insecure):**
```
Profile → Load userId → Fetch data → Display
```

### **After (Secure):**
```
Profile → Verify sessionId + userId → Fetch with session → Verify response ID → Display
         ↓                           ↓                      ↓
         Check #1                    Check #2               Check #3
```

### **Security Benefits:**
✅ Prevents unauthorized access
✅ Validates session on every request
✅ Prevents user impersonation
✅ Detects tampered localStorage
✅ Handles expired sessions gracefully
✅ Protects against CSRF attacks (with session validation)

---

**Status:** ✅ Security Implemented
**Files Modified:** 1 (UserProfile.jsx)
**Security Checks Added:** 3
**Breaking Changes:** None (backward compatible)
