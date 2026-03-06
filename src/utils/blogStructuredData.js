// utils/blogStructuredData.js

/**
 * Generate BlogPosting structured data for SEO
 * @param {Object} blog - Blog data from API
 * @param {Object} author - Author data from API
 * @param {string} baseUrl - Website base URL
 * @returns {Object} JSON-LD structured data
 */
export const generateBlogStructuredData = (blog, author, baseUrl) => {
  if (!blog) return null;

  // Clean HTML from title for structured data
  const cleanTitle = blog.title?.replace(/<[^>]*>/g, '') || '';
  
  // Description: Use excerpt field from blog API (now available in every blog)
  let description = 'Read our detailed blog post about fabrics, textiles, and fashion trends.';
  
  if (blog.excerpt && blog.excerpt.trim()) {
    description = blog.excerpt.trim();
  } else {
    // Fallback to paragraph1 only if excerpt is truly missing
    if (blog.paragraph1) {
      const cleanParagraph1 = blog.paragraph1.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanParagraph1.length > 10) {
        description = cleanParagraph1.substring(0, 160) + '...';
      }
    }
  }

  // Get the main blog image
  const blogImage = blog.blogimage1 || blog.blogimage2 || null;

  // Author handling - ALWAYS use author API data if available
  let authorName = 'Admin';
  let authorUrl = undefined;

  if (author && author.name) {
    authorName = author.name;
    authorUrl = author.authorLinkedinURL;
  }

  // Build the structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog-details/${blog.slug || blog.id}`
    },
    headline: cleanTitle,
    description: description,
    author: {
      '@type': 'Person',
      name: authorName
    },
    publisher: {
      '@type': 'Organization',
      name: 'Amrita Global Enterprise',
      logo: {
        '@type': 'ImageObject',
        url: blogImage || `${baseUrl}/assets/img/logo/logo.png`
      }
    },
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.modifiedAt || blog.publishedAt || blog.createdAt
  };

  // Add image if available
  if (blogImage) {
    structuredData.image = blogImage;
  }

  // Add author URL if available
  if (authorUrl) {
    structuredData.author.url = authorUrl;
  }

  // Add optional fields from blog API if available
  if (blog.category) {
    structuredData.articleSection = blog.category;
  }

  if (blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0) {
    structuredData.keywords = blog.tags.join(', ');
  }

  if (blog.readingTimeMin) {
    structuredData.timeRequired = `PT${blog.readingTimeMin}M`;
  }

  // Add word count if available
  if (blog.wordCount) {
    structuredData.wordCount = blog.wordCount;
  }

  // Add inLanguage
  structuredData.inLanguage = 'en-US';

  return structuredData;
};

/**
 * BlogPosting JSON-LD Component for Next.js pages
 * @param {Object} blog - Blog data from API
 * @param {Object} author - Author data from API
 * @param {string} baseUrl - Website base URL
 * @returns {JSX.Element} - Script tag with JSON-LD
 */
export function BlogPostingJsonLd({ blog, author, baseUrl }) {
  // Don't render if blog is completely missing
  if (!blog) {
    console.warn('BlogPostingJsonLd: No blog data provided');
    return null;
  }
  
  const structuredData = generateBlogStructuredData(blog, author, baseUrl);
  
  if (!structuredData) {
    console.warn('BlogPostingJsonLd: Failed to generate structured data');
    return null;
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Generate BreadcrumbList structured data for blog details
 * @param {Object} blog - Blog data from API
 * @param {string} baseUrl - Website base URL
 * @returns {Object} JSON-LD structured data
 */
export const generateBlogBreadcrumbStructuredData = (blog, baseUrl) => {
  if (!blog) return null;

  const cleanTitle = blog.title?.replace(/<[^>]*>/g, '') || 'Blog Post';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${baseUrl}/blog`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cleanTitle,
        item: `${baseUrl}/blog-details/${blog.slug || blog.id}`
      }
    ]
  };
};