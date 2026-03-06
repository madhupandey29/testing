// redux/features/wishlist-slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notifyError, notifySuccess } from '@/utils/toast';

/* ------------------------- API base helpers ------------------------- */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(
  /\/+$/,
  ''
);
const WISHLIST_BASE = `${API_BASE || 'https://espobackend.vercel.app/api'}/wishlist`;

/* ------------------------------- GET ------------------------------- */
/** GET /api/wishlist/fieldname/customerAccountId/:customerAccountId -> returns wishlist with full product data */
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (customerAccountId, { rejectWithValue }) => {
    try {
      if (!customerAccountId) return [];

      // New API endpoint pattern
      const url = `${WISHLIST_BASE}/fieldname/customerAccountId/${encodeURIComponent(customerAccountId)}`;

      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!res.ok) throw new Error(`GET wishlist ${res.status}`);
      const json = await res.json();

      // New response structure: { success, data: [...], total, pagination }
      // Each item has: id (wishlist item ID), productId, product (full object)
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }

      return [];
    } catch (e) {
      return rejectWithValue(e.message || 'Failed to fetch wishlist');
    }
  }
);

/* ------------------------------- PUT ------------------------------- */
/** POST /api/wishlist/ body: { customerAccountId, productId } */
async function addToWishlistApi(customerAccountId, productId) {
  const url = WISHLIST_BASE;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerAccountId, productId }),
  });
  if (!res.ok) throw new Error(`POST wishlist ${res.status}`);
  return res.json();
}

/** DELETE /api/wishlist/:wishlistItemId */
async function removeFromWishlistApi(
  wishlistItemId,
  customerAccountId,
  productId
) {
  const url = `${WISHLIST_BASE}/${encodeURIComponent(wishlistItemId)}`;

  console.log('🗑️ DELETE API Call:', {
    url,
    wishlistItemId,
    customerAccountId,
    productId,
  });

  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ customerAccountId, productId }),
  });

  console.log('🗑️ DELETE Response status:', res.status);

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ DELETE Error Response:', errorText);
    throw new Error(`DELETE wishlist ${res.status}: ${errorText}`);
  }

  const result = await res.json();
  console.log('✅ DELETE Success:', result);
  return result;
}

/* Toggle helper to find product id */
const getPid = (x) =>
  x?.productId || x?._id || x?.id || x?.product?._id || x?.product || x;

/** Toggle an item in wishlist (server is source of truth; optimistic) */
export const toggleWishlistItem = createAsyncThunk(
  'wishlist/toggleWishlistItem',
  async ({ customerAccountId, product }, { getState, rejectWithValue }) => {
    try {
      if (!customerAccountId) throw new Error('Not logged in');
      const state = getState();
      const current = state.wishlist?.wishlist || [];
      const pid = String(getPid(product));
      if (!pid) throw new Error('Product ID missing');

      // Check if product already in wishlist
      const existingItem = current.find((it) => String(getPid(it)) === pid);

      if (existingItem) {
        // Remove from wishlist (call DELETE)
        const wishlistItemId =
          existingItem.wishlistItemId ||
          existingItem.__originalWishlistItem?.id;

        if (!wishlistItemId) {
          throw new Error('Wishlist item ID not found');
        }

        await removeFromWishlistApi(wishlistItemId, customerAccountId, pid);

        notifyError('Removed from wishlist');

        // Return updated list without this item
        return current.filter(
          (it) =>
            (it.wishlistItemId || it.__originalWishlistItem?.id) !==
            wishlistItemId
        );
      } else {
        // Add to wishlist (call POST)
        const json = await addToWishlistApi(customerAccountId, pid);

        notifySuccess('Added to wishlist');

        // Return the new wishlist data from response
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }

        // Fallback: add to current list
        const newItem = {
          wishlistItemId: Date.now().toString(), // Temporary ID
          productId: pid,
          _id: pid,
          id: pid,
          name: product?.title || product?.name || 'Product',
          title: product?.title || product?.name || 'Product',
          customerAccountId,
          product: product,
        };
        return [...current, newItem];
      }
    } catch (e) {
      return rejectWithValue(e.message || 'Failed to update wishlist');
    }
  }
);

/* ------------------------------------------------------------------ */
/* ✅ COMPAT EXPORT (FIX FOR YOUR ERROR)                               */
/* ------------------------------------------------------------------ */
/**
 * Your DetailsWrapper is calling:
 *   dispatch(add_to_wishlist(productItem))
 *
 * But earlier you removed the old "add_to_wishlist" action.
 * So this function restores that name WITHOUT changing your wishlist logic.
 * It simply dispatches toggleWishlistItem after resolving customerAccountId.
 */
export const add_to_wishlist = (product) => async (dispatch, getState) => {
  const state = getState();

  // Try common places where customerAccountId may exist (adjust if you have a different auth slice)
  const customerAccountId =
    state.wishlist?.currentUserId ||
    state.auth?.user?._id ||
    state.auth?.user?.id ||
    state.auth?.userId ||
    state.user?.user?._id ||
    state.user?.userId;

  if (!customerAccountId) {
    notifyError('Please login to use wishlist');
    return;
  }

  return dispatch(toggleWishlistItem({ customerAccountId, product }));
};

