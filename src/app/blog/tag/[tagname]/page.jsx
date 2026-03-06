// app/blog/tag/[tagname]/page.jsx
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import BlogContentWrapper from "@/components/blog/blog-grid/blog-content-wrapper";
import Footer from "@/layout/footers/footer";
import CompactUniversalBreadcrumb from "@/components/breadcrumb/compact-universal-breadcrumb";
import { generateMetadata as generateSEOMetadata } from "@/utils/seo";
import { BreadcrumbJsonLd } from "@/utils/breadcrumbStructuredData";
import { getPageSeoMetadata, fetchTopicPageByName, PAGE_NAMES } from "@/utils/topicPageSeoIntegration";
import { BlogPageJsonLd } from "@/utils/blogPageStructuredData";

// ─── ISR: revalidate every 60 seconds ─────────────────────────────────────
export const revalidate = 60;
export const dynamicParams = true; // on-demand ISR for new tags

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
const BLOG_PATH = process.env.NEXT_PUBLIC_API_BLOG_PATH || "/blog";

/* ─── Fetch all blogs (ISR-cached) ─────────────────────────────────────── */
async function fetchBlogs() {
  try {
    const res = await fetch(`${API_BASE}${BLOG_PATH}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) throw new Error("Failed to fetch blogs");
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

function getFirstBlogImage(blogs) {
  if (!Array.isArray(blogs) || blogs.length === 0) return null;
  const first = blogs[0];
  const img = first?.blogimage1 || first?.blogimage2;
  if (!img) return null;
  return typeof img === "string"
    ? img
    : img.url || img.secure_url || img.src || img.path || null;
}

/* ─── generateStaticParams ─────────────────────────────────────────────────
   Pre-builds a page for every unique tag found in the blog list.
────────────────────────────────────────────────────────────────────────────── */
export async function generateStaticParams() {
  try {
    const blogs = await fetchBlogs();
    const tagSet = new Set();

    for (const blog of blogs) {
      const tags = Array.isArray(blog?.tags) ? blog.tags : [];
      tags.forEach((t) => {
        const clean = String(t || "").trim();
        if (clean) tagSet.add(encodeURIComponent(clean));
      });
    }

    return Array.from(tagSet).map((tagname) => ({ tagname }));
  } catch {
    return [];
  }
}

/* ─── Metadata ────────────────────────────────────────────────────────────── */
export async function generateMetadata({ params }) {
  const { tagname } = await params;
  const decodedTag = decodeURIComponent(tagname);

  const blogs = await fetchBlogs();
  const firstBlogImage = getFirstBlogImage(blogs);

  const topicMetadata = await getPageSeoMetadata(PAGE_NAMES.BLOG, {
    title: null,
    description: null,
    keywords: null,
  });

  const canonicalFromApi = topicMetadata.alternates?.canonical || null;

  return generateSEOMetadata({
    title: `${decodedTag} - ${topicMetadata.title || "Blog"}`,
    description: topicMetadata.description,
    keywords: topicMetadata.keywords,
    path: `/blog/tag/${tagname}`,
    canonicalOverride: canonicalFromApi,
    ogImage: firstBlogImage,
    robots: "index, follow",
  });
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function BlogTagPage({ params }) {
  const { tagname } = await params;
  const decodedTag = decodeURIComponent(tagname);

  const [blogs, topicPageData] = await Promise.all([
    fetchBlogs(),
    fetchTopicPageByName(PAGE_NAMES.BLOG),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.amrita-fashions.com";

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: decodedTag },
  ];

  const breadcrumbStructuredData = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: decodedTag, url: `/blog/tag/${tagname}` },
  ];

  return (
    <>
      <BlogPageJsonLd topicPageData={topicPageData} blogs={blogs} baseUrl={baseUrl} />
      <BreadcrumbJsonLd breadcrumbItems={breadcrumbStructuredData} />

      <Wrapper>
        <HeaderTwo style_2={true} />
        <CompactUniversalBreadcrumb items={breadcrumbItems} />
        <BlogContentWrapper tagname={decodedTag} />
        <Footer primary_style={true} />
      </Wrapper>
    </>
  );
}
