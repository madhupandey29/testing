/**
 * Generate Blog Page Structured Data (JSON-LD)
 * Creates a CollectionPage schema with ItemList of blog posts
 * Following Google's best practices for blog listing pages
 * 
 * @param {Object} topicPageData - SEO data from topic page API (name: "blog")
 * @param {Array} blogs - Array of blog posts from blog API
 * @param {string} baseUrl - Base URL of the website
 * @returns {Object} Blog structured data object
 */
export function generateBlogPageStructuredData(topicPageData, blogs = [], baseUrl = 'https://www.amrita-fashions.com') {
  // Ensure baseUrl doesn't have trailing slash
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  
  // Extract data from topic page SEO
  const blogTitle = topicPageData?.metaTitle || topicPageData?.name || 'Blog';
  const blogDescription = topicPageData?.description || topicPageData?.excerpt || 'Read our latest articles and insights';
  
  // Handle canonical URL - must match exactly with page canonical
  let canonicalUrl = `${cleanBaseUrl}/blog`;
  if (topicPageData?.canonicalUrl) {
    if (topicPageData.canonicalUrl.startsWith('http')) {
      canonicalUrl = topicPageData.canonicalUrl;
    } else {
      // Remove any domain/www prefix from canonicalUrl
      const cleanCanonical = topicPageData.canonicalUrl
        .replace(/^(https?:\/\/)?(www\.)?[^/]+\/?/, '')
        .replace(/^\/+/, '');
      canonicalUrl = `${cleanBaseUrl}/${cleanCanonical}`;
    }
  }
  
  // Filter valid blogs (must have title and slug/id)
  const validBlogs = Array.isArray(blogs) 
    ? blogs.filter(blog => blog && (blog.title || blog.name) && (blog.slug || blog.id || blog._id))
    : [];
  
  // Remove duplicates by URL
  const seenUrls = new Set();
  const uniqueBlogs = validBlogs.filter(blog => {
    let slug = blog.slug || blog.id || blog._id;
    if (slug && slug.includes('http')) {
      const urlParts = slug.split('/');
      slug = urlParts[urlParts.length - 1] || blog.id || blog._id;
    }
    const url = `${cleanBaseUrl}/blog-details/${slug}`;
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });
  
  // Create ItemList elements from blogs - proper format for Google
  const itemListElements = uniqueBlogs.map((blog, index) => {
    // Extract slug from URL if it's a full URL, otherwise use as-is
    let slug = blog.slug || blog.id || blog._id;
    if (slug && slug.includes('http')) {
      const urlParts = slug.split('/');
      slug = urlParts[urlParts.length - 1] || blog.id || blog._id;
    }
    
    // Clean title (remove HTML tags)
    const cleanTitle = (blog.title || blog.name || 'Blog Post')
      .replace(/<[^>]*>/g, '')
      .trim();
    
    // Full absolute URL (no relative URLs, no query params, no fragments)
    const itemUrl = `${cleanBaseUrl}/blog-details/${slug}`;
    
    return {
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "BlogPosting",
        "@id": itemUrl,
        "url": itemUrl,
        "name": cleanTitle,
        "headline": cleanTitle
      }
    };
  });
  
  // Build the CollectionPage structured data (better than Blog for listing pages)
  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonicalUrl,
    "url": canonicalUrl,
    "name": blogTitle,
    "description": blogDescription,
    "publisher": {
      "@id": `${cleanBaseUrl}/#org`
    }
  };
  
  // Add mainEntity ItemList only if there are valid blogs
  if (itemListElements.length > 0) {
    blogStructuredData.mainEntity = {
      "@type": "ItemList",
      "itemListOrder": "https://schema.org/ItemListOrderDescending",
      "numberOfItems": itemListElements.length,
      "itemListElement": itemListElements
    };
  }
  
  return blogStructuredData;
}

/**
 * Generate Blog Page JSON-LD script tag content
 * 
 * @param {Object} topicPageData - SEO data from topic page API
 * @param {Array} blogs - Array of blog posts
 * @param {string} baseUrl - Base URL of the website
 * @returns {string} JSON-LD script content
 */
export function generateBlogPageJsonLd(topicPageData, blogs = [], baseUrl = 'https://www.amrita-fashions.com') {
  const structuredData = generateBlogPageStructuredData(topicPageData, blogs, baseUrl);
  return JSON.stringify(structuredData, null, 2);
}

/**
 * Blog Page JSON-LD Component for Next.js pages
 * Same pattern as BreadcrumbJsonLd - renders a script tag with Blog structured data
 * 
 * @param {Object} props - Component props
 * @param {Object} props.topicPageData - SEO data from topic page API
 * @param {Array} props.blogs - Array of blog posts
 * @param {string} props.baseUrl - Base URL of the website
 * @returns {JSX.Element} Script tag with JSON-LD
 */
export function BlogPageJsonLd({ topicPageData, blogs = [], baseUrl = 'https://www.amrita-fashions.com' }) {
  const structuredData = generateBlogPageStructuredData(topicPageData, blogs, baseUrl);
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

