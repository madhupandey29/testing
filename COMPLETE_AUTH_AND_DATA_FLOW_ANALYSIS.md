# Complete Authentication & Data Flow Analysis

## 🔍 THE REAL PROBLEM

Looking at your console screenshot, I can see:
- API calls to `https://espobackend.vercel.app/api/customeraccount`
- The response shows EspoCRM field names: `emailAddress`, `phoneNumber`, `organizationNameRaw`, `addressStreet`, etc.
- But your frontend expects: `email`, `phone`, `organisation`, `address`, etc.

**THE CORE ISSUE**: Your login flow is NOT using the EspoCRM API at all! It's using a different API endpoint (`/users/login/otp/verify`) which doesn't exist in your EspoCRM backend.

---

## 📊 CURRENT FLOW (BROKEN)

### 1. Login Flow
```
User enters email → Request OTP
  ↓
API: POST https://espobackend.vercel.app/api/auth/login
  ↓
User enters OTP → Verify OTP
  ↓
API: POST https://espobackend.vercel.app/api/auth/verify-otp
  ↓
Response: { user: { id, firstName, lastName, emailAddress, phoneNumber, ... } }
  ↓
Save to cookie: Cookies.set('userInfo', { user: mappedUser })
  ↓
Save to localStorage: localStorage.setItem('userId', userId)
```

### 2. Profile Page Load
```
Page loads → UserProfile component mounts
  ↓
Read userId from localStorage
  ↓
Read user data from cookie (userInfo)
  ↓
Display in form
```

### 3. Profile Update
```
User edits profile → Click "Update Profile"
  ↓
API: PUT https://espobackend.vercel.app/api/customeraccount/:userId
Body: { firstName, lastName, emailAddress, phoneNumber, organizationNameRaw, ... }
  ↓
Response: { data: { id, firstName, emailAddress, ... }, entity: "CCustomerAccount", success: true }
  ↓
Map response → Save to cookie → Update form
```

---

## ❌ WHY IT'S BROKEN

