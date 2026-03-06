/**
 * Generate Fabric Collection ItemList Structured Data (JSON-LD) for SEO
 * Shows all fabric products in the collection page for better search visibility
 */

/**
 * Helper to check if value is non-empty
 */
const nonEmpty = (v) => {
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== null && (typeof v === 'number' || String(v).trim() !== '');
};

/**
 * Strip HTML tags from text
 */
const stripHtml = (html) => {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Clean slug by removing trailing hash
 */
const cleanSlug = (slug) => {
  if (!slug || typeof slug !== 'string') return '';
  return slug.trim().replace(/#$/, '');
};

/**
 * Get base URL from environment
 */
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || 
         process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 
         'https://www.amrita-fashions.com';
};

/**
 * Generate Fabric Collection ItemList structured data
 * @param {Array} products - Array of all fabric products
 * @param {Object} options - Additional options (filtered, filterTag, etc.)
 * @returns {Object} ItemList structured data object
 */
export function generateFabricCollectionStructuredData(products = [], options = {}) {
  // Don't generate if no products
  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  const baseUrl = getBaseUrl();
  const itemListElement = [];

  // Build item list from products
  products.forEach((product, index) => {
    // Get product title
    const productTitle = product?.productTitle || product?.name || product?.title;
    
    // Get product slug
    const productSlug = cleanSlug(
      product?.productslug || 
      product?.slug || 
      product?.aiTempOutput || 
      product?.fabricCode ||
      product?.id
    );

    // Get product image
    const productImage = product?.image1CloudUrlWeb || product?.image1CloudUrl || product?.image1 || product?.img || product?.image || '';

    // Get rating data
    const ratingValue = product?.ratingValue;
    const ratingCount = product?.ratingCount;

    // Only add if we have both title and slug
    if (nonEmpty(productTitle) && nonEmpty(productSlug)) {
      const productUrl = `${baseUrl}/fabric/${productSlug}`;
      
      const listItem = {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "@id": productUrl,
          "name": stripHtml(String(productTitle)),
          "url": productUrl
        }
      };

      // Add image if available
      if (nonEmpty(productImage)) {
        listItem.item.image = productImage;
      }

      // ✅ Add aggregateRating if available (preferred), otherwise add offers
      if (ratingValue && ratingCount && parseInt(ratingCount) > 0) {
        listItem.item.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": ratingValue.toString(),
          "bestRating": "5",
          "worstRating": "1",
          "ratingCount": ratingCount.toString()
        };
      } else {
        // Fallback to offers if no ratings
        listItem.item.offers = {
          "@type": "Offer",
          "url": productUrl,
          "price": "0",
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock"
        };
      }

      itemListElement.push(listItem);
    }
  });

  // Don't generate if no valid items
  if (itemListElement.length === 0) {
    return null;
  }

  // Generate collection name and description
  const collectionName = options.filtered && options.filterTag
    ? `${options.filterTag} Fabric Collection`
    : 'Premium Fabric Collection';
  
  const collectionDescription = options.filtered && options.filterTag
    ? `Explore our curated ${options.filterTag} collection featuring ${itemListElement.length} premium fabrics. High-quality textiles including cotton, mercerized, and designer fabrics for all your creative projects.`
    : `Discover our complete fabric collection featuring ${itemListElement.length} premium textiles. From cotton to mercerized and designer fabrics, find the perfect material for your creative projects.`;

  // ItemList structured data
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": collectionName,
    "description": stripHtml(collectionDescription),
    "url": `${baseUrl}/fabric`,
    "itemListOrder": "http://schema.org/ItemListUnordered",
    "numberOfItems": itemListElement.length,
    "itemListElement": itemListElement
  };
}

/**
 * Generate Fabric Collection ItemList Script Tag for Next.js pages
 * @param {Array} products - All fabric products
 * @param {Object} options - Additional options
 * @returns {JSX.Element} - Script tag with JSON-LD
 */
export function FabricCollectionJsonLd({ products, options = {} }) {
  const structuredData = generateFabricCollectionStructuredData(products, options);
  
  // Don't render if no valid data
  if (!structuredData) {
    return null;
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
