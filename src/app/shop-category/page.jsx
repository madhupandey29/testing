// app/shop-category/page.jsx
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import ShopBreadcrumb from "@/components/breadcrumb/shop-breadcrumb";
import ShopCategoryArea from "@/components/categories/shop-category-area";

// ─── ISR: revalidate every 5 minutes ──────────────────────────────────────
// Categories rarely change; a short window keeps it fresh without
// hammering the API.
export const revalidate = 300;

export const metadata = {
  title: "Shop by Category - Premium Fabric Collections",
  description: "Browse all fabric categories including cotton, mercerized, designer textiles and more.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function CategoryPage() {
  return (
    <Wrapper>
      <HeaderTwo style_2={true} />
      <ShopBreadcrumb title="Shop by Category" subtitle="Shop by Category" />
      <ShopCategoryArea />
      <Footer primary_style={true} />
    </Wrapper>
  );
}
