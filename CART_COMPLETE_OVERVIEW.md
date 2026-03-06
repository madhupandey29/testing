# Cart System - Complete Overview

## 📁 Cart Pages & Components

### 1. Cart Page (`src/app/cart/page.jsx`)
- **Route**: `/cart`
- **Authentication**: Server-side guard using cookies (`sessionId` or `userInfo`)
- **Redirects**: Unauthenticated users → `/login?redirect=/cart`
- **Rendering**: Force SSR with `dynamic = "force-dynamic"`
- **Components Used**: `CartArea`, `HeaderTwo`, `Footer`

### 2. Cart Loading State (`src/app/cart/loading.jsx`)
- Skeleton loader with shimmer animation
- Shows 3 placeholder blocks during data fetch

### 3. Cart Area Component (`src/components/cart-wishlist/cart-area.jsx`)
- Main cart UI container
- **Features**:
  - Empty cart state with "Start Shopping" CTA
  - Cart header with item count
  - Cart items list
  - Desktop action buttons (Continue Shopping, Proceed to Checkout)
  - Mobile sticky bottom bar (auto-hides when footer visible)
- **Data Source**: `useGetCartDataQuery` from RTK Query
- **Actions**: Clear cart, navigate to checkout

### 4. Cart Item Component (`src/components/cart-wishlist/cart-item.jsx`)
- Individual cart item card
- **Features**:
  - Product image with link to product page
  - Product title, SKU, price
  - Product details (fabric type, color, content, finish, structure, design)
  - Specifications (weight in gsm/oz, width in cm/inch)
  - Quantity controls (+/- buttons)
  - "Move to Wishlist" button
  - "Delete" button
  - Search visibility (integrates with global search)
- **Responsive**: Mobile-optimized layout

---

## 🔌 API Endpoints

### Base URL
```
https://espobackend.vercel.app/api
```

### 1. GET Cart Items
```
GET /wishlist/fieldname/customerAccountId/{userId}
```
- Fetches all items for a user (filters by `itemType: "cart"`)
- Returns unified response with cart and wishlist items
- **Authentication**: Session cookie (`credentials: 'include'`)

**Alternative Endpoint** (documented):
```
GET /wishlist/fieldname/itemType/cart
```

### 2. UPDATE Cart Item
```
PATCH /wishlist/{itemId}
```
- Updates quantity: `{ qty: number, priceCurrency: string }`
- Updates currency: `{ priceCurrency: string }`
- Moves to wishlist: `{ itemType: "wishlist" }`

### 3. DELETE Cart Item
```
DELETE /wishlist/{itemId}
```
- Body: `{ customerAccountId: string, productId: string }`

### 4. ADD to Cart
```
POST /wishlist
```
- Body: `{ customerAccountId, productId, itemType: "cart", qty, price, priceCurrency }`

### 5. CLEAR Cart (Legacy - Not in unified API)
```
DELETE /cart/clear/{userId}
```

---

## 📊 Data Structure

### Cart Item Response
```json
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
    "altTextImage1": "lightweight 125gsm pink plain poplin 100% cotton",
    "fabricCode": "Nokia-666",
    "ratingCount": 122,
    "ratingValue": 4.2,
    "productTitle": null,
    "image1CloudUrl": "https://res.cloudinary.com/...",
    "assignedUserId": null,
    "isStarred": false
  }
}
```

### Transformed Cart Item (Frontend)
```javascript
{
  _id: "69565bbd5d3004f56",           // Product ID
  id: "69565bbd5d3004f56",            // Product ID
  productId: "69565bbd5d3004f56",     // Product ID
  cartItemId: "6996c0068fbfdff98",    // Cart item ID (for updates/deletes)
  
  // Cart-specific
  orderQuantity: 1,
  qty: 1,
  quantity: 1,
  price: 0,
  priceCurrency: "USD",
  priceConverted: 0,
  itemType: "cart",
  
  // Product data
  title: "Nokia-666",
  name: "Nokia-666",
  image: "https://res.cloudinary.com/...",
  category: "Woven Fabrics",
  color: ["Pink"],
  structure: "Plain / Poplin",
  content: ["100% Cotton"],
  design: "Solid Dyed",
  gsm: 125,
  ozs: 3.69,
  cm: 146,
  inch: 57.48,
  fabricCode: "Nokia-666",
  ratingCount: 122,
  ratingValue: 4.2,
  
  __originalCartItem: { /* original API response */ }
}
```

---

## 🔄 Redux State Management

### Cart Slice (`src/redux/features/cartSlice.js`)

#### State
```javascript
{
  cart_products: [],      // Array of cart items
  orderQuantity: 1,       // Default quantity for new items
  cartMiniOpen: false,    // Cart mini drawer state
  distinctCount: 0,       // Unique product count
  loading: false,         // Loading state
  error: null            // Error message
}
```

