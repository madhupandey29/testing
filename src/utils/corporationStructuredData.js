/**
 * Generate Corporation JSON-LD structured data for all pages
 * @param {Object} companyInfo - Company information from officeInformationApi (AGE company)
 * @param {Object} siteSettings - Site settings from sitesettings API (eCatalogue settings)
 * @returns {Object} JSON-LD structured data object
 */
export const generateCorporationStructuredData = (companyInfo, siteSettings) => {
  // Validate input
  if (!companyInfo || typeof companyInfo !== 'object') {
    console.warn('generateCorporationStructuredData: Invalid companyInfo provided');
    return null;
  }

  try {
    // Get site URL from environment with fallback
    const siteUrl = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SITE_URL) 
      ? process.env.NEXT_PUBLIC_SITE_URL 
      : 'https://www.amrita-fashions.com';
    
    const cleanSiteUrl = String(siteUrl || '').replace(/\/+$/, ''); // Remove trailing slash

    // Build contact points array safely
    const contactPoints = [];
    
    // Add phone1 contact point
    if (companyInfo.phone1 && typeof companyInfo.phone1 === 'string') {
      contactPoints.push({
        "@type": "ContactPoint",
        "telephone": companyInfo.phone1,
        "contactType": (companyInfo.phone1Dept && typeof companyInfo.phone1Dept === 'string') 
          ? companyInfo.phone1Dept.toLowerCase() 
          : "sales",
        "areaServed": Array.isArray(companyInfo.areaServed) && companyInfo.areaServed.length > 0 
          ? companyInfo.areaServed 
          : ["Worldwide"],
        "availableLanguage": Array.isArray(companyInfo.languages) && companyInfo.languages.length > 0 
          ? companyInfo.languages 
          : ["en", "hi", "gu"]
      });
    }

    // Add phone2 contact point (if different from phone1)
    if (companyInfo.phone2 && 
        typeof companyInfo.phone2 === 'string' && 
        companyInfo.phone2 !== companyInfo.phone1) {
      contactPoints.push({
        "@type": "ContactPoint",
        "telephone": companyInfo.phone2,
        "contactType": (companyInfo.phone2Dept && typeof companyInfo.phone2Dept === 'string') 
          ? companyInfo.phone2Dept.toLowerCase() 
          : "sales",
        "areaServed": Array.isArray(companyInfo.areaServed) && companyInfo.areaServed.length > 0 
          ? companyInfo.areaServed 
          : ["Worldwide"],
        "availableLanguage": Array.isArray(companyInfo.languages) && companyInfo.languages.length > 0 
          ? companyInfo.languages 
          : ["en", "hi", "gu"]
      });
    }

    // Build social media URLs array safely
    const sameAs = [];
    const socialUrls = [
      companyInfo.linkedinUrl,
      companyInfo.instagramUrl, 
      companyInfo.facebookUrl,
      companyInfo.youtubeUrl,
      companyInfo.xUrl,
      companyInfo.pinterestUrl
    ];
    
    socialUrls.forEach(url => {
      if (url && typeof url === 'string' && url.trim().length > 0) {
        sameAs.push(url.trim());
      }
    });

    // Build alternate names safely
    const alternateNames = [];
    if (companyInfo.name && typeof companyInfo.name === 'string') {
      alternateNames.push(companyInfo.name);
    }
    alternateNames.push("Amrita Fashions");

    // Build the structured data with safe property access
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Corporation",
      "@id": `${cleanSiteUrl}/#org`,
      "name": (companyInfo.legalName && typeof companyInfo.legalName === 'string') 
        ? companyInfo.legalName 
        : (companyInfo.name && typeof companyInfo.name === 'string') 
          ? companyInfo.name 
          : "Amrita Global Enterprises",
      "alternateName": alternateNames,
      "url": `${cleanSiteUrl}/`,
      "logo": {
        "@type": "ImageObject",
        "url": (companyInfo.faviconUrl && typeof companyInfo.faviconUrl === 'string') 
          ? companyInfo.faviconUrl 
          : `${cleanSiteUrl}/assets/img/logo/logo.png`
      },
      "image": [
        (companyInfo.defaultOgImage && typeof companyInfo.defaultOgImage === 'string') 
          ? companyInfo.defaultOgImage 
          : `${cleanSiteUrl}/assets/img/logo/og-image.jpg`
      ],
      "description": (companyInfo.description && typeof companyInfo.description === 'string') 
        ? companyInfo.description 
        : "B2B wholesale and export supplier of cotton fabrics and textiles.",
      "telephone": (companyInfo.phone1 && typeof companyInfo.phone1 === 'string') 
        ? companyInfo.phone1 
        : "+919824003484",
      "email": (companyInfo.primaryEmail && typeof companyInfo.primaryEmail === 'string') 
        ? companyInfo.primaryEmail 
        : (companyInfo.salesEmail && typeof companyInfo.salesEmail === 'string') 
          ? companyInfo.salesEmail 
          : "sales@amrita-fashions.com",
      "areaServed": Array.isArray(companyInfo.areaServed) && companyInfo.areaServed.length > 0 
        ? companyInfo.areaServed 
        : ["Worldwide"],
      "contactPoint": contactPoints,
      "sameAs": sameAs,
      "knowsAbout": (siteSettings && Array.isArray(siteSettings.knowsAbout) && siteSettings.knowsAbout.length > 0) 
        ? siteSettings.knowsAbout 
        : [
            "Cotton fabrics",
            "Poplin fabric", 
            "Shirting fabric",
            "Textile manufacturing",
            "Wholesale textile supply",
            "Fabric exports"
          ]
    };

    // Add founding year if available
    if (companyInfo.foundingYear && 
        (typeof companyInfo.foundingYear === 'number' || typeof companyInfo.foundingYear === 'string')) {
      structuredData.foundingDate = String(companyInfo.foundingYear);
    }

    // Add address if available
    if ((companyInfo.addressStreet && typeof companyInfo.addressStreet === 'string') || 
        (companyInfo.addressCity && typeof companyInfo.addressCity === 'string')) {
      structuredData.address = {
        "@type": "PostalAddress",
        "streetAddress": (companyInfo.addressStreet && typeof companyInfo.addressStreet === 'string') 
          ? companyInfo.addressStreet 
          : "",
        "addressLocality": (companyInfo.addressCity && typeof companyInfo.addressCity === 'string') 
          ? companyInfo.addressCity 
          : "",
        "addressRegion": (companyInfo.addressState && typeof companyInfo.addressState === 'string') 
          ? companyInfo.addressState 
          : "",
        "postalCode": (companyInfo.addressPostalCode && typeof companyInfo.addressPostalCode === 'string') 
          ? companyInfo.addressPostalCode 
          : "",
        "addressCountry": (companyInfo.addressCountry && typeof companyInfo.addressCountry === 'string') 
          ? companyInfo.addressCountry 
          : "India"
      };
    }

    return structuredData;
  } catch (error) {
    console.error('Error generating corporation structured data:', error);
    return null;
  }
};

/**
 * Generate Corporation JSON-LD script tag
 * @param {Object} companyInfo - Company information from API
 * @param {Object} siteSettings - Site settings from API
 * @returns {string} HTML script tag with JSON-LD
 */
export const generateCorporationJsonLdScript = (companyInfo, siteSettings) => {
  try {
    const structuredData = generateCorporationStructuredData(companyInfo, siteSettings);
    
    if (!structuredData) return '';

    return `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
  } catch (error) {
    console.error('Error generating corporation JSON-LD script:', error);
    return '';
  }
};