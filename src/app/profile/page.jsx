import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Wrapper from '@/layout/wrapper';
import HeaderTwo from '@/layout/headers/header-2';
import Footer from '@/layout/footers/footer';
import UserProfile from '@/components/profile/UserProfile';

export const metadata = {
  title: 'Shofy - Profile Page',
  robots: {
    index: false,
    follow: true,
  },
};

// Force SSR for profile for latest user info
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export default async function ProfilePage() {
  // ----- Server-side auth guard -----
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value || '';

  let userId = '';
  const userInfoRaw = cookieStore.get('userInfo')?.value;
  if (userInfoRaw) {
    try {
      const parsed = JSON.parse(userInfoRaw);
      userId = String(parsed?.user?._id || '');
    } catch {
      // ignore JSON parse errors
    }
  }

  if (!sessionId && !userId) {
    redirect(`/login?returnTo=${encodeURIComponent('/profile')}`);
  }
  // -----------------------------

  return (
    <Wrapper>
      <HeaderTwo />
      <UserProfile />
      <Footer />
    </Wrapper>
  );
}