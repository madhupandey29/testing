/**
 * Generate Collection ItemList Structured Data (JSON-LD) for SEO
 * Shows related products from the same collection in Mix and Match section
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
  // Try multiple environment variables
  return process.env.NEXT_PUBLIC_BASE_URL || 
         process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 
         'https://www.amrita-fashions.com';
};

/**
 * Generate Collection ItemList structured data from related products
 * @param {Array} products - Array of related products from the collection
 * @param {Object} currentProduct - Current product being viewed
 * @param {Object} collectionData - Collection metadata (optional)
 * @returns {Object} ItemList structured data object
 */
export function generateCollectionItemListStructuredData(products = [], currentProduct = {}, collectionData = null) {
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

  // Get collection name and description
  const currentProductTitle = currentProduct?.productTitle || currentProduct?.name || 'Product';
  
  const collectionName = collectionData?.name || 
                        collectionData?.collectionName || 
                        currentProduct?.collection?.name ||
                        `${currentProductTitle} - Related Fabrics`;
  
  const collectionDescription = collectionData?.description || 
                               collectionData?.collectionDescription ||
                               currentProduct?.collection?.description ||
                               `Explore our curated collection of ${itemListElement.length} premium fabrics that complement ${currentProductTitle} perfectly. Mix and match these fabrics for your creative projects.`;

  // Get current page URL
  const currentSlug = cleanSlug(
    currentProduct?.productslug || 
    currentProduct?.slug || 
    currentProduct?.aiTempOutput ||
    currentProduct?.fabricCode ||
    currentProduct?.id
  );
  const currentUrl = currentSlug ? `${baseUrl}/fabric/${currentSlug}` : baseUrl;

  // ItemList is valid Schema.org and helps SEO
  // Note: Google Rich Results Test may not show it in summary, but it's still working
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": stripHtml(String(collectionName)),
    "description": stripHtml(String(collectionDescription)),
    "url": currentUrl,
    "itemListOrder": "https://schema.org/ItemListUnordered",
    "numberOfItems": itemListElement.length,
    "itemListElement": itemListElement
  };
}

/**
 * Generate Collection ItemList Script Tag for Next.js pages
 * Note: Using ItemList instead of CollectionPage for Google Rich Results support
 * @param {Array} products - Related products from collection
 * @param {Object} currentProduct - Current product being viewed
 * @param {Object} collectionData - Collection metadata
 * @returns {JSX.Element} - Script tag with JSON-LD
 */
export function CollectionItemListJsonLd({ products, currentProduct, collectionData }) {
  const structuredData = generateCollectionItemListStructuredData(products, currentProduct, collectionData);
  
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
