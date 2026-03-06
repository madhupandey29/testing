# Cart to Wishlist Move - Error Fix

## Issue
When clicking "Added to Wishlist" button in cart, the error "Failed to move to wishlist" was shown.

## Root Causes Identified

### 1. Wrong API Approach
The original code was trying to:
1. Add a NEW wishlist item (POST /api/wishlist)
2. Delete the cart item (DELETE /api/wishlist/:id)

This approach failed because it was creating a duplicate instead of updating the existing item.

### 2. Incorrect Function Name
The code was using `buildPredicate` but importing `buildSearchPredicate`, causing a reference error.

### 3. Button Text Inconsistency
Two files had "Added to Wishlist" instead of "Move to Wishlist":
- `cart-item.jsx`
- `cart-item-new.jsx`

## Solutions Applied

### 1. Updated API Approach (cart-item.jsx)
Changed from "add new + delete old" to "update existing item":

```javascript
// OLD APPROACH (WRONG)
await addToWishlist(userId, PID);  // Creates new wishlist item
await removeFromCart(PID);         // Deletes cart item

// NEW APPROACH (CORRECT)
const res = await fetch(`${API_BASE}/wishlist/${itemId}`, {
  method: 'PATCH',
  body: JSON.stringify({ 
    itemType: 'wishlist',
    customerAccountId: userId
  }),
});
```

This uses PATCH to update the existing cart item's `itemType` from 'cart' to 'wishlist', which is the correct way to move items between cart and wishlist.

### 2. Fixed Function Name
Changed `buildPredicate` to `buildSearchPredicate` to match the import.

### 3. Updated Button Text
Changed "Added to Wishlist" to "Move to Wishlist" in both:
- `cart-item.jsx`
- `cart-item-new.jsx`

### 4. Added Better Error Logging
Added console logs to help debug issues:
- Log when starting move operation
- Log API response status
- Log errors with details
- Log success

### 5. Added Item ID Validation
Added check to ensure cart item ID exists before attempting move:
```javascript
const itemId = product?.cartItemId || product?.__originalCartItem?.id;

if (!itemId) {
  console.error('❌ Cart item ID not found');
  toast.error('Failed to move to wishlist: Item ID missing');
  return;
}
```

## Files Modified

1. **src/components/cart-wishlist/cart-item.jsx**
   - Fixed `saveForWishlist` function to use PATCH instead of POST+DELETE
   - Fixed `buildPredicate` to `buildSearchPredicate`
   - Changed button text to "Move to Wishlist"
   - Added better error logging
   - Added item ID validation

2. **src/components/cart-wishlist/cart-item-new.jsx**
   - Changed button text to "Move to Wishlist"
   - (Already had correct PATCH implementation)

## How It Works Now

1. User clicks "Move to Wishlist" button in cart
2. System gets the cart item ID from the product object
3. System validates the item ID exists
4. System sends PATCH request to `/api/wishlist/:itemId` with `itemType: 'wishlist'`
5. Backend updates the item's type from 'cart' to 'wishlist'
6. Item disappears from cart and appears in wishlist
7. Success toast notification shown

## Testing Checklist

- [x] Click "Move to Wishlist" in cart → item moves to wishlist
- [x] Button text shows "Move to Wishlist" (not "Added to Wishlist")
- [x] Error handling works if API fails
- [x] Console logs help debug issues
- [x] Item ID validation prevents crashes
- [x] Toast notifications show correct messages

## API Endpoint Used

**PATCH** `/api/wishlist/:itemId`

Request body:
```json
{
  "itemType": "wishlist",
  "customerAccountId": "user_id_here"
}
```

This updates the existing item's type from 'cart' to 'wishlist' without creating duplicates.
