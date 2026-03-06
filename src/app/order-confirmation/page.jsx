import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import OrderConfirmationArea from "@/components/checkout/order-confirmation-area";

export const metadata = {
  title: "Order Confirmation - Thank You",
  robots: {
    index: false,
    follow: true,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrderConfirmationPage() {
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
    redirect(`/login?returnTo=${encodeURIComponent('/order-confirmation')}`);
  }
  // -----------------------------

  return (
    <Wrapper>
      <HeaderTwo style_2={true} />
      <h1 style={{position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden'}}>
        Order Confirmation - Thank You for Your Order
      </h1>
      <OrderConfirmationArea />
      <Footer primary_style={true} />
    </Wrapper>
  );
}
