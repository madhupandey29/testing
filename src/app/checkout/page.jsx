import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import CheckoutArea from "@/components/checkout/checkout-area";

export const metadata = {
  title: "Checkout - Complete Your Order",
  robots: {
    index: false,
    follow: true,
  },
};

// Force SSR for fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value || '';

  let userId = '';
  const userInfoRaw = cookieStore.get('userInfo')?.value;
  if (userInfoRaw) {
    try {
      const parsed = JSON.parse(userInfoRaw);
      userId = String(parsed?.user?._id || '');
    } catch {
      // ignore
    }
  }

  if (!sessionId && !userId) {
    redirect(`/login?returnTo=${encodeURIComponent('/checkout')}`);
  }

  return (
    <Wrapper>
      <HeaderTwo style_2={true} />
      <h1 style={{position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden'}}>
        Checkout - Complete Your Order
      </h1>
      <CheckoutArea />
      <Footer primary_style={true} />
    </Wrapper>
  );
}
