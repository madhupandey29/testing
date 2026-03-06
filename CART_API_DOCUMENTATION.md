# Cart API Documentation

## Base URL
```
https://espobackend.vercel.app/api
```

## Environment Variable
```javascript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://espobackend.vercel.app/api';
```

---

## 1. GET Cart Items

### Endpoint
```
GET /wishlist/fieldname/itemType/cart
```

### Description
Fetches all cart items for the current user (identified by session cookie).

### Headers
```javascript
{
  'Content-Type': 'application/json'
}
```

### Credentials
```javascript
credentials: 'include' // Sends session cookies
```

### Response Structure
```json
{
  "success": true,
  "data": [
    {
      "id": "6996c0068fbfdff98",
      "deleted": false,
      "itemType": "cart",
      "qty": 1,
      "price": "0.0000",
      "priceCurrency": "USD",
      "customerAccountId": "69941540212d244c3",
      "customerAccountName": "vivek1 kalal1",
      "productId": "69565bbd5d3004f56",
      "productName": "Nokia-666",
      "priceConverted": 0,
      "isStarred": false,
      "versionNumber": 1,
      "product": {
        "id": "69565bbd5d3004f56",
        "name": "Nokia-666",
        "category": "Woven Fabrics",
        "color": ["Pink"],
        "structure": "Plain / Poplin",
        "content": ["100% Cotton"],
        "design": "Solid Dyed",
        "motif": "N/A",
        "uM": "Meter",
        "gsm": 125.00000000101,
        "ozs": 3.6866631275,
        "cm": 146,
        "inch": 57.48031496063,
        "altTextImage1": "lightweight 125gsm pink plain poplin 100% cotton with mercerized and silicon soft finish",
        "fabricCode": "Nokia-666",
        "ratingCount": 122,
        "ratingValue": 4.2,
        "productTitle": null,
        "image1CloudUrl": "https://res.cloudinary.com/age-fabric/image/upload/v1769258944/ypptg4w4ns86ky9djtza.jpg",
        "assignedUserId": null,
        "isStarred": false
      }
    }
  ]
}
```

### Usage in Code
```javascript
const fetchCartData = async () => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://espobackend.vercel.app/api';
  const response = await fetch(`${API_BASE}/wishlist/fieldname/itemType/cart`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const result = await response.json();
  return result.data;
};
```

---

## 2. UPDATE Cart Item (Quantity/Currency)

### Endpoint
```
PATCH /wishlist/{itemId}
```

### Description
Updates cart item quantity or currency preference.

### Headers
```javascript
{
  'Content-Type': 'application/json'
}
```

### Credentials
```javascript
credentials: 'include'
```

### Request Body (Update Quantity)
```json
{
  "qty": 2,
  "priceCurrency": "USD"
}
```

### Request Body (Update Currency)
```json
{
  "priceCurrency": "INR"
}
```

### Supported Currencies
- `USD` - US Dollar ($)
- `INR` - Indian Rupee (₹)
- `EUR` - Euro (€)
- `GBP` - British Pound (£)

### Usage in Code
```javascript
// Update Quantity
const handleQuantityChange = async (itemId, newQty, currency) => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://espobackend.vercel.app/api';
  const response = await fetch(`${API_BASE}/wishlist/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      qty: newQty,
      priceCurrency: currency,
    }),
  });

  if (!response.ok) throw new Error('Failed to update quantity');
  return await response.json();
};

