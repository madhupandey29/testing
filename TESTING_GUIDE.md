# Testing Guide - Profile with EspoCRM

## Prerequisites

Before testing, ensure you have a user in your EspoCRM database with the email you'll use for login.

### Check Your EspoCRM Database:
```
GET https://espobackend.vercel.app/api/customeraccount
```

You should see users like:
```json
{
  "data": [
    {
      "id": "698edf74a9e8162d2",
      "emailAddress": "dev121@gmail.com",
      "phoneNumber": "+913978455079",
      "firstName": "gfgfhhhh",
      "lastName": "ddlldfslksks",
      ...
    }
  ]
}
```

---

## Test Steps

### Step 1: Clear Previous Session
```javascript
// Open browser console (F12)
localStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
// Refresh page
```

### Step 2: Login with Existing User

1. Go to `/login`
2. Enter email that EXISTS in EspoCRM: `dev121@gmail.com`
3. Click "Request OTP"
4. Enter OTP: `3484`
5. Click "Verify OTP"

**Expected Result:**
- ✅ Success message: "Logged in successfully with fallback OTP"
- ✅ Redirected to home page

### Step 3: Check localStorage

```javascript
// Open console
console.log('sessionId:', localStorage.getItem('sessionId'));
console.log('userId:', localStorage.getItem('userId'));
```

**Expected Result:**
```
sessionId: "session_1739437200000"
userId: "698edf74a9e8162d2"  ← Real EspoCRM ID!
```

### Step 4: Navigate to Profile

1. Go to `/profile`
2. Wait for data to load

**Expected Result:**
- ✅ Profile displays with data from EspoCRM
- ✅ Name: "gfgfhhhh ddlldfslksks"
- ✅ Email: "dev121@gmail.com"
- ✅ Phone: "+913978455079"
- ✅ Organisation: "uuuytyyt"

### Step 5: Edit Profile

1. Click "Edit Profile" tab
2. Update "Organisation" field to: "My New Company"
3. Click "Save changes"

**Expected Result:**
- ✅ Success message: "Profile updated"
- ✅ Changes visible in "My Profile" tab
- ✅ Refresh page → changes persist

---

## Troubleshooting

### Error: "User not found in EspoCRM"

**Cause:** The email you entered doesn't exist in your EspoCRM database

**Solution:**
1. Check your EspoCRM database for existing users
2. Use an email that exists, OR
3. Register a new user first

### Error: "Failed to fetch users from EspoCRM"

**Cause:** EspoCRM API is not accessible

**Solution:**
1. Check if `https://espobackend.vercel.app/api/customeraccount` is accessible
2. Check browser console for CORS errors
3. Verify API endpoint is correct

### Profile shows "Loading..." forever

**Cause:** userId in localStorage doesn't exist in EspoCRM

**Solution:**
1. Clear localStorage and login again
2. Check console for 404 errors
3. Verify the userId matches an actual user in EspoCRM

### Profile shows empty fields

**Cause:** Field mapping issue or API response format different

**Solution:**
1. Open browser console
2. Check Network tab for API response
3. Verify response has fields like `firstName`, `emailAddress`, etc.

---

## What Changed

### Login Flow (with Fallback OTP):
```
1. User enters email: dev121@gmail.com
2. User enters OTP: 3484
3. ✅ Detect fallback OTP
4. Fetch all users from EspoCRM
5. Find user by email: dev121@gmail.com
6. Store REAL user ID: 698edf74a9e8162d2
7. Store complete user data in cookies
8. Redirect to home
```

### Profile Flow:
```
1. Get userId from localStorage: 698edf74a9e8162d2
2. Fetch from EspoCRM: /api/customeraccount/698edf74a9e8162d2
3. Map fields: emailAddress → email, phoneNumber → phone, etc.
4. Display in profile
```

---

## API Calls Made

### Login (Fallback OTP):
```http
GET https://espobackend.vercel.app/api/customeraccount
Accept: application/json
```

### Profile View:
```http
GET https://espobackend.vercel.app/api/customeraccount/698edf74a9e8162d2
Accept: application/json
X-Session-Id: session_1739437200000
```

### Profile Update:
```http
PUT https://espobackend.vercel.app/api/customeraccount/698edf74a9e8162d2
Content-Type: application/json
X-Session-Id: session_1739437200000

{
  "firstName": "gfgfhhhh",
  "lastName": "ddlldfslksks",
  "emailAddress": "dev121@gmail.com",
  "phoneNumber": "+913978455079",
  "organizationNameRaw": "My New Company",
  ...
}
```

---

## Expected Console Output

### Successful Login:
```
Using fallback OTP, fetching from EspoCRM...
✅ Found user: dev121@gmail.com
✅ Stored userId: 698edf74a9e8162d2
✅ Logged in successfully with fallback OTP
```

### Profile Load:
```
✅ Fetching user: 698edf74a9e8162d2
✅ User data loaded from EspoCRM
✅ Mapped fields: emailAddress → email
```

### Profile Update:
```
✅ Updating user: 698edf74a9e8162d2
✅ Update successful
✅ Profile updated
```

---

## Common Issues

### Issue 1: Phone Number Format Mismatch

**Problem:** User has phone `9876543210` in EspoCRM, but login uses `+919876543210`

**Solution:** Login now checks multiple formats:
- Exact match: `9876543210`
- With +91: `+919876543210`
- Without +91: `9876543210`

### Issue 2: Multiple Users with Same Email

**Problem:** EspoCRM has duplicate emails

**Solution:** Login uses `.find()` which returns the FIRST match. Ensure unique emails in your database.

### Issue 3: CORS Errors

**Problem:** Browser blocks requests to EspoCRM

**Solution:** 
1. EspoCRM backend must allow CORS from your domain
2. Add CORS headers to EspoCRM API responses
3. Or use a proxy

---

## Next Steps

Once basic flow works:

1. **Add Real OTP:** Replace fallback OTP with actual SMS/Email OTP
2. **Add Session Validation:** Make EspoCRM validate `X-Session-Id` header
3. **Add Error Handling:** Better error messages for specific scenarios
4. **Add Loading States:** Show spinners during API calls
5. **Add Avatar Upload:** If EspoCRM supports file uploads

---

**Status:** ✅ Ready for Testing
**Fallback OTP:** 3484
**Test Email:** Use any email from your EspoCRM database
