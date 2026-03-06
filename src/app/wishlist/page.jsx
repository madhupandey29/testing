import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import WishlistArea from "@/components/cart-wishlist/wishlist-area";

export const metadata = {
  title: "Shofy - Wishlist Page",
  robots: {
    index: false,
    follow: true,
  },
};

// Force SSR for wishlist to avoid stale cached data
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export default async function WishlistPage() {
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
    redirect(`/login?returnTo=${encodeURIComponent('/wishlist')}`);
  }
  // -----------------------------

  return (
    <Wrapper>
      <HeaderTwo style_2={true} />
      <h1 style={{position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden'}}>Wishlist - Your Saved Products</h1>
      <WishlistArea />
      <Footer primary_style={true} />
    </Wrapper>
  );
}
