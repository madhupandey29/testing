import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import BlogContentWrapper from "@/components/blog/blog-grid/blog-content-wrapper";
import Footer from "@/layout/footers/footer";
import CompactUniversalBreadcrumb from "@/components/breadcrumb/compact-universal-breadcrumb";
import { generateMetadata as generateSEOMetadata } from "@/utils/seo";
import { BreadcrumbJsonLd } from "@/utils/breadcrumbStructuredData";
import { getPageSeoMetadata, fetchTopicPageByName, PAGE_NAMES } from "@/utils/topicPageSeoIntegration";
import { BlogPageJsonLd } from "@/utils/blogPageStructuredData";

// Revalidate every 60 seconds
export const revalidate = 60;

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/,'');
const BLOG_PATH = process.env.NEXT_PUBLIC_API_BLOG_PATH || '/blog';

// Server-side function to fetch blogs
async function fetchBlogs() {
  try {
    const response = await fetch(`${API_BASE}${BLOG_PATH}`, {
      next: { revalidate: 600 } // Cache for 10 minutes
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch blogs');
    }
    
    const data = await response.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }
}

// Extract first blog image from blogs array
function getFirstBlogImage(blogs) {
  if (!Array.isArray(blogs) || blogs.length === 0) return null;
  
  const firstBlog = blogs[0];
  const blogImage1 = firstBlog?.blogimage1;
  const blogImage2 = firstBlog?.blogimage2;
  
  // Handle different image formats
  let imageUrl = null;
  
  if (blogImage1) {
    if (typeof blogImage1 === 'string') {
      imageUrl = blogImage1;
    } else if (typeof blogImage1 === 'object') {
      imageUrl = blogImage1.url || blogImage1.secure_url || blogImage1.src || blogImage1.path;
    }
  }
  
  if (!imageUrl && blogImage2) {
    if (typeof blogImage2 === 'string') {
      imageUrl = blogImage2;
    } else if (typeof blogImage2 === 'object') {
      imageUrl = blogImage2.url || blogImage2.secure_url || blogImage2.src || blogImage2.path;
    }
  }
  
  return imageUrl;
}

/* -----------------------------
  Metadata (Dynamic SEO from Topic Page API)
----------------------------- */
export async function generateMetadata() {
  // Fetch blogs for OG image
  const blogs = await fetchBlogs();
  const firstBlogImage = getFirstBlogImage(blogs);
  
  // Fetch SEO data from topic page API
  const topicMetadata = await getPageSeoMetadata(PAGE_NAMES.BLOG, {
    title: null,
    description: null,
    keywords: null,
  });

  // Extract canonical URL from the metadata object
  const canonicalFromApi = topicMetadata.alternates?.canonical || null;
  
  return generateSEOMetadata({
    title: topicMetadata.title,
    description: topicMetadata.description,
    keywords: topicMetadata.keywords,
    path: "/blog",
    canonicalOverride: canonicalFromApi, // Use canonical from API
    ogImage: firstBlogImage, // Use dynamic first blog image
    robots: "index, follow"
  });
}

export default async function BlogPage() {
  // Fetch blogs and topic page data server-side
  const blogs = await fetchBlogs();
  
  // Fetch RAW topic page data for structured data (not the Next.js metadata)
  const topicPageData = await fetchTopicPageByName(PAGE_NAMES.BLOG);
  
  // Base URL for structured data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.amrita-fashions.com';
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Blog' }
  ];

  // Breadcrumb structured data
  const breadcrumbStructuredData = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' }
  ];

  return (
    <>
      {/* Blog Page Structured Data - Same pattern as BreadcrumbJsonLd */}
      <BlogPageJsonLd 
        topicPageData={topicPageData} 
        blogs={blogs} 
        baseUrl={baseUrl} 
      />
      
      {/* Breadcrumb Structured Data */}
      <BreadcrumbJsonLd breadcrumbItems={breadcrumbStructuredData} />
      
      <Wrapper>
        <HeaderTwo style_2={true} />
        <CompactUniversalBreadcrumb items={breadcrumbItems} />
        <BlogContentWrapper />
        <Footer primary_style={true} />
      </Wrapper>
    </>
  );
}