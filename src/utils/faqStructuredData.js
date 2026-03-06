/**
 * Generate FAQ Structured Data (JSON-LD) for SEO
 * Combines product-specific FAQs and website-wide FAQs
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
 * Generate FAQ structured data from product and website FAQs
 * @param {Object} product - Product data with productQ1-Q6 and productA1-A6
 * @param {Array} websiteFaqs - Array of website FAQ objects with question1-4 and answer1-4
 * @returns {Object} FAQ structured data object
 */
export function generateFaqStructuredData(product = {}, websiteFaqs = []) {
  const mainEntity = [];

  // 1. Add website FAQs first (question1-4, answer1-4)
  if (Array.isArray(websiteFaqs) && websiteFaqs.length > 0) {
    websiteFaqs.forEach((faq) => {
      for (let i = 1; i <= 4; i++) {
        const question = faq?.[`question${i}`];
        const answer = faq?.[`answer${i}`];
        
        if (nonEmpty(question) && nonEmpty(answer)) {
          mainEntity.push({
            "@type": "Question",
            "name": stripHtml(String(question)),
            "acceptedAnswer": {
              "@type": "Answer",
              "text": stripHtml(String(answer))
            }
          });
        }
      }
    });
  }

  // 2. Add product-specific FAQs (productQ1-Q6, productA1-A6)
  for (let i = 1; i <= 6; i++) {
    const question = product?.[`productQ${i}`] || product?.[`productquestion${i}`];
    const answer = product?.[`productA${i}`] || product?.[`productanswer${i}`];
    
    if (nonEmpty(question) && nonEmpty(answer)) {
      mainEntity.push({
        "@type": "Question",
        "name": stripHtml(String(question)),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": stripHtml(String(answer))
        }
      });
    }
  }

  // Only return FAQ structured data if we have at least one FAQ
  if (mainEntity.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": mainEntity
  };
}

/**
 * Generate FAQ Script Tag for Next.js pages
 * @param {Object} product - Product data
 * @param {Array} websiteFaqs - Website FAQ data
 * @returns {JSX.Element} - Script tag with JSON-LD
 */
export function FaqJsonLd({ product, websiteFaqs }) {
  const structuredData = generateFaqStructuredData(product, websiteFaqs);
  
  // Don't render if no FAQs
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
