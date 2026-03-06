/**
 * Generate JSON-LD structured data for product pages
 * @param {Object} product - Product data from API
 * @returns {Object} JSON-LD structured data object
 */
export const generateProductStructuredData = (product) => {
  if (!product) return null;

  // Get base URL from environment
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 
                  'https://www.amrita-fashions.com';

  // Clean slug by removing trailing hash
  const cleanSlug = (slug) => {
    if (!slug || typeof slug !== 'string') return '';
    return slug.trim().replace(/#$/, '');
  };

  // Get product slug
  const productSlug = cleanSlug(
    product.productslug || 
    product.slug || 
    product.aiTempOutput || 
    product.fabricCode ||
    product.id
  );

  // Get product URL
  const productUrl = productSlug ? `${baseUrl}/fabric/${productSlug}` : baseUrl;

  // Collect all available images (filter out empty values)
  const images = [
    product.image1CloudUrlWeb,
    product.image2CloudUrlWeb,
    product.image3CloudUrlWeb,
    product.image1CloudUrl,
    product.image2CloudUrl,
    product.image3CloudUrl,
    product.image1,
    product.image2,
    product.image3,
    product.img,
    product.image
  ].filter(img => img && typeof img === 'string' && img.trim() !== '');

  // Remove duplicates and clean trailing hash
  const uniqueImages = [...new Set(images)].map(img => img.replace(/#$/, ''));

  // Build the Product schema
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "@id": productUrl,
    "name": product.productTitle || product.name || "Product",
    "description": product.fullProductDescription || product.shortProductDescription || product.description || "",
    "url": productUrl
  };

  // Add SKU if available
  if (product.sku || product.fabricCode || product.productIdentifier) {
    productSchema.sku = product.sku || product.fabricCode || product.productIdentifier;
  }

  // Add images (use array if multiple, single string if one)
  if (uniqueImages.length > 0) {
    productSchema.image = uniqueImages.length === 1 ? uniqueImages[0] : uniqueImages;
  }

  // Add brand
  productSchema.brand = {
    "@type": "Brand",
    "name": "Amrita Global Enterprises"
  };

  // ✅ Add aggregateRating (required by Google) - Use real ratings from API
  if (product.ratingValue && product.ratingCount && parseInt(product.ratingCount) > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.ratingValue.toString(),
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": product.ratingCount.toString()
    };
  } else {
    // Fallback: Add offers if no ratings available
    productSchema.offers = {
      "@type": "Offer",
      "url": productUrl,
      "price": "0",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    };
  }

  // ✅ Add additional product properties for rich snippets
  const additionalProperties = [];

  // Content (Material)
  if (product.content) {
    const contentValue = Array.isArray(product.content) 
      ? product.content.join(', ') 
      : product.content;
    if (contentValue && contentValue !== 'N/A') {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Content",
        "value": contentValue
      });
    }
  }

  // Width
  const cmNum = product.cm || product.width;
  const inchNum = product.inch;
  if (cmNum || inchNum) {
    const widthParts = [];
    if (cmNum) widthParts.push(`${cmNum} cm`);
    if (inchNum) widthParts.push(`${Math.round(inchNum)} inch`);
    const widthValue = widthParts.join(' / ');
    if (widthValue) {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Width",
        "value": widthValue
      });
    }
  }

  // Weight (GSM/OZ)
  if (product.gsm || product.oz) {
    const weightParts = [];
    if (product.gsm) weightParts.push(`${product.gsm} gsm`);
    if (product.oz) weightParts.push(`${Number(product.oz).toFixed(1)} oz`);
    const weightValue = weightParts.join(' / ');
    if (weightValue) {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Weight",
        "value": weightValue
      });
    }
  }

  // Design
  if (product.design) {
    const designValue = typeof product.design === 'object' 
      ? product.design.name 
      : product.design;
    if (designValue && designValue !== 'N/A') {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Design",
        "value": designValue
      });
    }
  }

  // Structure
  if (product.structure && product.structure !== 'N/A') {
    additionalProperties.push({
      "@type": "PropertyValue",
      "name": "Structure",
      "value": product.structure
    });
  }

  // Colors
  if (product.colors || product.color) {
    const colorsArray = Array.isArray(product.colors) 
      ? product.colors 
      : Array.isArray(product.color) 
        ? product.color 
        : [];
    const colorNames = colorsArray
      .map(c => typeof c === 'string' ? c : c?.name)
      .filter(Boolean);
    if (colorNames.length > 0) {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Colors",
        "value": colorNames.join(', ')
      });
    }
  }

  // Motif
  if (product.motif || product.motifsize) {
    const motifValue = typeof product.motif === 'object' 
      ? (product.motif.name || product.motif.size) 
      : (product.motif || product.motifsize);
    if (motifValue && motifValue !== 'N/A') {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Motif",
        "value": motifValue
      });
    }
  }

  // Sales MOQ
  if (product.salesMOQ) {
    const moqValue = product.uM 
      ? `${product.salesMOQ} ${product.uM}` 
      : product.salesMOQ;
    additionalProperties.push({
      "@type": "PropertyValue",
      "name": "Sales MOQ",
      "value": moqValue.toString()
    });
  }

  // Finish
  if (product.finish) {
    let finishArray = [];
    if (Array.isArray(product.finish)) {
      finishArray = product.finish.filter(Boolean);
    } else {
      const str = String(product.finish);
      finishArray = str
        .split(/[•,;]|\s-\s/)
        .map(s => s.trim())
        .filter(Boolean);
    }
    
    // Clean up finish values
    const cleanedFinishArray = finishArray.map(finish => {
      let cleaned = finish.trim();
      cleaned = cleaned.replace(/^Chemical\s*-\s*/i, '');
      cleaned = cleaned.replace(/^Mechanical\s*-\s*/i, '');
      return cleaned;
    }).filter(Boolean);
    
    if (cleanedFinishArray.length > 0) {
      additionalProperties.push({
        "@type": "PropertyValue",
        "name": "Finish",
        "value": cleanedFinishArray.join(', ')
      });
    }
  }

  // Add additionalProperty to schema if we have any
  if (additionalProperties.length > 0) {
    productSchema.additionalProperty = additionalProperties;
  }

  return productSchema;
};

/**
 * Generate JSON-LD script tag for product pages
 * @param {Object} product - Product data from API
 * @returns {string} HTML script tag with JSON-LD
 */
export const generateProductJsonLdScript = (product) => {
  const structuredData = generateProductStructuredData(product);
  
  if (!structuredData) return '';

  return `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
};