/* ------------------------------ DELETE ----------------------------- */
/** DELETE /api/wishlist/:wishlistItemId */
export const removeWishlistItem = createAsyncThunk(
  'wishlist/removeWishlistItem',
  async (
    { customerAccountId, productId, title },
    { getState, rejectWithValue }
  ) => {
    try {
      if (!customerAccountId) throw new Error('Not logged in');
      if (!productId) throw new Error('Product ID missing');

      // Find the wishlist item to get its ID
      const current = getState().wishlist?.wishlist || [];

      console.log('🔍 DELETE - Looking for productId:', productId);
      console.log('🔍 DELETE - Current wishlist items:', current.length);

      const item = current.find((it) => {
        const itemProductId = String(it.productId || it._id || it.id);
        const searchProductId = String(productId);
        console.log(
          '🔍 Comparing:',
          itemProductId,
          '===',
          searchProductId,
          '?',
          itemProductId === searchProductId
        );
        return itemProductId === searchProductId;
      });

      if (!item) {
        console.error('❌ Item not found in wishlist. ProductId:', productId);
        console.error(
          'Available items:',
          current.map((it) => ({
            productId: it.productId,
            _id: it._id,
            id: it.id,
            wishlistItemId: it.wishlistItemId,
          }))
        );
        throw new Error('Item not found in wishlist');
      }

      const wishlistItemId =
        item.wishlistItemId || item.__originalWishlistItem?.id;

      console.log('✅ Found item:', {
        productId: item.productId,
        wishlistItemId: wishlistItemId,
        item: item,
      });

      if (!wishlistItemId) {
        console.error('❌ Wishlist item ID not found in item:', item);
        throw new Error('Wishlist item ID not found');
      }

      console.log('🗑️ Calling DELETE API with wishlistItemId:', wishlistItemId);

      // DELETE endpoint needs the wishlist item ID in URL
      await removeFromWishlistApi(wishlistItemId, customerAccountId, productId);

      notifyError(`${title || 'Item'} removed from wishlist`);

      // Remove from current state
      const next = current.filter(
        (it) =>
          (it.wishlistItemId || it.__originalWishlistItem?.id) !==
          wishlistItemId
      );

      console.log('✅ DELETE successful. Remaining items:', next.length);

      return next;
    } catch (e) {
      return rejectWithValue(e.message || 'Failed to remove from wishlist');
    }
  }
);

/* ------------------------------- Slice ----------------------------- */
const initialState = {
  wishlist: [], // array of product docs (local for UI; server persists IDs)
  loading: false,
  error: null,
  currentUserId: null, // Now stores customerAccountId
};

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    set_wishlist(state, { payload }) {
      state.wishlist = Array.isArray(payload) ? payload : [];
    },
    clear_wishlist(state) {
      state.wishlist = [];
      state.error = null;
      state.loading = false;
      state.currentUserId = null;
    },
    clear_wishlist_for_user_switch(state) {
      state.wishlist = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, { payload, meta }) => {
        state.loading = false;

        console.log('📥 FETCH WISHLIST - Raw payload:', payload);

        // Transform API response to match component expectations
        // Filter only wishlist items (itemType === "wishlist")
        const wishlistItems = (Array.isArray(payload) ? payload : []).filter(
          (item) => item.itemType === 'wishlist'
        );

        console.log(
          '📥 Filtered wishlist items:',
          wishlistItems.length,
          'out of',
          payload?.length || 0
        );

        state.wishlist = wishlistItems.map((item) => {
          const transformed = {
            // Wishlist metadata
            wishlistItemId: item.id, // For DELETE operations
            customerAccountId: item.customerAccountId,
            itemType: item.itemType, // Keep itemType

            // Product data (flatten for compatibility)
            _id: item.productId, // Components expect _id
            id: item.productId, // Components expect id
            productId: item.productId, // Keep original

            // Merge full product object if available
            ...(item.product || {}),

            // Override with top-level fields if present
            name: item.productName || item.product?.name,
            title: item.productName || item.product?.name,

            // Keep original item for reference
            __originalWishlistItem: item,
          };

          console.log('✅ Transformed item:', {
            wishlistItemId: transformed.wishlistItemId,
            productId: transformed.productId,
            _id: transformed._id,
            name: transformed.name,
            itemType: transformed.itemType,
          });

          return transformed;
        });

        console.log(
          '✅ FETCH WISHLIST - Total items stored:',
          state.wishlist.length
        );

        state.currentUserId = meta.arg; // customerAccountId
      })
      .addCase(fetchWishlist.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || 'Failed fetching wishlist';
      })
      // toggle
      .addCase(toggleWishlistItem.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleWishlistItem.fulfilled, (state, { payload }) => {
        // Transform the response similar to fetchWishlist
        state.wishlist = (Array.isArray(payload) ? payload : []).map((item) => {
          // If item already transformed, return as is
          if (item.wishlistItemId || item.__originalWishlistItem) {
            return item;
          }
          // Otherwise transform it
          return {
            wishlistItemId: item.id,
            customerAccountId: item.customerAccountId,
            _id: item.productId,
            id: item.productId,
            productId: item.productId,
            ...(item.product || {}),
            name: item.productName || item.product?.name,
            title: item.productName || item.product?.name,
            __originalWishlistItem: item,
          };
        });
      })
      .addCase(toggleWishlistItem.rejected, (state, { payload }) => {
        state.error = payload || 'Failed updating wishlist';
      })
      // remove
      .addCase(removeWishlistItem.fulfilled, (state, { payload }) => {
        state.wishlist = Array.isArray(payload) ? payload : [];
      })
      .addCase(removeWishlistItem.rejected, (state, { payload }) => {
        state.error = payload || 'Failed removing wishlist item';
      });
  },
});

export const { set_wishlist, clear_wishlist, clear_wishlist_for_user_switch } =
  wishlistSlice.actions;
export default wishlistSlice.reducer;
