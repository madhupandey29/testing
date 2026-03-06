import { apiSlice } from "../api/apiSlice";

export const officeInformationApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getOfficeInformation: builder.query({
      query: () => "/companyinformation",
      transformResponse: (response) => {
        // Apply the same filtering logic as in layout.jsx
        if (!response?.success || !response.data) {
          return { success: false, data: [] };
        }

        // Get filter value from environment variable
        const companyFilter = process.env.NEXT_PUBLIC_COMPANY_FILTER;
        
        if (!companyFilter) {
          return { success: false, data: [] };
        }

        // Find exact match only - NO FALLBACK
        const targetCompany = response.data.find(company => company.name === companyFilter);
        
        if (!targetCompany) {
          return { success: false, data: [] };
        }

        // Return the filtered company as the first (and only) item in the array
        return {
          success: true,
          data: [targetCompany]
        };
      },
    }),
  }),
});

export const { useGetOfficeInformationQuery } = officeInformationApi;
