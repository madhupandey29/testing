/**
 * Blog Page JSON-LD Component
 * Renders Blog structured data for SEO
 */

import { generateBlogPageStructuredData } from '@/utils/blogPageStructuredData';

/**
 * Blog Page JSON-LD Component for Next.js pages
 * Renders a script tag with Blog structured data
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
