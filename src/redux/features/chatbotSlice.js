import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  isOpen: false,
  isTyping: false,
  sessionId: null,
  userContext: {
    pageUrl: '',
    userAgent: '',
    timestamp: null
  }
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    toggleChat: (state) => {
      state.isOpen = !state.isOpen;
    },
    openChat: (state) => {
      state.isOpen = true;
    },
    closeChat: (state) => {
      state.isOpen = false;
    },
    addMessage: (state, action) => {
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      state.messages.push(message);
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    updateUserContext: (state, action) => {
      state.userContext = {
        ...state.userContext,
        ...action.payload,
        timestamp: new Date().toISOString()
      };
    },
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    clearSession: (state) => {
      state.messages = [];
      state.sessionId = null;
      state.userContext = initialState.userContext;
    }
  }
});

export const {
  toggleChat,
  openChat,
  closeChat,
  addMessage,
  setTyping,
  updateUserContext,
  setSessionId,
  clearMessages,
  clearSession
} = chatbotSlice.actions;

export default chatbotSlice.reducer;

// Selectors
export const selectChatbot = (state) => state.chatbot;
export const selectMessages = (state) => state.chatbot.messages;
export const selectIsOpen = (state) => state.chatbot.isOpen;
export const selectIsTyping = (state) => state.chatbot.isTyping;
export const selectUserContext = (state) => state.chatbot.userContext;