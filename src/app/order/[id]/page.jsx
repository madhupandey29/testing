import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import OrderArea from "@/components/order/order-area";

export const metadata = {
  title: "Amrita Global Enterprises - Order Details",
};

// Force SSR for order details
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export default async function OrderPage({ params, searchParams }) {
  // Await params and searchParams
  const { id: orderId } = await params;
  const sp = await searchParams;
  
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
    redirect(`/login?returnTo=${encodeURIComponent(`/order/${orderId}`)}`);
  }
  // -----------------------------

  const userIdParam = sp?.userId ?? null; // optional, we also resolve from localStorage in OrderArea

  return (
    <Wrapper>
      <HeaderTwo style_2={true} />
      <OrderArea orderId={orderId} userId={userIdParam} />
      <Footer primary_style={true} />
    </Wrapper>
  );
}