#### Actions
- `increment()` - Increase default order quantity
- `decrement()` - Decrease default order quantity
- `initialOrderQuantity()` - Reset to 1
- `openCartMini()` - Open cart drawer
- `closeCartMini()` - Close cart drawer

#### Async Thunks
1. `fetch_cart_products({ userId })` - Fetch all cart items
2. `add_to_cart({ userId, productId, quantity, price, priceCurrency })` - Add item
3. `update_cart_item({ userId, productId, quantity })` - Update quantity
4. `remove_from_cart({ userId, productId })` - Remove item
5. `clear_cart_api({ userId })` - Clear entire cart

#### Selectors
- `selectCartDistinctCount(state)` - Get unique product count
- `selectCartLoading(state)` - Get loading state
- `selectCartError(state)` - Get error message

---

## 🔌 RTK Query API (`src/redux/features/cartApi.js`)

### Endpoints

#### 1. `getCartData`
```javascript
useGetCartDataQuery(userId, { skip: !userId })
```
- **Method**: GET
- **URL**: `/wishlist/fieldname/customerAccountId/{userId}`
- **Filters**: `itemType === "cart"`
- **Cache**: 60 seconds
- **Tags**: `[{ type: "Cart", id: userId }]`

#### 2. `updateCartItem`
```javascript
useUpdateCartItemMutation()
// Usage: updateCartItem({ productId, quantity, userId })
```
- **Method**: PUT
- **URL**: `/cart/update/{productId}`
- **Invalidates**: Cart cache for userId

#### 3. `removeCartItem`
```javascript
useRemoveCartItemMutation()
// Usage: removeCartItem({ productId, userId, cartItemId })
```
- **Method**: DELETE
- **URL**: `/wishlist/{itemId}`
- **Invalidates**: Cart cache for userId

#### 4. `clearCart`
```javascript
useClearCartMutation()
// Usage: clearCart({ userId })
```
- **Method**: DELETE
- **URL**: `/cart/clear/{userId}`
- **Invalidates**: Cart cache for userId

#### 5. `addToCart`
```javascript
useAddToCartMutation()
// Usage: addToCart({ productId, userId, quantity })
```
- **Method**: POST
- **URL**: `/cart/add`
- **Invalidates**: Cart cache for userId

---

## 🎨 UI Features

### Desktop View
- Clean card-based layout
- Product image (80x100px)
- Product details with tags
- Quantity controls with +/- buttons
- "Move to Wishlist" and "Delete" buttons
- Action buttons at bottom (Continue Shopping, Proceed to Checkout)

### Mobile View
- Compact card layout (60x80px images)
- Stacked action buttons
- Sticky bottom bar with actions
- Auto-hides when footer is visible
- Touch-optimized controls

### Empty State
- Centered empty cart icon
- "Your cart is empty" message
- "Start Shopping" CTA button
- Minimum height: 400px

### Loading State
- Skeleton shimmer animation
- 3 placeholder blocks
- Smooth transition

---

## 🔐 Authentication

### Server-Side (Cart Page)
```javascript
const sessionId = cookieStore.get('sessionId')?.value || '';
const userInfo = cookieStore.get('userInfo')?.value;

if (!sessionId && !userId) {
  redirect(`/login?redirect=/cart`);
}
```

### Client-Side (Components)
```javascript
const userId = useSelector(selectUserId);

if (!userId) {
  return <div>Please sign in to view your cart</div>;
}
```

### API Requests
All requests include:
```javascript
credentials: 'include'  // Sends session cookies
```

---

## 🌍 Currency Support

### Supported Currencies
- `USD` - US Dollar ($)
- `INR` - Indian Rupee (₹)
- `EUR` - Euro (€)
- `GBP` - British Pound (£)

### Currency Conversion
- API handles conversion automatically
- `priceConverted` field contains converted price
- Update currency via PATCH `/wishlist/{itemId}`

---

## 🔍 Search Integration

Cart items integrate with global search:
```javascript
const { debounced: q } = useGlobalSearch();

// Searches in: name, slug, design, color
const searchVisible = useMemo(() => {
  const query = (q || '').trim();
  if (query.length < 2) return true;
  
  const fields = [
    () => name || '',
    () => safeSlug || '',
    () => String(product?.design ?? ''),
    () => String(product?.color ?? '')
  ];
  
  const pred = buildSearchPredicate(query, fields, { 
    mode: 'AND', 
    normalize: true 
  });
  
  return pred(product);
}, [q, product, name, safeSlug]);
```

---

## 📱 Responsive Breakpoints

```scss
@media (max-width: 768px) {
  // Tablet adjustments
  - Smaller padding
  - Hide desktop actions
  - Show mobile sticky bar
}

@media (max-width: 480px) {
  // Mobile adjustments
  - Compact images (60x80px)
  - Smaller fonts
  - Stacked buttons
}
```

---

## 🚀 Performance Optimizations

