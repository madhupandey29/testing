import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import {
  toggleChat,
  openChat,
  closeChat,
  addMessage,
  setTyping,
  updateUserContext,
  setSessionId,
  clearMessages,
  selectChatbot,
  selectMessages,
  selectIsOpen,
  selectIsTyping
} from '../redux/features/chatbotSlice';
import { useSendMessageMutation } from '../redux/features/chatbotApi';
import { createChatbotMessage } from '../redux/store';

export const useChatbot = () => {
  const dispatch = useDispatch();
  const chatbot = useSelector(selectChatbot);
  const messages = useSelector(selectMessages);
  const isOpen = useSelector(selectIsOpen);
  const isTyping = useSelector(selectIsTyping);
  
  const [sendMessageMutation, { isLoading: isSending }] = useSendMessageMutation();

  // Initialize session and context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set session ID
      let sessionId = sessionStorage.getItem('chatSessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('chatSessionId', sessionId);
      }
      dispatch(setSessionId(sessionId));

      // Update user context
      dispatch(updateUserContext({
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      }));
    }
  }, [dispatch]);

  // Update context when page changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      dispatch(updateUserContext({
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      }));
    }
  }, [dispatch]);

  const sendMessage = useCallback(async (messageText, additionalContext = {}) => {
    if (!messageText.trim()) return;

    // Add user message to state
    const userMessage = {
      type: 'user',
      content: messageText,
      context: additionalContext
    };
    dispatch(addMessage(userMessage));

    // Create message data for API
    const messageData = createChatbotMessage(messageText, {
      sessionId: chatbot.sessionId,
      context: {
        ...chatbot.userContext,
        ...additionalContext
      }
    });

    try {
      dispatch(setTyping(true));
      
      // Send to API
      const response = await sendMessageMutation(messageData).unwrap();
      
      // Add bot response to state
      dispatch(addMessage({
        type: 'bot',
        content: response.content || response.replyText,
        suggestions: response.suggestions || [],
        meta: response.meta || {},
        ...response
      }));
    } catch (error) {
      console.error('Chat error:', error);
      dispatch(addMessage({
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        error: true
      }));
    } finally {
      dispatch(setTyping(false));
    }
  }, [dispatch, sendMessageMutation, chatbot.sessionId, chatbot.userContext]);

  const toggleChatbot = useCallback(() => {
    dispatch(toggleChat());
  }, [dispatch]);

  const openChatbot = useCallback(() => {
    dispatch(openChat());
  }, [dispatch]);

  const closeChatbot = useCallback(() => {
    dispatch(closeChat());
  }, [dispatch]);

  const clearChat = useCallback(() => {
    dispatch(clearMessages());
  }, [dispatch]);

  return {
    // State
    messages,
    isOpen,
    isTyping: isTyping || isSending,
    sessionId: chatbot.sessionId,
    userContext: chatbot.userContext,
    
    // Actions
    sendMessage,
    toggleChatbot,
    openChatbot,
    closeChatbot,
    clearChat,
    
    // Utils
    createMessage: createChatbotMessage
  };
};