// Update Currency
const handleCurrencyChange = async (itemId, newCurrency) => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://espobackend.vercel.app/api';
  const response = await fetch(`${API_BASE}/wishlist/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      priceCurrency: newCurrency,
    }),
  });

  if (!response.ok) throw new Error('Failed to update currency');
  return await response.json();
};
```

---

## 3. DELETE Cart Item

### Endpoint
```
DELETE /wishlist/{itemId}
```

### Description
Removes an item from the cart.

### Headers
```javascript
{
  'Content-Type': 'application/json'
}
```

### Credentials
```javascript
credentials: 'include'
```

### Request Body
```json
{
  "customerAccountId": "69941540212d244c3"
}
```

### Usage in Code
```javascript
const handleRemove = async (itemId, customerAccountId) => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://espobackend.vercel.app/api';
  const response = await fetch(`${API_BASE}/wishlist/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      customerAccountId: customerAccountId,
    }),
  });

  if (!response.ok) throw new Error('Failed to remove item');
  return await response.json();
};
```

---

## 4. MOVE to Wishlist

### Endpoint
```
PATCH /wishlist/{itemId}
```

### Description
Moves a cart item to the wishlist by changing its itemType.

### Headers
```javascript
{
  'Content-Type': 'application/json'
}
```

### Credentials
```javascript
credentials: 'include'
```

### Request Body
```json
{
  "itemType": "wishlist"
}
```

### Usage in Code
```javascript
const handleMoveToWishlist = async (itemId) => {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://espobackend.vercel.app/api';
  const response = await fetch(`${API_BASE}/wishlist/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      itemType: 'wishlist',
    }),
  });

  if (!response.ok) throw new Error('Failed to move to wishlist');
  return await response.json();
};
```

---

## Product Data Fields

### Cart Item Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique cart item ID |
| `deleted` | boolean | Soft delete flag |
| `itemType` | string | "cart" or "wishlist" |
| `qty` | number | Quantity ordered |
| `price` | string | Base price |
| `priceCurrency` | string | Currency code (USD, INR, EUR, GBP) |
| `customerAccountId` | string | Customer ID |
| `customerAccountName` | string | Customer name |
| `productId` | string | Product ID |
| `productName` | string | Product name |
| `priceConverted` | number | Converted price in selected currency |
| `isStarred` | boolean | Favorite flag |
| `versionNumber` | number | Version for optimistic locking |

### Product Object Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Product ID |
| `name` | string | Product name |
| `category` | string | Fabric category |
| `color` | array | Array of color names |
| `structure` | string | Fabric structure |
| `content` | array | Material composition |
| `design` | string | Design type |
| `motif` | string | Motif pattern |
| `uM` | string | Unit of measurement |
| `gsm` | number | Grams per square meter |
| `ozs` | number | Ounces per square yard |
| `cm` | number | Width in centimeters |
| `inch` | number | Width in inches |
| `altTextImage1` | string | Image alt text |
| `fabricCode` | string | Unique fabric code (SKU) |
| `ratingCount` | number | Number of ratings |
| `ratingValue` | number | Average rating (0-5) |
| `productTitle` | string | SEO title |
| `image1CloudUrl` | string | Cloudinary image URL |
| `assignedUserId` | string | Assigned user |
| `isStarred` | boolean | Favorite flag |

---

## Authentication

All API endpoints require authentication via session cookies. The session is managed automatically by the browser when using `credentials: 'include'`.

### Session Cookie
- Cookie name: `sessionId` (or similar)
- Set by: Login API
- Required for: All cart operations

---

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Item not found"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data"
}
```

### Error Handling Example
```javascript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  toast.error('Operation failed. Please try again.');
}
```

---

## Complete Implementation Example

```javascript
import { toast } from 'react-toastify';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://espobackend.vercel.app/api';

// Fetch cart items
export const fetchCart = async () => {
  const response = await fetch(`${API_BASE}/wishlist/fieldname/itemType/cart`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  
  if (!response.ok) throw new Error('Failed to fetch cart');
  const result = await response.json();
  return result.data;
};

// Update quantity
export const updateQuantity = async (itemId, qty, currency) => {
  const response = await fetch(`${API_BASE}/wishlist/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ qty, priceCurrency: currency }),
  });
  
  if (!response.ok) throw new Error('Failed to update quantity');
  toast.success('Quantity updated');
  return await response.json();
};

// Update currency
export const updateCurrency = async (itemId, currency) => {
  const response = await fetch(`${API_BASE}/wishlist/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ priceCurrency: currency }),
  });
  
  if (!response.ok) throw new Error('Failed to update currency');
  toast.success('Currency updated');
  return await response.json();
};

// Remove item
export const removeItem = async (itemId, customerAccountId) => {
  const response = await fetch(`${API_BASE}/wishlist/${itemId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ customerAccountId }),
  });
  
  if (!response.ok) throw new Error('Failed to remove item');
  toast.success('Item removed');
  return await response.json();
};

// Move to wishlist
export const moveToWishlist = async (itemId) => {
  const response = await fetch(`${API_BASE}/wishlist/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ itemType: 'wishlist' }),
  });
  
  if (!response.ok) throw new Error('Failed to move to wishlist');
  toast.success('Moved to wishlist');
  return await response.json();
};
```

---

## Notes

1. **Session Management**: All requests use `credentials: 'include'` to send session cookies automatically.

2. **Image URLs**: Product images are hosted on Cloudinary. Use `unoptimized={true}` in Next.js Image component for external URLs.

3. **Currency Conversion**: The API handles currency conversion automatically. The `priceConverted` field contains the price in the selected currency.

4. **Quantity Limits**: Minimum quantity is 1. There's no explicit maximum, but validate on the frontend.

5. **Item Type**: Items can be either "cart" or "wishlist". Changing the `itemType` moves items between cart and wishlist.

6. **Soft Delete**: Items have a `deleted` flag for soft deletion. Deleted items may still exist in the database.

7. **Version Control**: The `versionNumber` field can be used for optimistic locking to prevent concurrent updates.
