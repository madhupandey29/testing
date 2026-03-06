# Changes Made to Integrate EspoCRM API

## Summary
Updated the profile system to use your EspoCRM backend API (`https://espobackend.vercel.app/api/customeraccount`) instead of the test API.

---

## Files Modified

### 1. `src/components/profile/UserProfile.jsx`

#### Added Field Mapping Functions (Line ~20):
```javascript
// Maps EspoCRM fields to Profile format
const mapEspoToProfile = (espoUser) => { ... }

// Maps Profile fields to EspoCRM format
const mapProfileToEspo = (profileData) => { ... }
```

**Purpose:** Convert between EspoCRM field names and your profile field names.

#### Updated `fetchUserData` Function (Line ~330):
**Before:**
```javascript
fetch(`https://test.amrita-fashions.com/shopy/users/${userId}`)
```

**After:**
```javascript
fetch(`https://espobackend.vercel.app/api/customeraccount/${userId}`)
```

**Changes:**
- Uses EspoCRM API endpoint
- Maps response using `mapEspoToProfile()`
- Gracefully handles missing users

#### Updated `onSubmit` Function (Line ~650):
**Before:**
```javascript
fetch(`${baseUrl}/users/${userId}`, {
  method: 'PUT',
  body: formData
})
```

**After:**
```javascript
fetch(`https://espobackend.vercel.app/api/customeraccount/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(mapProfileToEspo(updateData))
})
```

**Changes:**
- Uses EspoCRM API endpoint
- Maps data using `mapProfileToEspo()`
- Sends JSON instead of FormData
- Maps response back using `mapEspoToProfile()`

---

### 2. `src/components/forms/login-form.jsx`

#### Updated `handleOtpVerify` Function (Line ~120):

**Added after OTP verification:**
```javascript
// Fetch user from EspoCRM API
const espoRes = await fetch('https://espobackend.vercel.app/api/customeraccount');
const allUsers = espoData.data || espoData || [];

// Find user by email or phone
const currentUser = allUsers.find(u => 
  u.emailAddress === savedIdentifier || 
  u.phoneNumber === savedIdentifier
);

if (currentUser) {
  // Store EspoCRM user ID
  localStorage.setItem('userId', currentUser.id);
  Cookies.set('userInfo', JSON.stringify({ user: currentUser }));
}
```

**Changes:**
- After successful OTP verification, fetches all users from EspoCRM
- Finds the logged-in user by email/phone
- Stores the real EspoCRM user ID
- Stores complete user data in cookies

---

## Field Mapping

| Profile Field | EspoCRM Field |
|--------------|---------------|
| firstName | firstName |
| lastName | lastName |
| email | emailAddress |
| phone | phoneNumber |
| organisation | organizationNameRaw |
| address | addressStreet |
| city | addressCity |
| state | addressState |
| country | addressCountry |
| pincode | addressPostalCode |

---

## API Endpoints Now Used

### Get All Users (for login):
```
GET https://espobackend.vercel.app/api/customeraccount
```

### Get Single User (for profile):
```
GET https://espobackend.vercel.app/api/customeraccount/{id}
```

### Update User (for profile edit):
```
PUT https://espobackend.vercel.app/api/customeraccount/{id}
Content-Type: application/json

Body: {
  "firstName": "...",
  "lastName": "...",
  "emailAddress": "...",
  "phoneNumber": "...",
  "organizationNameRaw": "...",
  "addressStreet": "...",
  "addressCity": "...",
  "addressState": "...",
  "addressCountry": "...",
  "addressPostalCode": "..."
}
```

---

## Flow After Changes

### Login Flow:
1. User enters email/phone → Request OTP
2. User enters OTP → Verify OTP
3. **NEW:** Fetch user from EspoCRM API by email/phone
4. Store EspoCRM user ID in localStorage
5. Store complete user data in cookies
6. Redirect to home/profile

### Profile View Flow:
1. Get userId from localStorage
2. **NEW:** Fetch from `https://espobackend.vercel.app/api/customeraccount/{userId}`
3. Map EspoCRM fields to profile fields
4. Display user data

### Profile Edit Flow:
1. User edits profile fields
2. Map profile fields to EspoCRM fields
3. **NEW:** PUT to `https://espobackend.vercel.app/api/customeraccount/{userId}`
4. Map response back to profile fields
5. Update local state and cookies

---

## What Was NOT Changed

✅ No changes to UI/styling
✅ No changes to form validation
✅ No changes to other components
✅ No changes to Redux logic
✅ No changes to routing
✅ No changes to OTP verification flow

---

## Testing Checklist

### Test 1: Login
- [ ] Login with email that exists in EspoCRM
- [ ] Check localStorage has correct userId (EspoCRM ID)
- [ ] Check cookies have complete user data

### Test 2: View Profile
- [ ] Navigate to /profile
- [ ] Verify all fields show correct data from EspoCRM
- [ ] Check: name, email, phone, organisation, address, city, state, country

### Test 3: Edit Profile
- [ ] Click "Edit Profile"
- [ ] Update any field (e.g., organisation, address)
- [ ] Click "Save changes"
- [ ] Verify success message
- [ ] Verify changes appear in "My Profile" tab
- [ ] Refresh page and verify changes persist

### Test 4: Error Handling
- [ ] Login with user not in EspoCRM → Should fallback gracefully
- [ ] Edit profile with invalid data → Should show error
- [ ] Network error → Should show appropriate message

---

## Troubleshooting

### Profile shows empty fields
**Check:**
1. Browser console for API errors
2. localStorage has `userId` (should be EspoCRM ID like "698edf74a9e8162d2")
3. EspoCRM API returns data for that userId
4. Field mapping is correct

### Profile update fails
**Check:**
1. Network tab for API request/response
2. Request body has correct EspoCRM field names
3. EspoCRM API accepts PUT requests
4. User has permission to update

### Login doesn't fetch user
**Check:**
1. EspoCRM API is accessible
2. User exists in EspoCRM with matching email/phone
3. Phone format matches (with/without +91)

---

## Next Steps (Optional)

1. Add authentication headers to EspoCRM API calls if needed
2. Add avatar upload support (if EspoCRM supports it)
3. Add better error messages for specific API errors
4. Add loading states during API calls
5. Add retry logic for failed API calls

---

**Status:** ✅ Changes Complete
**Files Modified:** 2
**Lines Changed:** ~150
**Breaking Changes:** None
