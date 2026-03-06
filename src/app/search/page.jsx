// app/search/page.jsx
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import CommonBreadcrumb from "@/components/breadcrumb/common-breadcrumb";
import SearchArea from "@/components/search/search-area";
import Footer from "@/layout/footers/footer";

// ─── ISR: revalidate every hour ───────────────────────────────────────────
// The search page is a static shell; all searching happens client-side.
// A 1-hour revalidation ensures any layout/header changes are picked up
// while keeping the page fully static-cached at the edge.
export const revalidate = 3600;

export const metadata = {
  title: "Search Fabrics & Textiles - Find Your Perfect Product",
  description: "Search our entire collection of premium fabrics, textiles, and designer materials.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function SearchPage() {
  return (
    <Wrapper>
      <HeaderTwo style_2={true} />
      <CommonBreadcrumb title="Search Products" subtitle="Search Products" />
      <SearchArea />
      <Footer primary_style={true} />
    </Wrapper>
  );
}
