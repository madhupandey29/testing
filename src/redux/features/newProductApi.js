import { apiSlice } from "../api/apiSlice";

export const newProductApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAllNewProducts: builder.query({
      query: (params = {}) => {
        const { limit = 12, page = 1, merchTag } = params;
        let url = `/product/?limit=${limit}&page=${page}`;
        if (merchTag) {
          url += `&merchTag=${encodeURIComponent(merchTag)}`;
        }
        return url;
      },
      transformResponse: (res, meta, arg) => {
                
        // Handle the new API response structure
        let products = [];
        let total = 0;
        
        if (res?.success && res?.data && Array.isArray(res.data)) {
          products = res.data;
          total = res.total || res.data.length;
        } else if (res?.products && Array.isArray(res.products)) {
          products = res.products;
          total = res.total || res.products.length;
        } else if (res?.data) {
          products = Array.isArray(res.data) ? res.data : [];
          total = res.total || products.length;
        } else {
          products = Array.isArray(res) ? res : [];
          total = products.length;
        }

        const { limit = 50, page = 1 } = arg || {};
        
        return {
          data: products,
          total: total,
          success: res.success || true,
          pagination: res.pagination || {
            page: page,
            limit: products.length,
            totalPages: Math.ceil(total / limit),
            hasMore: (page * limit) < total
          }
        };
      },
      // Enable merging of paginated results
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        // Include merchTag in cache key to separate filtered vs unfiltered results
        const { merchTag } = queryArgs || {};
        return `${endpointName}-${merchTag || 'all'}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg?.page === 1) {
          // First page - replace cache
          return newItems;
        }
        
        // For filtered results, handle pagination differently
        if (newItems?.filtered && currentCache?.allFilteredProducts) {
          const { limit = 50, page = 1 } = arg || {};
          const allFiltered = currentCache.allFilteredProducts;
          
          // Calculate which products to show for this page
          const startIndex = (page - 1) * limit;
          const endIndex = Math.min(startIndex + limit, allFiltered.length);
          const pageProducts = allFiltered.slice(startIndex, endIndex);
          
          // Merge all loaded products so far
          const currentData = currentCache?.data || [];
          const mergedData = [...currentData, ...pageProducts];
          
          // Deduplicate by ID
          const uniqueData = mergedData.reduce((acc, product) => {
            const id = product._id || product.id;
            if (id && !acc.find(p => (p._id || p.id) === id)) {
              acc.push(product);
            }
            return acc;
          }, []);
          
          return {
            ...newItems,
            data: uniqueData,
            total: currentCache?.total || newItems?.total,
            allFilteredProducts: allFiltered, // Keep all filtered products for future pagination
            pagination: {
              ...newItems.pagination,
              hasMore: endIndex < allFiltered.length
            }
          };
        }
        
        // Standard pagination for unfiltered results
        const mergedData = [...(currentCache?.data || []), ...(newItems?.data || [])];
        
        // Deduplicate by ID
        const uniqueData = mergedData.reduce((acc, product) => {
          const id = product._id || product.id;
          if (id && !acc.find(p => (p._id || p.id) === id)) {
            acc.push(product);
          }
          return acc;
        }, []);
        
        return {
          ...newItems,
          data: uniqueData,
          total: currentCache?.total || newItems?.total,
        };
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
    }),
    getSingleNewProduct: builder.query({
      query: (id) => {
        // Use the general products endpoint and filter by ID
        // This is more reliable than the direct ID endpoint which returns 400
        return `/product?limit=200`;
      },
      transformResponse: (res, meta, id) => {
        // Handle the API response structure and find product by ID
        let products = [];
        if (res?.success && res?.data && Array.isArray(res.data)) {
          products = res.data;
        } else if (res?.products && Array.isArray(res.products)) {
          products = res.products;
        } else if (Array.isArray(res)) {
          products = res;
        }
        
        if (products.length === 0) {
          return { data: null };
        }
        
        // Search for product by ID in multiple fields
        const foundProduct = products.find(product => {
          const productId = product?.id || product?._id;
          const productSlug = product?.productslug;
          const aiTempSlug = product?.aiTempOutput;
          const fabricCode = product?.fabricCode;
          
          // Clean the ID by removing trailing hash
          const cleanId = id ? String(id).replace(/#$/, '') : id;
          
          return (
            productId === cleanId ||
            productSlug === cleanId ||
            aiTempSlug === cleanId ||
            fabricCode === cleanId
          );
        });

        return foundProduct ? { data: foundProduct } : { data: null };
      },
    }),
    // Add endpoint to get product by ID when slug lookup fails
    getSingleNewProductById: builder.query({
      query: (id) => `/product/${id}`,
      transformResponse: (res) => {

        if (res?.success && res?.data) {
          return { data: res.data };
        }
        if (res?.data) {
          return { data: res.data };
        }
        return { data: null };
      },
    }),
    addNewProduct: builder.mutation({
      query: (data) => ({
        url: "/product/",
        method: "POST",
        body: data,
      }),
    }),
    updateNewProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/product/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
    deleteNewProduct: builder.mutation({
      query: (id) => ({
        url: `/product/${id}`,
        method: "DELETE",
      }),
    }),
    searchNewProduct: builder.query({
      query: (q) => `/product/search/${q}`,
      transformResponse: (res) => {
                
        // Handle the new API response structure from espobackend.vercel.app
        if (res?.success && res?.data && Array.isArray(res.data)) {
          return {
            data: res.data,
            total: res.total || res.data.length,
            success: res.success,
            pagination: res.pagination || {
              page: 1,
              limit: res.data.length,
              totalPages: Math.ceil((res.total || res.data.length) / 20)
            }
          };
        }
        
        // Fallback for old API structure
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    // Note: groupcode might be removed in new API
    getGroupCodeProducts: builder.query({
      query: (groupcodeId) => `/product/groupcode/${groupcodeId}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getCategoryProducts: builder.query({
      query: (id) => `/product/category/${id}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getStructureProducts: builder.query({
      query: (id) => `/product/structure/${id}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getContentProducts: builder.query({
      query: (id) => `/product/content/${id}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getFinishProducts: builder.query({
      query: (id) => `/product/finish/${id}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getDesignProducts: builder.query({
      query: (id) => `/product/design/${id}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getColorProducts: builder.query({
      query: (id) => `/product/color/${id}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getMotifProducts: builder.query({
      query: (id) => `/product/motif/${id}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    // Get products by collection ID for related products
    getProductsByCollection: builder.query({
      query: (collectionId) => {
        // Use the general endpoint
        return `/product`;
      },
      transformResponse: (res, meta, arg) => {
        const collectionId = arg; // The collection ID passed to the query
        
        if (res?.success && res?.data && Array.isArray(res.data)) {
          let products = res.data;
          
          // Filter products by collection ID if provided
          if (collectionId && collectionId.trim() !== '') {
            const originalCount = products.length;
            
            products = products.filter(product => {
              // Check if product belongs to the specified collection
              const matches = product.collectionId === collectionId || 
                             product.collection === collectionId ||
                             product.collection_id === collectionId;
              
              // Debug logging removed - collection filtering is working correctly
              
              return matches;
            });
            
                        const collectionStats = {};
            res.data.forEach(product => {
              const collection = product.collectionId || product.collection || product.collection_id || 'No Collection';
              collectionStats[collection] = (collectionStats[collection] || 0) + 1;
            });
            }
          
          const result = {
            data: products,
            total: products.length,
            success: res.success,
            collectionId: collectionId
          };
          
          return result;
        }
        if (res?.products) {
          let products = res.products;
          
          // Filter by collection if provided
          if (collectionId && collectionId.trim() !== '') {
            products = products.filter(product => {
              return product.collectionId === collectionId || 
                     product.collection === collectionId ||
                     product.collection_id === collectionId;
            });
          }
          
          return {
            data: products,
            total: products.length,
            success: true,
            collectionId: collectionId
          };
        }
        const data = res?.data ?? res ?? [];
        let products = Array.isArray(data) ? data : [];
        
        // Filter by collection if provided
        if (collectionId && collectionId.trim() !== '' && products.length > 0) {
          products = products.filter(product => {
            return product.collectionId === collectionId || 
                   product.collection === collectionId ||
                   product.collection_id === collectionId;
          });
        }
        
        return {
          data: products,
          total: products.length,
          success: res?.success ?? true,
          collectionId: collectionId
        };
      },
      // Add proper cache key to separate different collections
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const collectionId = queryArgs || 'all';
        // Safely convert collectionId to string, handling Symbol values
        const safeCollectionId = typeof collectionId === 'symbol' 
          ? collectionId.toString() 
          : String(collectionId);
        return `${endpointName}-${safeCollectionId}`;
      },
      // Force refetch when collection changes to avoid cache issues
      forceRefetch({ currentArg, previousArg }) {
        // Always refetch when collection ID is different
        return currentArg !== previousArg;
      },
    }),
    getSuitableProducts: builder.query({
      query: (id) => `/product/suitable/${id}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getVendorProducts: builder.query({
      query: (id) => `/product/vendor/${id}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getIdentifierProducts: builder.query({
      query: (identifier) => `/product/identifier/${identifier}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getGsmUpto: builder.query({
      query: (value) => `/product/gsm/${value}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getOzUpto: builder.query({
      query: (value) => `/product/ozs/${value}`, // Updated from 'oz' to 'ozs'
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getInchUpto: builder.query({
      query: (value) => `/product/inch/${value}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getCmUpto: builder.query({
      query: (value) => `/product/cm/${value}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getPriceUpto: builder.query({
      query: (value) => `/product/price/${value}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getQuantityUpto: builder.query({
      query: (value) => `/product/quantity/${value}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getPurchasePriceUpto: builder.query({
      query: (value) => `/product/purchaseprice/${value}`,
      transformResponse: (res) => {
        if (res?.products) {
          return {
            data: res.products,
            total: res.total,
            success: res.success
          };
        }
        return res?.data ? res : { data: res || [] };
      },
    }),
    getGroupCodeById: builder.query({
      query: (id) => `/groupcode/view/${id}`,
    }),
    // Shared endpoint for both Popular and Top Rated products
    getAllProductsForFiltering: builder.query({
      query: () => {
        // Single API call that both Popular and Top Rated will use
        // ✅ PERFORMANCE OPTIMIZATION: Reduced from 200 to 50 to improve page load
        // Products are filtered client-side by merchTags (PopularFabrics, TopRatedFabrics, ecatalogue)
        return `/product/?limit=50`;
      },
      transformResponse: (res, meta, arg) => {
        // Handle API errors gracefully
        if (!res) {
          return {
            data: [],
            total: 0,
            success: false,
            error: 'No response from API',
            message: 'Backend API is currently unavailable'
          };
        }

        if (res.success === false) {
          return {
            data: [],
            total: 0,
            success: false,
            error: res.error || 'API Error',
            message: 'Backend API returned an error'
          };
        }
        
        // Handle the API response structure
        let products = [];
        
        if (res?.success === true && res?.data && Array.isArray(res.data)) {
          products = res.data;
          } else if (res?.products && Array.isArray(res.products)) {
          products = res.products;
          } else if (Array.isArray(res)) {
          products = res;
          } else {
          return {
            data: [],
            total: 0,
            success: false,
            error: 'Invalid response format',
            message: 'API returned unexpected data format'
          };
        }

                if (products.length > 0) {
          const sample = products[0];
          }
        
        // Return properly formatted response
        return {
          data: products,
          total: products.length,
          success: true,
          rawProducts: products
        };
      },
      transformErrorResponse: (response, meta, arg) => {
        return {
          status: response?.status || 500,
          data: {
            success: false,
            error: response?.data || 'Network error occurred',
            message: 'Failed to fetch products - please check your connection'
          }
        };
      },
    }),

    getPopularNewProducts: builder.query({
      query: () => {
        // Add unique identifier to prevent cache conflicts with Top Rated
        return `/product/?limit=200&source=popular`;
      },
      transformResponse: (res, meta, arg) => {
                
        // Handle API errors gracefully
        if (!res || (res.success === false && res.error)) {
          return {
            data: [],
            total: 0,
            success: false,
            error: res?.error || 'API Error',
            message: 'Backend API is currently unavailable'
          };
        }
        
        // Handle the new API response structure
        let products = [];
        
        if (res?.success && res?.data && Array.isArray(res.data)) {
          products = res.data;
        } else if (res?.products && Array.isArray(res.products)) {
          products = res.products;
        } else if (res?.data) {
          products = Array.isArray(res.data) ? res.data : [];
        } else {
          products = Array.isArray(res) ? res : [];
        }

        // If no products found, return empty result but with success
        if (products.length === 0) {
          return {
            data: [],
            total: 0,
            success: true,
            filtered: false,
            message: 'No products available'
          };
        }

        // Filter products that have BOTH PopularFabrics AND ecatalogue tags
        const popularTag = 'PopularFabrics';
        const catalogueTag = 'ecatalogue';
        
        const filteredProducts = products.filter(product => {
          if (!product.merchTags || !Array.isArray(product.merchTags)) {
            return false;
          }
          
          // Product must have BOTH tags
          const hasPopularTag = product.merchTags.includes(popularTag);
          const hasCatalogueTag = product.merchTags.includes(catalogueTag);
          
          return hasPopularTag && hasCatalogueTag;
        });
        
        // Debug logging removed - filtering logic is working correctly
        
        return {
          data: filteredProducts,
          total: filteredProducts.length,
          success: res.success || true,
          filtered: true,
          filterTags: [popularTag, catalogueTag]
        };
      },
      transformErrorResponse: (response, meta, arg) => {
        return {
          status: response.status,
          data: response.data || 'Backend API is currently unavailable. Please try again later.',
          message: 'Failed to fetch popular products'
        };
      },
    }),
   /*  getOffers: builder.query({
      query: () => "/product/offers",
    }), */
    getTopRated: builder.query({
      query: () => {
        // Add unique identifier to prevent cache conflicts with Popular Products
        return `/product/?limit=200&source=toprated`;
      },
      transformResponse: (res, meta, arg) => {
                
        // Handle API errors gracefully
        if (!res || (res.success === false && res.error)) {
          return {
            data: [],
            total: 0,
            success: false,
            error: res?.error || 'API Error',
            message: 'Backend API is currently unavailable'
          };
        }
        
        // Handle the new API response structure
        let products = [];
        
        if (res?.success && res?.data && Array.isArray(res.data)) {
          products = res.data;
        } else if (res?.products && Array.isArray(res.products)) {
          products = res.products;
        } else if (res?.data) {
          products = Array.isArray(res.data) ? res.data : [];
        } else {
          products = Array.isArray(res) ? res : [];
        }

        // If no products found, return empty result but with success
        if (products.length === 0) {
          return {
            data: [],
            total: 0,
            success: true,
            filtered: false,
            message: 'No products available'
          };
        }

        // Filter products that have BOTH TopRatedFabrics AND ecatalogue tags
        const topRatedTag = 'TopRatedFabrics';
        const catalogueTag = 'ecatalogue';
        
        const filteredProducts = products.filter(product => {
          if (!product.merchTags || !Array.isArray(product.merchTags)) {
            return false;
          }
          
          // Product must have BOTH tags
          const hasTopRatedTag = product.merchTags.includes(topRatedTag);
          const hasCatalogueTag = product.merchTags.includes(catalogueTag);
          
          return hasTopRatedTag && hasCatalogueTag;
        });
        
        // Debug logging removed - filtering logic is working correctly
        
        return {
          data: filteredProducts,
          total: filteredProducts.length,
          success: res.success || true,
          filtered: true,
          filterTags: [topRatedTag, catalogueTag]
        };
      },
      transformErrorResponse: (response, meta, arg) => {
        return {
          status: response.status,
          data: response.data || 'Backend API is currently unavailable. Please try again later.',
          message: 'Failed to fetch top rated products'
        };
      },
    }),
  }),
});

export const {
  useGetAllNewProductsQuery,
  useGetSingleNewProductQuery,
  useGetSingleNewProductByIdQuery,
  useAddNewProductMutation,
  useUpdateNewProductMutation,
  useDeleteNewProductMutation,
  useSearchNewProductQuery,
  useGetGroupCodeProductsQuery,
  useGetCategoryProductsQuery,
  useGetStructureProductsQuery,
  useGetContentProductsQuery,
  useGetFinishProductsQuery,
  useGetDesignProductsQuery,
  useGetColorProductsQuery,
  useGetMotifProductsQuery,
  useGetSuitableProductsQuery,
  useGetVendorProductsQuery,
  useGetIdentifierProductsQuery,
  useGetGsmUptoQuery,
  useGetOzUptoQuery,
  useGetInchUptoQuery,
  useGetCmUptoQuery,
  useGetPriceUptoQuery,
  useGetQuantityUptoQuery,
  useGetPurchasePriceUptoQuery,
  useGetGroupCodeByIdQuery,
  useGetAllProductsForFilteringQuery,
  useGetPopularNewProductsQuery,
  useGetOffersQuery,
  useGetTopRatedQuery,
  useGetProductsByCollectionQuery,
} = newProductApi; 