### Problem 1: Login API Mismatch
Your `login-form.jsx` calls:
- `POST /api/auth/login` (doesn't exist in EspoCRM)
- `POST /api/auth/verify-otp` (doesn't exist in EspoCRM)

But your EspoCRM backend only has:
- `GET /api/customeraccount` - Get all customer accounts
- `GET /api/customeraccount/:id` - Get one customer account
- `POST /api/customeraccount` - Create customer account
- `PUT /api/customeraccount/:id` - Update customer account
- `DELETE /api/customeraccount/:id` - Delete customer account

**There is NO login/OTP endpoint in EspoCRM!**

### Problem 2: Data Not Persisting After Login
When you login, the API returns user data, but after logout and login again, the data disappears because:
1. The login API (`/auth/verify-otp`) returns MINIMAL user data (just id, firstName, lastName, email)
2. It does NOT return the full profile data (phone, address, organisation, etc.)
3. So when you login, only basic info is saved to cookie
4. The full profile data is only loaded when you visit the profile page and it fetches from `/api/customeraccount/:id`

---

## ✅ THE SOLUTION

You need to fetch the FULL user data from EspoCRM after login. Here's the corrected flow:

### New Login Flow
```
User enters email → Request OTP
  ↓
API: POST /api/auth/login (your custom auth endpoint)
  ↓
User enters OTP → Verify OTP
  ↓
API: POST /api/auth/verify-otp
Response: { user: { id, firstName, lastName, emailAddress } }
  ↓
🆕 FETCH FULL USER DATA FROM ESPOCRM
API: GET https://espobackend.vercel.app/api/customeraccount/:userId
Response: { 
  id, 
  firstName, 
  lastName, 
  emailAddress, 
  phoneNumber, 
  organizationNameRaw,
  addressStreet,
  addressCity,
  addressState,
  addressCountry,
  addressPostalCode
}
  ↓
Map EspoCRM fields to internal format
  ↓
Save COMPLETE user data to cookie
  ↓
Redirect to profile/home
```

---

## 🔧 WHAT NEEDS TO BE FIXED

### File 1: `src/components/forms/login-form.jsx`
After OTP verification succeeds, fetch full user data from EspoCRM:

```javascript
// After OTP verification
const verifyData = await verifyRes.json();
const currentUser = verifyData.user;
const userId = currentUser.id;

// 🆕 FETCH FULL USER DATA FROM ESPOCRM
const espoRes = await fetch(
  `https://espobackend.vercel.app/api/customeraccount/${userId}`,
  {
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

const espoData = await espoRes.json();
const fullUserData = espoData.data || espoData;

// Map to internal format
const mappedUser = {
  _id: fullUserData.id,
  id: fullUserData.id,
  firstName: fullUserData.firstName || '',
  lastName: fullUserData.lastName || '',
  name: fullUserData.name || `${fullUserData.firstName || ''} ${fullUserData.lastName || ''}`.trim(),
  email: fullUserData.emailAddress || '',
  phone: fullUserData.phoneNumber || '',
  organisation: fullUserData.organizationNameRaw || '',
  address: fullUserData.addressStreet || '',
  city: fullUserData.addressCity || '',
  state: fullUserData.addressState || '',
  country: fullUserData.addressCountry || '',
  pincode: fullUserData.addressPostalCode || '',
  avatar: null,
  userImage: null,
};

// Save to cookie
Cookies.set('userInfo', JSON.stringify({ user: mappedUser }), {
  expires: 7,
  sameSite: 'lax',
  path: '/',
});
```

### File 2: `src/redux/features/auth/authApi.js`
Same fix in the `verifyLoginOTP` mutation - fetch full data from EspoCRM after OTP verification.

---

## 📝 FIELD MAPPING REFERENCE

| EspoCRM Field | Internal Field | Description |
|--------------|----------------|-------------|
| `id` | `id`, `_id` | User ID |
| `firstName` | `firstName` | First name |
| `lastName` | `lastName` | Last name |
| `name` | `name` | Full name |
| `emailAddress` | `email` | Email address |
| `phoneNumber` | `phone` | Phone number |
| `organizationNameRaw` | `organisation` | Organization name |
| `addressStreet` | `address` | Street address |
| `addressCity` | `city` | City |
| `addressState` | `state` | State |
| `addressCountry` | `country` | Country |
| `addressPostalCode` | `pincode` | Postal code |

---

## 🎯 WISHLIST INTEGRATION

The wishlist uses Redux and requires `userId` to be in the Redux store:

```javascript
// In UserProfile.jsx
const dispatch = useDispatch();

useEffect(() => {
  if (userId) {
    dispatch(setUserId(userId)); // ✅ This syncs userId to Redux
  }
}, [userId, dispatch]);

// Wishlist hook reads from Redux
const { wishlist, loading } = useWishlistManager();
// This hook uses: const userId = useSelector(selectUserId);
```

The wishlist API endpoint:
```
GET https://espobackend.vercel.app/api/wishlist/fieldname/customerAccountId/:userId
```

---

## 🚀 IMPLEMENTATION STEPS

1. **Fix login-form.jsx**: Add EspoCRM data fetch after OTP verification
2. **Fix authApi.js**: Add EspoCRM data fetch in verifyLoginOTP mutation
3. **Test login flow**: Logout → Login → Check if all profile data appears
4. **Test persistence**: Navigate away → Come back → Data should persist
5. **Test wishlist**: Check if wishlist loads (requires userId in Redux)

---

## 🐛 DEBUGGING TIPS

Add these console logs to track the flow:

```javascript
// In login-form.jsx after OTP verification
console.log('1️⃣ OTP Response:', verifyData);
console.log('2️⃣ User ID:', userId);
console.log('3️⃣ EspoCRM Response:', espoData);
console.log('4️⃣ Mapped User:', mappedUser);
console.log('5️⃣ Cookie Saved:', Cookies.get('userInfo'));

// In UserProfile.jsx on mount
console.log('📍 Profile Page - userId:', userId);
console.log('📍 Profile Page - user from cookie:', user);
console.log('📍 Profile Page - Redux userId:', useSelector(state => state.auth.userId));
```

---

## ✅ EXPECTED BEHAVIOR AFTER FIX

1. **Login**: All profile data (phone, address, etc.) appears immediately
2. **Navigate away**: Data persists in cookie
3. **Come back**: Data loads from cookie
4. **Logout & Login**: Full data fetched from EspoCRM again
5. **Wishlist**: Loads correctly because userId is in Redux
