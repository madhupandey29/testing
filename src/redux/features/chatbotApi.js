import { apiSlice } from "../api/apiSlice";

export const chatbotApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: "chat/message",
        method: "POST",
        body: {
          message: messageData.message,
          pageUrl: messageData.pageUrl,
          userAgent: messageData.userAgent,
          timestamp: messageData.timestamp,
          sessionId: messageData.sessionId,
          context: messageData.context || {}
        },
      }),
      transformResponse: (response) => {
        return {
          id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'bot',
          content: response.replyText || response.message || response.content || response,
          timestamp: new Date().toISOString(),
          suggestions: response.suggestions || [],
          meta: response.meta || {},
          ...response
        };
      },
    }),
    getChatHistory: builder.query({
      query: (sessionId) => `chat/history/${sessionId}`,
      providesTags: ['ChatHistory'],
    }),
    clearChatHistory: builder.mutation({
      query: (sessionId) => ({
        url: `chat/history/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ['ChatHistory'],
    }),
  }),
});

export const {
  useSendMessageMutation,
  useGetChatHistoryQuery,
  useClearChatHistoryMutation,
} = chatbotApi;