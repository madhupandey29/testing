import { apiSlice } from '../api/apiSlice';

export const websiteFaqApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWebsiteFaqs: builder.query({
      query: () => ({
        url: '/websitefaq',
        method: 'GET',
      }),
      transformResponse: (response) => {
        // Handle the response structure based on your API
        if (response?.success && response?.data) {
          return Array.isArray(response.data) ? response.data : [response.data];
        }
        if (Array.isArray(response)) {
          return response;
        }
        return response?.data || response || [];
      },
      providesTags: ['WebsiteFaq'],
    }),
  }),
});

export const { useGetWebsiteFaqsQuery } = websiteFaqApi;