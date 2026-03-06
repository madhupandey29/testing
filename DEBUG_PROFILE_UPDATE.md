# Debug Profile Update Issue

## 🔍 What to Check

### Step 1: Open Browser Console
1. Open your browser
2. Press F12 to open DevTools
3. Go to "Console" tab
4. Clear the console (click the 🚫 icon)

### Step 2: Try to Update Profile
1. Go to `/profile`
2. Click edit on any field (e.g., First Name)
3. Change the value
4. Click "Save changes"
5. Watch the console for logs

### Step 3: Check Console Logs

You should see these logs in order:

```
✅ Profile updated via API: { ... }
📦 API Response: { ... }
📦 Extracted User Data: { ... }
📦 Mapped User: { ... }
✅ Final Updated User: { ... }
✅ Cookies updated successfully
```

## 🚨 If You See "Guest User"

### Check 1: API Response Structure
Look for this log:
```
📦 API Response: { ... }
```

**Expected format:**
```javascript
{
  "data": {
    "id": "6992cda50b33af730",
    "firstName": "YourName",
    "lastName": "YourLastName",
    "emailAddress": "your@email.com",
    ...
  }
}
```

**OR:**
```javascript
{
  "id": "6992cda50b33af730",
  "firstName": "YourName",
  "lastName": "YourLastName",
  "emailAddress": "your@email.com",
  ...
}
```

❌ **If you see something different, that's the problem!**

### Check 2: Mapped User
Look for this log:
```
📦 Mapped User: { ... }
```

**Expected:**
```javascript
{
  "_id": "6992cda50b33af730",
  "id": "6992cda50b33af730",
  "firstName": "YourName",
  "lastName": "YourLastName",
  "email": "your@email.com",
  ...
}
```

❌ **If you see `null` or `{}`, the mapping failed!**

### Check 3: Cookies
After update, check cookies:
1. DevTools → Application tab
2. Cookies → http://localhost:3000
3. Look for:
   - `userInfo` - Should contain your user data
   - `sessionId` - Should exist

❌ **If cookies are missing or empty, that's the problem!**

### Check 4: localStorage
After update, check localStorage:
1. DevTools → Application tab
2. Local Storage → http://localhost:3000
3. Look for:
   - `sessionId` - Should exist
   - `userId` - Should exist

❌ **If these are missing, that's the problem!**

## 🔧 Common Issues & Solutions

### Issue 1: API Returns Wrong Format
**Symptom:** Console shows `📦 Extracted User Data: null` or `{}`

**Solution:** Your backend is not returning the user data after update.

**Fix:** Update your backend to return the updated user:
```javascript
// Backend should return:
{
  "data": {
    "id": "...",
    "firstName": "...",
    "lastName": "...",
    ...
  }
}
```

### Issue 2: Mapping Returns Null
**Symptom:** Console shows `📦 Mapped User: null`

**Solution:** The API response doesn't have the expected fields.

**Check:** Does your API response have these fields?
- `id` or `data.id`
- `firstName` or `data.firstName`
- `emailAddress` or `data.emailAddress`

### Issue 3: Cookies Not Saved
**Symptom:** Console shows `❌ Failed to update cookies`

**Solution:** Browser is blocking cookies.

**Fix:**
1. Check if cookies are enabled in browser
2. Check if you're using HTTPS (or localhost)
3. Check browser console for cookie errors

### Issue 4: Auth Guard Redirects
**Symptom:** After update, immediately redirects to login

**Solution:** Auth guard is running again and not finding session.

**Check console for:**
```
🔒 Auth Guard Check: { sessionId: null, userId: null }
```

**If you see this AFTER update, the cookies/localStorage were cleared!**

## 📋 Full Debug Checklist

Run through this checklist:

### Before Update:
- [ ] Console is open and clear
- [ ] You're logged in
- [ ] Profile shows your data (not "Guest User")
- [ ] Cookies exist: `userInfo`, `sessionId`
- [ ] localStorage has: `sessionId`, `userId`

### During Update:
- [ ] Click edit on a field
- [ ] Change the value
- [ ] Click "Save changes"
- [ ] Watch console for logs

### After Update:
- [ ] Check console logs (see Step 3 above)
- [ ] Check if "Guest User" appears
- [ ] Check cookies still exist
- [ ] Check localStorage still has values
- [ ] Try refreshing page - still logged in?

## 🐛 Send Me This Info

If it's still not working, send me:

1. **Console logs** (copy all logs from console)
2. **API Response** (the `📦 API Response:` log)
3. **Cookies** (screenshot of Application → Cookies)
4. **localStorage** (screenshot of Application → Local Storage)
5. **Network tab** (screenshot of the PUT request to `/customeraccount/:id`)

## 🎯 Expected Behavior

After clicking "Save changes":
1. ✅ Console shows success logs
2. ✅ Success message: "Profile updated successfully"
3. ✅ Profile still shows your data (not "Guest User")
4. ✅ NO redirect to login
5. ✅ Cookies still exist
6. ✅ localStorage still has values
7. ✅ Refresh page - still logged in

## 🔴 Current Behavior (Your Issue)

After clicking "Save changes":
1. ❌ Profile shows "Guest User"
2. ❌ All data disappears
3. ❌ Clicking profile icon → redirects to login
4. ❌ Clicking X on login modal → redirects to login again
5. ❌ Stuck in redirect loop

This means:
- Either cookies were cleared
- Or localStorage was cleared
- Or API response is wrong
- Or mapping failed

**Check the console logs to find out which one!**

---

**Next Steps:**
1. Follow the debug steps above
2. Check console logs
3. Send me the logs if still not working
4. I'll help you fix it!