1. **Force SSR**: `dynamic = "force-dynamic"` for fresh data
2. **Cache Control**: `revalidate = 0`, `fetchCache = "default-no-store"`
3. **RTK Query Caching**: 60-second cache with auto-refetch
4. **Image Optimization**: Next.js Image component with Cloudinary
5. **Lazy Loading**: Components load on demand
6. **Debounced Search**: Prevents excessive re-renders

---

## 🐛 Error Handling

### API Errors
```javascript
if (!res.ok) {
  const txt = await res.text().catch(() => "");
  return rejectWithValue(`HTTP ${res.status}: ${txt || "Failed"}`);
}
```

### User Feedback
```javascript
toast.success('Item removed', {
  position: 'top-center',
  autoClose: 3000,
  theme: 'light',
});

toast.error('Failed to remove item', {
  position: 'top-center',
  autoClose: 3000,
  theme: 'light',
});
```

### Loading States
- Disable buttons during operations
- Show loading text ("Processing...")
- Prevent duplicate requests

---

## 📋 Key Fields Summary

### Cart Item Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Cart item ID (for updates/deletes) |
| `productId` | string | Product ID |
| `productName` | string | Product name |
| `qty` | number | Quantity ordered |
| `price` | string | Base price |
| `priceCurrency` | string | Currency code |
| `priceConverted` | number | Converted price |
| `itemType` | string | "cart" or "wishlist" |
| `customerAccountId` | string | Customer ID |
| `customerAccountName` | string | Customer name |
| `deleted` | boolean | Soft delete flag |
| `isStarred` | boolean | Favorite flag |
| `versionNumber` | number | Version for locking |

### Product Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Product ID |
| `name` | string | Product name |
| `fabricCode` | string | SKU/Fabric code |
| `category` | string | Fabric category |
| `color` | array | Color names |
| `structure` | string | Fabric structure |
| `content` | array | Material composition |
| `design` | string | Design type |
| `motif` | string | Motif pattern |
| `gsm` | number | Weight (grams/m²) |
| `ozs` | number | Weight (oz/yd²) |
| `cm` | number | Width (cm) |
| `inch` | number | Width (inches) |
| `image1CloudUrl` | string | Product image URL |
| `ratingCount` | number | Number of ratings |
| `ratingValue` | number | Average rating (0-5) |
| `altTextImage1` | string | Image alt text |

---

## 🔗 Related Files

### Pages
- `src/app/cart/page.jsx` - Main cart page
- `src/app/cart/loading.jsx` - Loading state
- `src/app/checkout/page.jsx` - Checkout page (next step)

### Components
- `src/components/cart-wishlist/cart-area.jsx` - Cart container
- `src/components/cart-wishlist/cart-item.jsx` - Cart item card
- `src/components/cart-wishlist/wishlist-area.jsx` - Wishlist (similar structure)
- `src/components/cart-wishlist/wishlist-item.jsx` - Wishlist item

### Redux
- `src/redux/features/cartSlice.js` - Cart state management
- `src/redux/features/cartApi.js` - RTK Query API
- `src/redux/api/apiSlice.js` - Base API configuration

### Utilities
- `src/utils/userSelectors.js` - User ID selector
- `src/utils/searchMiddleware.js` - Search predicate builder
- `src/hooks/useGlobalSearch.js` - Global search hook

### Documentation
- `CART_API_DOCUMENTATION.md` - Complete API reference

---

## 💡 Usage Examples

### Fetch Cart
```javascript
const { data, isLoading, error, refetch } = useGetCartDataQuery(userId);
const cartItems = data?.data?.items || [];
```

### Add to Cart
```javascript
const [addToCart] = useAddToCartMutation();

await addToCart({
  userId,
  productId,
  quantity: 1,
  price: '10.00',
  priceCurrency: 'USD'
}).unwrap();
```

### Update Quantity
```javascript
const [updateCartItem] = useUpdateCartItemMutation();

await updateCartItem({
  productId,
  quantity: 2,
  userId
}).unwrap();
```

### Remove Item
```javascript
const [removeCartItem] = useRemoveCartItemMutation();

await removeCartItem({
  productId,
  userId,
  cartItemId
}).unwrap();
```

### Clear Cart
```javascript
const [clearCart] = useClearCartMutation();

await clearCart({ userId }).unwrap();
```

---

## ✅ Best Practices

1. **Always use `cartItemId`** for updates/deletes (not `productId`)
2. **Include `credentials: 'include'`** in all API calls
3. **Refetch cart** after mutations to ensure UI sync
4. **Show loading states** during operations
5. **Handle errors gracefully** with toast notifications
6. **Validate user authentication** before cart operations
7. **Use RTK Query hooks** for automatic caching and refetching
8. **Filter by `itemType: "cart"`** when using unified API
9. **Transform API response** to match frontend expectations
10. **Debounce search** to prevent excessive filtering

---

Generated: $(date)
