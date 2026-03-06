// src/redux/features/auth/authApi.js
import { apiSlice } from "@/redux/api/apiSlice";
import { userLoggedIn } from "./authSlice";
import Cookies from "js-cookie";

/* --------------------------------- helpers --------------------------------- */
const getUserIdLS = (uid) => {
  if (uid) return uid;
  if (typeof window !== "undefined") {
    // unified: we now use localStorage 'userId' (NOT sessionStorage)
    return localStorage.getItem("userId") || "";
  }
  return "";
};

const persistUserIdLS = (uid) => {
  if (!uid || typeof window === "undefined") return;
  try {
    localStorage.setItem("userId", uid);
  } catch {
    // localStorage not available
  }
};

const clearUserIdLS = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("userId");
  } catch {
    // localStorage not available
  }
};

export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    /* ──────────────────────────────────────────
     * Registration
     * ────────────────────────────────────────── */
    sendRegistrationOTP: builder.mutation({
      query: (data) => ({
        url: "users/send-otp",
        method: "POST",
        credentials: "include",
        body: data,
      }),
    }),
    verifyOTPAndRegister: builder.mutation({
      query: ({ email, otp }) => ({
        url: "users/verify-otp",
        method: "POST",
        credentials: "include",
        body: { email, otp },
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (err) {
          // Silently ignore query errors - handled by RTK Query
          console.error('Register query failed:', err);
        }
      },
    }),

    /* ──────────────────────────────────────────
     * Login (store userId in localStorage)
     * ────────────────────────────────────────── */
    loginUser: builder.mutation({
      query: ({ identifier, password }) => ({
        url: "users/login",
        method: "POST",
        credentials: "include",
        body: { identifier, password },
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          const { user } = data || {};
          const userId =
            user?._id || user?.id || data?.userId || data?.id || ""; // ← adjust if your API returns a different field

          if (user) {
            Cookies.set("userInfo", JSON.stringify({ user }), { 
              expires: 7, // 7 days
              sameSite: 'lax',
              path: '/'
            });
          }
          if (userId) {
            persistUserIdLS(userId);
          }
          if (user || userId) {
            dispatch(userLoggedIn({ user, userId }));
          }
        } catch (err) {
          // Login failed
        }
      },
    }),

    requestLoginOTP: builder.mutation({
      query: ({ email }) => ({
        url: "users/login/otp/request",
        method: "POST",
        credentials: "include",
        body: { email },
      }),
    }),

    verifyLoginOTP: builder.mutation({
      query: ({ email, otp }) => ({
        url: "users/login/otp/verify",
        method: "POST",
        credentials: "include",
        body: { email, otp },
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          const { user } = data || {};
          const userId =
            user?._id || user?.id || data?.userId || data?.id || "";

          if (user) {
            // Map EspoCRM format to internal format before storing
            const mappedUser = {
              _id: user.id || user._id,
              id: user.id || user._id,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              email: user.emailAddress || user.email || '',
              phone: user.phoneNumber || user.phone || '',
              organisation: user.organizationNameRaw || user.organisation || '',
              address: user.addressStreet || user.address || '',
              city: user.addressCity || user.city || '',
              state: user.addressState || user.state || '',
              country: user.addressCountry || user.country || '',
              pincode: user.addressPostalCode || user.pincode || '',
              avatar: user.avatar || user.userImage || null,
              userImage: user.userImage || user.avatar || null,
            };
            
            Cookies.set("userInfo", JSON.stringify({ user: mappedUser }), { 
              expires: 7,
              sameSite: 'lax',
              path: '/'
            });
            
            if (userId) {
              persistUserIdLS(userId);
            }
            
            dispatch(userLoggedIn({ user: mappedUser, userId }));
          }
        } catch (err) {
          // OTP verification failed
        }
      },
    }),

    /* ──────────────────────────────────────────
     * Fetch session details (DISABLED - using EspoCRM only)
     * Returns mock data from localStorage/cookies
     * ────────────────────────────────────────── */
    getSessionInfo: builder.query({
      queryFn: async ({ userId } = {}) => {
        try {
          const uid = getUserIdLS(userId);
          
          // Get user from cookie
          const cookieData = Cookies.get('userInfo');
          if (cookieData) {
            const parsed = JSON.parse(cookieData);
            const user = parsed?.user || parsed;
            
            return {
              data: {
                session: { user },
                user,
              }
            };
          }
          
          // Return minimal session data
          return {
            data: {
              session: { user: { id: uid, _id: uid } },
              user: { id: uid, _id: uid },
            }
          };
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Session not found' } };
        }
      },
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          const user = data?.session?.user || data?.user || data;
          const userId = user?._id || user?.id || arg?.userId || getUserIdLS() || "";

          if (user && userId) {
            persistUserIdLS(userId);
            dispatch(userLoggedIn({ user, userId }));
          }
        } catch (err) {
          // Silent fail
        }
      },
    }),

    /* ──────────────────────────────────────────
     * LOGOUT (client-side only - no backend call)
     * Clears localStorage, cookies, and Redux state
     * ────────────────────────────────────────── */
    logoutUser: builder.mutation({
      queryFn: async ({ userId } = {}) => {
        try {
          // Clear all local storage
          clearUserIdLS();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('sessionId');
          }
          
          // Clear cookies
          Cookies.remove('userInfo');
          Cookies.remove('sessionId');
          
          return { data: { success: true, message: 'Logged out successfully' } };
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Logout failed' } };
        }
      },
    }),

    /* ──────────────────────────────────────────
     * Update Profile
     * ────────────────────────────────────────── */
    updateProfile: builder.mutation({
      query: ({ id, avatar, ...data }) => {
        // Ensure we have a valid user ID
        if (!id) {
          throw new Error('User ID is required');
        }

        // Always use FormData when there's a file or when we need to send the avatar
        if (avatar instanceof File || (data.avatar && typeof data.avatar === 'string')) {
          const formData = new FormData();
          
          // If we have a file, append it
          if (avatar instanceof File) {
            formData.append('userImage', avatar);
          }
          
          // Append all other data fields to formData
          Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null && key !== 'id') {
              // Convert to string if it's not a file
              const value = typeof data[key] === 'object' && !(data[key] instanceof File) 
                ? JSON.stringify(data[key]) 
                : data[key];
              formData.append(key, value);
            }
          });
          
          return {
            url: `/users/${id}`,  // Ensure leading slash for absolute URL
            method: "PUT",
            credentials: "include",
            body: formData,
            headers: {},
          };
        }
        
        // For non-file updates, send as JSON
        return {
          url: `/users/${id}`,  // Ensure leading slash for absolute URL
          method: "PUT",
          credentials: "include",
          body: data,
          headers: {
            'Content-Type': 'application/json',
          },
        };
      },
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          // Keep userId from localStorage if API doesn't echo it
          const userId = getUserIdLS();
          dispatch(userLoggedIn({ user: data, userId }));
        } catch (err) {
          // Silently ignore query errors - handled by RTK Query
          console.error('Session info query failed:', err);
        }
      },
    }),

    /* ──────────────────────────────────────────
     * Extra auth endpoints
     * ────────────────────────────────────────── */
    confirmEmail: builder.query({
      query: (token) => ({
        url: `users/verify-email/${token}`,
        method: "GET",
        credentials: "include",
      }),
    }),

    resetPassword: builder.mutation({
      query: ({ verifyEmail }) => ({
        url: "users/password/forgot/request",
        method: "POST",
        credentials: "include",
        body: { email: verifyEmail },
      }),
    }),

    confirmForgotPassword: builder.mutation({
      query: ({ password, token }) => ({
        url: "users/password/forgot/confirm",
        method: "POST",
        credentials: "include",
        body: { password, token },
      }),
    }),
  }),
});

/* --------------------------------- hooks ---------------------------------- */
export const {
  useSendRegistrationOTPMutation,
  useVerifyOTPAndRegisterMutation,
  useLoginUserMutation,
  useRequestLoginOTPMutation,
  useVerifyLoginOTPMutation,
  useGetSessionInfoQuery,
  useLogoutUserMutation,
  useUpdateProfileMutation,
  useConfirmEmailQuery,
  useResetPasswordMutation,
  useConfirmForgotPasswordMutation,
} = authApi;
