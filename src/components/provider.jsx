'use client';

import React from 'react';
import store from "@/redux/store";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from '@react-oauth/google';
import ClientOnlyFloating from '@/components/common/ClientOnlyFloating';

export default function Providers({ children }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const AppTree = (
    <Provider store={store}>
      {children}
      <ClientOnlyFloating />
    </Provider>
  );

  // Avoid runtime error if env missing
  if (!googleClientId) return AppTree;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {AppTree}
    </GoogleOAuthProvider>
  );
}