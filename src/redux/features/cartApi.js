import { apiSlice } from "../api/apiSlice";

/**
 * Ensure apiSlice has: tagTypes: ['Cart']
 *
 * export const apiSlice = createApi({
 *   baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
 *   tagTypes: ['Cart'],
 *   endpoints: () => ({}),
 * });
 */
export const cartApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({

    // GET unified API - filter by itemType: "cart"
    getCartData: builder.query({
      query: (userId) => {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://espobackend.vercel.app/api";
        const url = `${API_BASE}/wishlist/fieldname/customerAccountId/${encodeURIComponent(userId)}`;
        
        return { 
          url: url,
          method: "GET",
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        };
      },
      transformResponse: (response) => {
        console.log('🛒 RTK Query - Raw response:', response);
        
        // Filter only cart items
        const allItems = Array.isArray(response?.data) ? response.data : [];
        const cartItems = allItems.filter(item => item.itemType === 'cart');
        
        console.log('🛒 RTK Query - Filtered cart items:', cartItems.length, 'out of', allItems.length);
        
        // Transform to match expected format
        const transformedItems = cartItems.map(item => {
          console.log('🛒 Transforming item:', { id: item.id, productId: item.productId, qty: item.qty });
          
          return {
            _id: item.id, // cart item ID (THIS IS THE KEY FOR UPDATES!)
            productId: {
              _id: item.productId,
              name: item.productName || item.product?.name,
              ...(item.product || {}),
            },
            quantity: item.qty || 1,
            price: parseFloat(item.price) || 0,
            priceCurrency: item.priceCurrency || 'USD',
            priceConverted: item.priceConverted || parseFloat(item.price) || 0,
          };
        });
        
        console.log('🛒 RTK Query - Transformed items:', transformedItems);
        
        return {
          success: true,
          data: {
            items: transformedItems,
            cartTotal: transformedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
          }
        };
      },
      providesTags: (result, error, userId) => [{ type: "Cart", id: userId ?? "UNKNOWN" }],
      keepUnusedDataFor: 60,
      forceRefetch({ currentArg, previousArg }) {
        return currentArg === previousArg;
      },
      async onQueryStarted(userId, { queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          console.log('🛒 RTK Query - Success:', result);
        } catch (err) {
          console.error('🛒 RTK Query - Error:', err);
        }
      },
    }),

    // PUT /cart/update/:productId
    updateCartItem: builder.mutation({
      query: ({ productId, quantity, userId }) => {
        return {
          url: `cart/update/${productId}`,
          method: "PUT",
          body: { quantity, userId },
        };
      },
      invalidatesTags: (result, error, { userId }) => [{ type: "Cart", id: userId ?? "UNKNOWN" }],
      async onQueryStarted({ productId, quantity }, { queryFulfilled }) {
        try {
          const result = await queryFulfilled;
        } catch (err) {
          // Silently ignore query errors - handled by RTK Query
          console.error('Add to cart query failed:', err);
        }
      },
    }),

    // DELETE /wishlist/:itemId - Remove cart item
    removeCartItem: builder.mutation({
      query: ({ productId, userId, cartItemId }) => {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://espobackend.vercel.app/api";
        
        // If we have cartItemId, use it directly; otherwise we need to find it
        const itemId = cartItemId || productId;
        const url = `${API_BASE}/wishlist/${encodeURIComponent(itemId)}`;
        
        console.log('🗑️ RTK Query - Remove cart item:', { url, productId, userId, cartItemId });
        
        return {
          url: url,
          method: "DELETE",
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            customerAccountId: userId,
            productId: productId
          }),
        };
      },
      invalidatesTags: (result, error, { userId }) => [{ type: "Cart", id: userId ?? "UNKNOWN" }],
      async onQueryStarted({ productId }, { queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          console.log('🗑️ RTK Query - Remove success:', result);
        } catch (err) {
          console.error('🗑️ RTK Query - Remove error:', err);
        }
      },
    }),

    // DELETE /cart/clear
    clearCart: builder.mutation({
      // Accept { userId } so invalidation can be precise
      query: ({ userId }) => {
        // Some backends ignore bodies on DELETE; put userId in querystring too.
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        return {
          url: `cart/clear/${userId}`,
          method: "DELETE",
          body: { userId }, // keep for servers that do accept DELETE bodies
        };
      },
      invalidatesTags: (result, error, { userId }) => [{ type: "Cart", id: userId ?? "UNKNOWN" }],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (err) {
          // Silently ignore query errors - handled by RTK Query
          console.error('Clear cart query failed:', err);
        }
      },
    }),

    // POST /cart/add
    addToCart: builder.mutation({
      query: ({ productId, userId, quantity = 1 }) => {
        return {
          url: "cart/add",
          method: "POST",
          body: { productId, userId, quantity },
        };
      },
      invalidatesTags: (result, error, { userId }) => [{ type: "Cart", id: userId ?? "UNKNOWN" }],
      async onQueryStarted({ productId, quantity }, { queryFulfilled }) {
        try {
          const result = await queryFulfilled;
        } catch (err) {
          // Silently ignore query errors - handled by RTK Query
          console.error('Update cart quantity query failed:', err);
        }
      },
    }),
  }),
});

export const {
  useGetCartDataQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useAddToCartMutation,
} = cartApi;
