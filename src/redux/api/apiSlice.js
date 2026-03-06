import Cookies from "js-cookie";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  // ensure UI reflects latest data when window gains focus or reconnects
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers) => {
      // keep your headers logic, but without TS assertions
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      if (apiKey) headers.set("x-api-key", apiKey);
      headers.set("Content-Type", "application/json");

      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/admin")) {
          const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
          if (adminEmail) headers.set("x-admin-email", adminEmail);
        }
      }

      const userInfo = Cookies.get("userInfo");
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          if (user && user.accessToken) {
            headers.set("Authorization", `Bearer ${user.accessToken}`);
          }
        } catch (_err) {
          Cookies.remove("userInfo");
        }
      }
      return headers;
    },
  }),

  // IMPORTANT: include query arg in cache key (fixes “same data everywhere”)
  serializeQueryArgs: ({ endpointName, queryArgs }) => {
    const argKey =
      typeof queryArgs === "string" ? queryArgs : JSON.stringify(queryArgs);
    return `${endpointName}|${argKey}`;
  },

  endpoints: (builder) => ({
    // Filter endpoints
    getFilterOptions: builder.query({
      query: (endpoint) => {
        const url =
          typeof endpoint === "string" ? endpoint.replace(/^\/+/, "") : String(endpoint);
        return { url, method: "GET" };
      },
      providesTags: (_result, _err, endpoint) => {
        // Use a plain object instead of TS Record<>
        const tagMap = {
          "/category/": "Category",
          "/color/": "Color",
          "/content/": "Content",
          "/design/": "Design",
          "/structure/": "Structure",
          "/substructure/": "Structure",
          "/finish/": "Finish",
          "/subfinish/": "Finish",
          "/groupcode/": "GroupCode",
          "/vendor/": "Vendor",
          "/suitablefor/": "SuitableFor",
          "/subsuitable/": "SuitableFor",
          "/motifsize/": "MotifSize",
        };

        const raw = typeof endpoint === "string" ? endpoint : String(endpoint);
        const key = raw.startsWith("/") ? raw : `/${raw}`;
        const tagType = tagMap[key] || "Filter";

        return [{ type: tagType, id: key }];
      },
    }),

    // New field-based filter endpoints
    getFieldValues: builder.query({
      query: (fieldName) => ({
        url: `product/fieldname/${fieldName}`,
        method: "GET",
      }),
      providesTags: (_result, _err, fieldName) => [
        { type: "FieldValues", id: fieldName }
      ],
      // Force fresh data on every request during development
      keepUnusedDataFor: 0,
    }),

    // New endpoint for getting field values filtered by eCatalogue products only
    getECatalogueFieldValues: builder.query({
      query: (fieldName) => ({
        url: `product/fieldname/${fieldName}/filter/ecatalogue`,
        method: "GET",
      }),
      providesTags: (_result, _err, fieldName) => [
        { type: "ECatalogueFieldValues", id: fieldName }
      ],
      // Force fresh data on every request during development
      keepUnusedDataFor: 0,
    }),

    // Author API endpoint
    getAuthors: builder.query({
      query: () => ({
        url: "author",
        method: "GET",
      }),
      transformResponse: (response) => {
        // Handle both direct array response and wrapped response
        if (Array.isArray(response)) {
          return response.filter(author => !author.deleted);
        }
        if (response?.success && Array.isArray(response.data)) {
          return response.data.filter(author => !author.deleted);
        }
        return [];
      },
      providesTags: ["Authors"],
      keepUnusedDataFor: 300, // Cache for 5 minutes
    }),

    getAuthorById: builder.query({
      query: (id) => ({
        url: `author/${id}`,
        method: "GET",
      }),
      transformResponse: (response) => {
        // Handle both direct object response and wrapped response
        if (response?.id) {
          return response;
        }
        if (response?.success && response?.data?.id) {
          return response.data;
        }
        return null;
      },
      providesTags: (_result, _err, id) => [
        { type: "Author", id }
      ],
    }),

    getProductsByFieldValue: builder.query({
      query: ({ fieldName, value }) => ({
        url: `product/fieldname/${fieldName}/${encodeURIComponent(value)}`,
        method: "GET",
      }),
      providesTags: (_result, _err, { fieldName, value }) => [
        { type: "ProductsByField", id: `${fieldName}-${value}` }
      ],
    }),

    // New endpoint for getting product by slug
    getProductBySlug: builder.query({
      query: (slug) => ({
        url: `product/fieldname/productslug/${slug}`,
        method: "GET",
      }),
      providesTags: (_result, _err, slug) => [
        { type: "ProductBySlug", id: slug }
      ],
    }),

    // Blog API endpoints
    getBlogs: builder.query({
      query: () => ({
        url: "blog",
        method: "GET",
      }),
      transformResponse: (response) => {
        // Handle both direct array response and wrapped response
        if (Array.isArray(response)) {
          return response.filter(blog => !blog.deleted && blog.status === 'Approved');
        }
        if (response?.data && Array.isArray(response.data)) {
          return response.data.filter(blog => !blog.deleted && blog.status === 'Approved');
        }
        return [];
      },
      providesTags: ["Blogs"],
      keepUnusedDataFor: 300, // Cache for 5 minutes
    }),

    getBlogById: builder.query({
      query: (id) => ({
        url: `blog/${id}`,
        method: "GET",
      }),
      transformResponse: (response) => {
        if (response?.id) {
          return response;
        }
        if (response?.data?.id) {
          return response.data;
        }
        return null;
      },
      providesTags: (_result, _err, id) => [
        { type: "Blog", id }
      ],
    }),

    // ...other endpoints (unchanged)
  }),

  tagTypes: [
    "Products",
    "Coupon",
    "Product",
    "RelatedProducts",
    "UserOrder",
    "UserOrders",
    "ProductType",
    "OfferProducts",
    "PopularProducts",
    "TopRatedProducts",
    "NewProducts",
    "Structure",
    "Content",
    "Finish",
    "Design",
    "Color",
    "MotifSize",
    "SuitableFor",
    "Vendor",
    "PopularNewProducts",
    "OfferNewProducts",
    "TopRatedNewProducts",
    "Category",
    "GroupCode",
    "Filter",
    "Substructure",
    "Subfinish",
    "Subsuitable",
    "Group",
    "Cart",
    "ContactDraft",
    "Author",
    "FieldValues",
    "ECatalogueFieldValues",
    "ProductsByField",
    "ProductBySlug",
    "Authors",
    "Author",
    "ChatHistory",
    "WebsiteFaq",
    "Blogs",
    "Blog",
  ],
});

export const { 
  useGetFilterOptionsQuery, 
  useGetFieldValuesQuery, 
  useGetECatalogueFieldValuesQuery, 
  useGetProductsByFieldValueQuery, 
  useGetProductBySlugQuery, 
  useGetAuthorsQuery, 
  useGetAuthorByIdQuery,
  useGetBlogsQuery,
  useGetBlogByIdQuery 
} = apiSlice;
