// app/blog-details/[id]/page.jsx
import HeaderTwo from "@/layout/headers/header-2";
import Wrapper from "@/layout/wrapper";
import Footer from "@/layout/footers/footer";
import BlogDetailsArea from "@/components/blog-details/blog-details-area";
import BlogDetailsBreadcrumb from "@/components/breadcrumb/blog-details-breadcrumb";
import { generateMetadata as generateSEOMetadata } from "@/utils/seo";
import { BlogPostingJsonLd } from "@/utils/blogStructuredData";
import { BreadcrumbJsonLd } from "@/utils/breadcrumbStructuredData";

// ─── ISR: revalidate blog detail pages every 10 minutes ───────────────────
export const revalidate = 600;

// true = new blog slugs that appear after the last build are
//        generated on-demand and then cached as static pages.
export const dynamicParams = true;

const stripTrailingSlash = (s = "") => String(s || "").replace(/\/+$/, "");

const API_BASE = stripTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
);
const BLOG_PATH = process.env.NEXT_PUBLIC_API_BLOG_PATH || "/blog";

/* ─── Shared: fetch all blogs (ISR-cached) ─────────────────────────────── */
async function getAllBlogs() {
  try {
    const res = await fetch(`${API_BASE}${BLOG_PATH}`, {
      next: { revalidate }, // ISR-cached – NOT no-store
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

/* ─── Find single blog by id or slug ───────────────────────────────────── */
async function getBlog(slugOrId) {
  // 1. Try fetching the single item directly (fast path)
  try {
    const idRes = await fetch(`${API_BASE}${BLOG_PATH}/${slugOrId}`, {
      next: { revalidate },
    });
    if (idRes.ok) {
      const idJson = await idRes.json();
      if (idJson?.data) return idJson.data;
    }
  } catch {
    // fall through to list search
  }

  // 2. Search by slug across the full list
  try {
    const blogs = await getAllBlogs();
    return (
      blogs.find((blog) => {
        if (!blog.slug) return false;
        if (blog.slug.includes("http")) {
          const parts = blog.slug.split("/");
          return parts[parts.length - 1] === slugOrId;
        }
        return blog.slug === slugOrId;
      }) || null
    );
  } catch {
    return null;
  }
}

/* ─── Author (ISR-cached) ───────────────────────────────────────────────── */
async function getAuthor() {
  try {
    const res = await fetch(`${API_BASE}/author`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const data = await res.json();

    if (data?.name)                           return data;
    if (data?.data?.name)                     return data.data;
    if (Array.isArray(data) && data[0]?.name) return data[0];
    if (Array.isArray(data?.data) && data.data[0]?.name) return data.data[0];
    return null;
  } catch {
    return null;
  }
}

/* ─── generateStaticParams ───────────────────────────────────────────────────
   Pre-builds every blog-detail page at build time.
   New blogs added after the build are handled by on-demand ISR.
────────────────────────────────────────────────────────────────────────────── */
export async function generateStaticParams() {
  try {
    const blogs = await getAllBlogs();
    const ids = [];

    for (const blog of blogs) {
      // Prefer the blog's own slug; fall back to its ID
      const rawSlug = blog?.slug || blog?._id || blog?.id;
      if (!rawSlug) continue;

      // If the slug is a full URL, take only the last path segment
      let id = rawSlug;
      if (String(rawSlug).includes("http")) {
        const parts = String(rawSlug).split("/");
        id = parts[parts.length - 1];
      }

      if (id) ids.push({ id });
    }

    return ids;
  } catch {
    // If the API is unreachable at build time, fall back to on-demand ISR.
    return [];
  }
}

/* ─── Tags → keywords helper ────────────────────────────────────────────── */
function tagsToKeywords(blog) {
  const tags = Array.isArray(blog?.tags) ? blog.tags : [];
  const clean = tags.map((t) => String(t || "").trim()).filter(Boolean);
  if (!clean.length) return undefined;

  const seen = new Set();
  const unique = [];
  for (const t of clean) {
    const key = t.toLowerCase();
    if (!seen.has(key)) { seen.add(key); unique.push(t); }
  }
  return unique.join(", ");
}

/* ─── Metadata ───────────────────────────────────────────────────────────── */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const blog = await getBlog(id);

  const title       = blog?.title ? `${blog.title}` : "Blog Details";
  const description = blog?.excerpt || "Read our detailed blog post about fabrics, textiles, and fashion trends.";

  const blogImage = blog?.blogimage1 || blog?.blogimage2 || null;
  let ogImageUrl = null;
  if (blogImage) {
    ogImageUrl = typeof blogImage === "string"
      ? blogImage
      : blogImage.url || blogImage.secure_url || blogImage.src || blogImage.path;
  }

  return generateSEOMetadata({
    title,
    description,
    keywords: tagsToKeywords(blog),
    path: `/blog-details/${id}`,
    ogImage: ogImageUrl,
    robots: "index, follow",
  });
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default async function BlogDetails({ params }) {
  const { id } = await params;

  const [blog, author] = await Promise.all([getBlog(id), getAuthor()]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.amrita-fashions.com";
  const blogTitle = blog?.title || "Article";

  const breadcrumbJsonLdData = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: blogTitle, url: `/blog-details/${id}` },
  ];

  return (
    <>
      <BlogPostingJsonLd blog={blog} author={author} baseUrl={baseUrl} />
      <BreadcrumbJsonLd breadcrumbItems={breadcrumbJsonLdData} />

      <Wrapper>
        <HeaderTwo style_2 />

        <h1
          style={{
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: "1px",
            height: "1px",
            overflow: "hidden",
          }}
        >
          {blog?.title || "Blog Details - Latest Article"}
        </h1>

        <BlogDetailsBreadcrumb blogTitle={blog?.title} />
        <BlogDetailsArea blog={blog} />
        <Footer primary_style />
      </Wrapper>
    </>
  );
}
