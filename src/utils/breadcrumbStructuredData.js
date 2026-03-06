/**
 * Generate Breadcrumb Structured Data (JSON-LD) for SEO
 * @param {Array} breadcrumbItems - Array of breadcrumb items [{ name, url }]
 * @returns {Object} - Breadcrumb structured data object
 */
export function generateBreadcrumbStructuredData(breadcrumbItems) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.amrita-fashions.com';
  
  // Remove trailing slash from base URL
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  
  const itemListElement = breadcrumbItems.map((item, index) => {
    // Construct full URL
    const itemUrl = item.url.startsWith('http') 
      ? item.url 
      : `${cleanBaseUrl}${item.url.startsWith('/') ? item.url : `/${item.url}`}`;
    
    return {
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": itemUrl
    };
  });
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": itemListElement
  };
}

/**
 * Generate Breadcrumb Script Tag for Next.js pages
 * @param {Array} breadcrumbItems - Array of breadcrumb items [{ name, url }]
 * @returns {JSX.Element} - Script tag with JSON-LD
 */
export function BreadcrumbJsonLd({ breadcrumbItems }) {
  const structuredData = generateBreadcrumbStructuredData(breadcrumbItems);
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
