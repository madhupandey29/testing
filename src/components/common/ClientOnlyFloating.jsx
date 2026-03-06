'use client';

import dynamic from 'next/dynamic';

const LazyFloatingButtons = dynamic(() => import('@/components/common/FloatingButtons'), {
  ssr: false,
  loading: () => null,
});

const LazyFloatingChatbot = dynamic(() => import('@/components/chatbot/FloatingChatbot'), {
  ssr: false,
  loading: () => null,
});

export default function ClientOnlyFloating() {
  return (
    <>
      <LazyFloatingButtons />
      <LazyFloatingChatbot />
    </>
  );
}
